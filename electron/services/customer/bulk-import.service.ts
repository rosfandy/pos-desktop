import * as XLSX from 'xlsx';
import { getDb } from '../../db/index.ts';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerImportRow {
  rowIndex: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  points: number;
  tier: string;
  totalSpent: number;
}

export interface CustomerImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  errors: Array<{ row: number; field?: string; message: string }>;
}

export interface CustomerPreviewResult {
  rows: CustomerImportRow[];
  totalRows: number;
  errors: Array<{ row: number; message: string }>;
}

// ─── Column mapping ────────────────────────────────────────────────────────────

const COLUMN_ALIASES: Record<string, string[]> = {
  name:       ['nama', 'name', 'nama pelanggan', 'customer name', 'nama_pelanggan'],
  phone:      ['telepon', 'phone', 'no telepon', 'telp', 'hp', 'no hp', 'no_hp', 'phone_number', 'no_telepon'],
  email:      ['email', 'e-mail', 'surel'],
  address:    ['alamat', 'address', 'addr', 'alamat_lengkap'],
  points:     ['poin', 'points', 'point', 'loyalty points', 'loyalty_points'],
  tier:       ['tier', 'level', 'tingkat', 'member tier', 'member_tier'],
  totalSpent: ['total belanja', 'total_belanja', 'total spent', 'total_spent', 'total belanja (rp)', 'total_belanja_rp'],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, ' ');
}

function buildColumnMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(normalized)) {
        map[header] = field;
        break;
      }
    }
  }
  return map;
}

function parseNumber(value: any, fallback: number): number {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? fallback : Math.round(n);
}

const VALID_TIERS = new Set(['bronze', 'silver', 'gold', 'platinum']);

function normalizeTier(value: any): string {
  if (!value || value === '' || value === null || value === undefined) return 'bronze';
  const v = String(value).toLowerCase().trim();
  if (VALID_TIERS.has(v)) return v;
  if (v === 'perunggu') return 'bronze';
  if (v === 'perak') return 'silver';
  if (v === 'emas') return 'gold';
  if (v === 'platinum' || v === 'platina') return 'platinum';
  return 'bronze';
}

// ─── Parse ─────────────────────────────────────────────────────────────────────

function parseWorkbook(buffer: Buffer): CustomerImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rows.length === 0) return [];

  const headers = rows[0].map((h: any) => String(h).trim());
  const colMap = buildColumnMap(headers);
  const dataRows = rows.slice(1);

  return dataRows.map((row, i) => {
    if (row.every((c: any) => String(c).trim() === '')) return null;

    const rowObj: Record<string, any> = {};
    for (let j = 0; j < headers.length; j++) {
      const field = colMap[headers[j]];
      if (field) rowObj[field] = row[j];
    }

    return {
      rowIndex: i + 2,
      name: String(rowObj.name || '').trim(),
      phone: rowObj.phone ? String(rowObj.phone).trim() : undefined,
      email: rowObj.email ? String(rowObj.email).trim() : undefined,
      address: rowObj.address ? String(rowObj.address).trim() : undefined,
      points: parseNumber(rowObj.points, 0),
      tier: normalizeTier(rowObj.tier),
      totalSpent: parseNumber(rowObj.totalSpent, 0),
    };
  }).filter(Boolean) as CustomerImportRow[];
}

// ─── Validation ────────────────────────────────────────────────────────────────

async function validateRows(rows: CustomerImportRow[]): Promise<CustomerPreviewResult['errors']> {
  const db = await getDb();
  const errors: CustomerPreviewResult['errors'] = [];

  const existingPhones = new Set<string>();
  try {
    const phoneRows = db.exec('SELECT phone FROM customers WHERE phone IS NOT NULL');
    phoneRows[0]?.values?.forEach((r) => existingPhones.add(String(r[0])));
  } catch { /* ignore */ }

  for (const row of rows) {
    if (!row.name) {
      errors.push({ row: row.rowIndex, message: 'Nama wajib diisi' });
      continue;
    }
    if (row.phone && existingPhones.has(row.phone)) {
      errors.push({ row: row.rowIndex, message: `Telepon '${row.phone}' sudah terdaftar` });
    }
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: row.rowIndex, message: `Email '${row.email}' tidak valid` });
    }
    if (row.points < 0) {
      errors.push({ row: row.rowIndex, message: 'Poin tidak boleh negatif' });
    }
    if (row.totalSpent < 0) {
      errors.push({ row: row.rowIndex, message: 'Total belanja tidak boleh negatif' });
    }
  }

  return errors;
}

// ─── Preview ───────────────────────────────────────────────────────────────────

export async function previewImportFromBuffer(buffer: Buffer): Promise<CustomerPreviewResult> {
  try {
    const rows = parseWorkbook(buffer);

    if (rows.length === 0) {
      return { rows: [], totalRows: 0, errors: [{ row: 0, message: 'File kosong atau tidak bisa dibaca' }] };
    }

    const errors = await validateRows(rows);
    return { rows, totalRows: rows.length, errors };
  } catch (err) {
    return { rows: [], totalRows: 0, errors: [{ row: 0, message: (err as Error)?.message || 'Gagal membaca file' }] };
  }
}

// ─── Commit ────────────────────────────────────────────────────────────────────

export async function commitImport(rows: CustomerImportRow[]): Promise<CustomerImportResult> {
  const db = await getDb();

  if (rows.length === 0) {
    return { success: false, totalRows: 0, imported: 0, errors: [{ row: 0, message: 'Tidak ada data untuk di-import' }] };
  }

  db.run('BEGIN TRANSACTION');
  try {
    let imported = 0;
    const errors: CustomerImportResult['errors'] = [];

    for (const row of rows) {
      try {
        const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = Math.floor(Date.now() / 1000);

        // Check duplicate phone again (in case of concurrent changes)
        if (row.phone) {
          const dup = db.exec(`SELECT id FROM customers WHERE phone = '${row.phone.replace(/'/g, "''")}' LIMIT 1`);
          if (dup.length > 0 && dup[0]!.values.length > 0) {
            errors.push({ row: row.rowIndex, message: `Telepon '${row.phone}' sudah terdaftar` });
            continue;
          }
        }

        db.run(
          `INSERT INTO customers (id, name, phone, email, address, points, tier, total_spent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            row.name,
            row.phone || null,
            row.email || null,
            row.address || null,
            row.points,
            row.tier,
            row.totalSpent,
            now,
          ]
        );

        imported++;
      } catch (err) {
        errors.push({ row: row.rowIndex, message: (err as Error)?.message || 'Gagal menyimpan' });
      }
    }

    db.run('COMMIT');
    return { success: errors.length === 0, totalRows: rows.length, imported, errors };
  } catch (err) {
    db.run('ROLLBACK');
    return {
      success: false, totalRows: rows.length, imported: 0,
      errors: [{ row: 0, message: (err as Error)?.message || 'Gagal mengimport' }],
    };
  }
}
