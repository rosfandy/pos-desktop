// Inspect existing pos.db
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.join(process.cwd(), 'data', 'pos.db');
if (!fs.existsSync(DB_PATH)) {
  console.log('No DB found');
  process.exit(0);
}

const { size } = fs.statSync(DB_PATH);
console.log(`DB size: ${size} bytes`);

// Check if sqlite3 CLI is available
try {
  // Use npm sqlite3 to query
  const Sqlite3 = require('sqlite3').verbose();
  const db = new Sqlite3.Database(DB_PATH);

  db.serialize(() => {
    // List tables
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err: any, rows: any[]) => {
      if (err) console.error('Tables error:', err.message);
      else {
        console.log('\n=== TABLES ===');
        rows.forEach((r) => console.log(' ', r.name));
      }
    });

    // Categories
    db.all('SELECT id, name, parent_id FROM categories ORDER BY name', (err: any, rows: any[]) => {
      if (err) console.error('Categories error:', err.message);
      else {
        console.log('\n=== CATEGORIES ===');
        if (rows.length === 0) console.log('  (none)');
        rows.forEach((r) => console.log(`  ${r.id}: ${r.name}`));
      }
    });

    // Product units
    db.get('SELECT COUNT(*) as cnt FROM product_units', (err: any, row: any) => {
      if (err) console.error('product_units error:', err.message);
      else console.log(`\n=== PRODUCT_UNITS: ${row.cnt} rows ===`);
    });

    // Products count
    db.get('SELECT COUNT(*) as cnt FROM products', (err: any, row: any) => {
      if (err) console.error('products error:', err.message);
      else console.log(`\n=== PRODUCTS: ${row.cnt} rows ===`);
    });

    // Product columns
    db.all("PRAGMA table_info(products)", (err: any, rows: any[]) => {
      if (err) console.error('PRAGMA error:', err.message);
      else {
        console.log('\n=== PRODUCT COLUMNS ===');
        rows.forEach((r) => console.log(`  ${r.name} (${r.type})`));
      }
    });

    // Migration table
    db.all('SELECT hash, created_at FROM drizzle_migrations', (err: any, rows: any[]) => {
      if (err) console.error('Migrations error:', err.message);
      else {
        console.log('\n=== APPLIED MIGRATIONS ===');
        if (rows.length === 0) console.log('  (none)');
        rows.forEach((r) => console.log(`  ${r.hash} @ ${r.created_at}`));
      }
    });

    setTimeout(() => db.close(), 1000);
  });
} catch (e) {
  console.error('sqlite3 not available:', e.message);
  console.log('Trying with better-sqlite3…');
  try {
    const Database = require('better-sqlite3');
    const db = new Database(DB_PATH);
    console.log('\n=== TABLES (better-sqlite3) ===');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    tables.forEach((t: any) => console.log(' ', t.name));
    db.close();
  } catch (e2) {
    console.error('better-sqlite3 also not available:', e2.message);
  }
}
