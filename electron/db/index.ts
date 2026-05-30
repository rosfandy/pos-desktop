import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { app } from 'electron';

// Resolve migrations directory — dev vs production
const isProd = app.isPackaged;
const MIGRATIONS_DIR = isProd
  ? join(process.resourcesPath, 'data')
  : join(process.cwd(), 'electron', 'database', 'migrations');

// Resolve sql-wasm.wasm path — dev vs production
function getSqlWasmPath(): string {
  if (isProd) {
    return join(dirname(require.resolve('sql.js')), 'sql-wasm.wasm');
  }
  return join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
}

// ── Init sql.js ────────────────────────────────────────────────────────────
let _sql: Awaited<ReturnType<typeof initSqlJs>> | null = null;
let _db: SqlJsDatabase | null = null;
let _dbPath: string | null = null;
let _dbMtime: number = 0;

/** Returns the database file path on disk */
export function getDbPath(): string {
  return join(app.getPath('userData'), 'pos.db');
}

/** @returns {Promise<SqlJsDatabase>} */
export async function getDb(): Promise<SqlJsDatabase> {
  const dbDir = app.getPath('userData');
  const dbPath = join(dbDir, 'pos.db');

  console.log('[DB] path:', dbPath);

  if (!_sql) _sql = await initSqlJs({ locateFile: () => getSqlWasmPath() });
  const SQL = _sql;

  // Reload from disk if the DB file was modified since last load
  if (_db && _dbPath) {
    try {
      const currentMtime = statSync(dbPath).mtimeMs;
      if (currentMtime !== _dbMtime) {
        // DB file changed on disk — reload
        _dbMtime = currentMtime;
        const buffer = readFileSync(dbPath);
        _db = new SQL.Database(buffer);
      }
    } catch {
      // If we can't stat the file (e.g. doesn't exist yet), fall through to fresh load
      _db = null;
      _dbMtime = 0;
    }
  }

  if (_db) return _db;

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    _db = new SQL.Database(buffer);
    try { _dbMtime = statSync(dbPath).mtimeMs; } catch { /* ignore */ }
  } else {
    _db = new SQL.Database();
  }
  _dbPath = dbPath;

  // Auto-save to disk after every write operation (transaction-aware)
  const origRun = _db!.run.bind(_db);
  const origExec = _db!.exec.bind(_db);

  let _inTransaction = false;

  function isWriteOp(sql: string): boolean {
    return /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)/i.test(sql.trim());
  }

  (_db as any).run = (sql: string, params?: any[]) => {
    const result = origRun(sql, params);
    if (typeof sql === 'string') {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('BEGIN')) {
        _inTransaction = true;
      } else if (trimmed.startsWith('COMMIT')) {
        _inTransaction = false;
        saveDb(_db!);
      } else if (trimmed.startsWith('ROLLBACK')) {
        _inTransaction = false;
      } else if (!_inTransaction && isWriteOp(sql)) {
        saveDb(_db!);
      }
    }
    return result;
  };
  (_db as any).exec = (sql: string, params?: unknown[]) => {
    const result = origExec(sql, params);
    if (typeof sql === 'string' && !_inTransaction && isWriteOp(sql)) {
      saveDb(_db!);
    }
    return result;
  };

  return _db!;
}

/** Persist the in-memory DB to disk. Call after every write. */
function saveDb(db: SqlJsDatabase): void {
  const dbPath = join(app.getPath('userData'), 'pos.db');
  const data = db.export();
  writeFileSync(dbPath, Buffer.from(data));
  try { _dbMtime = statSync(dbPath).mtimeMs; _dbPath = dbPath; } catch { /* ignore */ }
}

/** Close the current DB connection. */
export async function closeDb(): Promise<void> {
  if (_db) {
    // sql.js Database has no close method; just release reference
    _db = null;
  }
}

/** Atomically copy DB file to target path (for backup). */
export async function copyDbFile(targetPath: string): Promise<void> {
  const db = await getDb();
  saveDb(db); // ensure latest is on disk
  const srcPath = join(app.getPath('userData'), 'pos.db');
  const targetDir = dirname(targetPath);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  copyFileSync(srcPath, targetPath);
}

// ─── Migrations ─────────────────────────────────────────────────────────────

export async function migrate(): Promise<void> {
  const db = await getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const rows = db.exec('SELECT hash FROM drizzle_migrations');
  const applied = new Set<string>((rows[0]?.values ?? []).map((r) => String(r[0])));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    const hash = createHash('md5').update(sql).digest('hex');
    if (applied.has(hash)) continue;

    // Run each statement individually; track errors
    const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
    let hadError = false;

    for (const stmt of statements) {
      try {
        db.run(stmt);
      } catch (e) {
        console.error(`[MIGRATION]  ERROR in ${file}:`, e);
        hadError = true;
      }
    }

    // Only record hash if all statements succeeded
    if (!hadError) {
      db.run('INSERT INTO drizzle_migrations (hash) VALUES (?)', [hash]);
      console.log(`[MIGRATION]  ✓ ${file} applied (${statements.length} statements)`);
      count++;
    } else {
      console.error(`[MIGRATION]  ✗ ${file} had errors — hash NOT recorded, will retry next startup`);
    }
  }

  saveDb(db);

  if (count > 0) {
    console.log(`[DB] Applied ${count} migration(s).`);
  }
}

// ─── Seed ───────────────────────────────────────────────────────────────────

const DEFAULT_ADMIN_PIN = '123456';

export async function seedAdmin(): Promise<void> {
  const db = await getDb();
  const rows = db.exec('SELECT id FROM users LIMIT 1');
  if (rows[0]?.values.length) return;

  const id = crypto.randomUUID();
  const pinHash = await bcrypt.hash(DEFAULT_ADMIN_PIN, 12);

  db.run(
    'INSERT INTO users (id, name, email, pin, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, 'Administrator', 'admin@pos.local', pinHash, pinHash, 'admin', 1]
  );
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", ['storeName', 'Toko Saya']);
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", ['storeAddress', '']);
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", ['taxRate', '0']);
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", ['receipt_header', 'Terima Kasih']);
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", ['receipt_footer', 'Barang yang sudah dibeli tidak dapat dikembalikan']);
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", ['receipt_show_logo', 'false']);
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", ['receipt_show_tax_breakdown', 'true']);
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", ['receipt_show_qr', 'false']);

  saveDb(db);
  console.log('[DB] Default admin user created (PIN: 123456)');
}
