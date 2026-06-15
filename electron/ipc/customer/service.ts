import type { Customer } from '../../db/schema.ts';

// ─── Tier Definitions ───────────────────────────────────────────────────────────

const TIER_THRESHOLDS: { tier: Customer['tier']; minSpent: number }[] = [
  { tier: 'platinum', minSpent: 10_000_000_000 }, // Rp 10.000.000 in cents
  { tier: 'gold',     minSpent:  5_000_000_000 }, // Rp 5.000.000
  { tier: 'silver',   minSpent:  1_000_000_000 }, // Rp 1.000.000
];

const TIER_MULTIPLIERS: Record<Customer['tier'], number> = {
  bronze:   1.0,
  silver:   1.2,
  gold:     1.5,
  platinum: 2.0,
};

// ─── Point Calculation ──────────────────────────────────────────────────────────

/**
 * Calculate loyalty points earned from a transaction amount.
 * 1 point per Rp 10.000, multiplied by tier multiplier.
 */
export function calculatePoints(amountCents: number, tier: Customer['tier']): number {
  const basePoints = Math.floor(amountCents / 1_000_000); // 10.000 in cents = 1_000_000
  const multiplier = TIER_MULTIPLIERS[tier] || 1;
  return Math.floor(basePoints * multiplier);
}

/**
 * Determine customer tier based on cumulative total spent (in cents).
 */
export function calculateTier(totalSpent: number): Customer['tier'] {
  for (const { tier, minSpent } of TIER_THRESHOLDS) {
    if (totalSpent >= minSpent) return tier;
  }
  return 'bronze';
}

/**
 * Update customer points and tier after a transaction.
 * Returns the updated customer data.
 */
export function updatePointsAfterTransaction(
  customer: Customer,
  transactionTotalCents: number
): { points: number; tier: Customer['tier'] } {
  const earnedPoints = calculatePoints(transactionTotalCents, customer.tier);
  const newPoints = customer.points + earnedPoints;
  const newTotalSpent = customer.totalSpent + transactionTotalCents;
  const newTier = calculateTier(newTotalSpent);

  return { points: newPoints, tier: newTier };
}

/**
 * Convert points to rupiah discount.
 * 1 point = Rp 100
 */
export function pointsToRupiah(points: number): number {
  return points * 100;
}
import { getDb } from '../../db/index.ts';
import type { NewCustomer } from '../../db/schema.ts';

// ─── Customer Row (matches sql.js raw result shape) ─────────────────────────────

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  createdAt: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function rowToCustomer(row: unknown[]): CustomerRow {
  return {
    id: String(row[0]),
    name: String(row[1]),
    phone: row[2] != null ? String(row[2]) : null,
    email: row[3] != null ? String(row[3]) : null,
    address: row[4] != null ? String(row[4]) : null,
    points: Number(row[5]) || 0,
    tier: (String(row[6]) as CustomerRow['tier']) || 'bronze',
    totalSpent: Number(row[7]) || 0,
    createdAt: Number(row[8]) || 0,
  };
}

// ─── Customer Repository ────────────────────────────────────────────────────────

export async function listCustomers(filter?: {
  search?: string;
}): Promise<CustomerRow[]> {
  try {
    const db = await getDb();
    const parts: string[] = [];

    if (filter?.search) {
      const q = `%${esc(filter.search)}%`;
      parts.push(`(name LIKE '%${q}' OR phone LIKE '%${q}')`);
    }

    const where = parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '';
    const sql = `SELECT id, name, phone, email, address, points, tier, total_spent, created_at FROM customers ${where} ORDER BY name ASC`;

    const result = db.exec(sql);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return result[0]!.values.map((r: unknown[]) => rowToCustomer(r));
    }
  } catch {
    // ignore
  }
  return [];
}

export async function getCustomerById(id: string): Promise<CustomerRow | null> {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT id, name, phone, email, address, points, tier, total_spent, created_at FROM customers WHERE id = '${esc(id)}' LIMIT 1`);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return rowToCustomer(result[0]!.values[0] as unknown[]);
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getCustomerByPhone(phone: string): Promise<CustomerRow | null> {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT id, name, phone, email, address, points, tier, total_spent, created_at FROM customers WHERE phone = '${esc(phone)}' LIMIT 1`);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return rowToCustomer(result[0]!.values[0] as unknown[]);
    }
  } catch {
    // ignore
  }
  return null;
}

export async function createCustomer(input: Omit<NewCustomer, 'id'>): Promise<CustomerRow | { error: string }> {
  try {
    const db = await getDb();

    // Check duplicate phone
    if (input.phone) {
      const dup = db.exec(`SELECT id FROM customers WHERE phone = '${esc(input.phone)}' LIMIT 1`);
      if (dup.length > 0 && dup[0]!.values.length > 0) {
        return { error: `CUST_001: Nomor telepon '${input.phone}' sudah terdaftar` };
      }
    }

    const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Math.floor(Date.now() / 1000);

    db.run(
      `INSERT INTO customers (id, name, phone, email, address, points, tier, total_spent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.phone || null,
        input.email || null,
        input.address || null,
        input.points ?? 0,
        input.tier || 'bronze',
        input.totalSpent || 0,
        now,
      ]
    );

    const created = await getCustomerById(id);
    return created as CustomerRow;
  } catch (err: any) {
    return { error: err.message || 'Gagal membuat pelanggan' };
  }
}

export async function updateCustomer(id: string, input: Partial<NewCustomer>): Promise<CustomerRow | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { error: `CUST_003: Pelanggan dengan id '${id}' tidak ditemukan` };

    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) { sets.push('name = ?'); params.push(input.name); }
    if (input.phone !== undefined) { sets.push('phone = ?'); params.push(input.phone || null); }
    if (input.email !== undefined) { sets.push('email = ?'); params.push(input.email || null); }
    if (input.address !== undefined) { sets.push('address = ?'); params.push(input.address || null); }
    if (input.points !== undefined) { sets.push('points = ?'); params.push(input.points); }
    if (input.tier !== undefined) { sets.push('tier = ?'); params.push(input.tier); }
    if (input.totalSpent !== undefined) { sets.push('total_spent = ?'); params.push(input.totalSpent); }

    if (sets.length > 0) {
      db.run(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }

    const updated = await getCustomerById(id);
    return updated || { error: `CUST_003: Pelanggan dengan id '${id}' tidak ditemukan` };
  } catch (err: any) {
    return { error: err.message || 'Gagal memperbarui pelanggan' };
  }
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { success: false, error: `CUST_003: Pelanggan dengan id '${id}' tidak ditemukan` };

    db.run(`DELETE FROM customers WHERE id = ?`, [id]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghapus pelanggan' };
  }
}

export async function bulkDeleteCustomers(ids: string[]): Promise<{ success: boolean; deleted: number; errors: Array<{ id: string; message: string }> }> {
  const db = await getDb();
  const errors: Array<{ id: string; message: string }> = [];
  let deleted = 0;

  db.run('BEGIN TRANSACTION');
  try {
    for (const id of ids) {
      try {
        const existing = await getCustomerById(id);
        if (!existing) {
          errors.push({ id, message: 'Pelanggan tidak ditemukan' });
          continue;
        }
        db.run(`DELETE FROM customers WHERE id = ?`, [id]);
        deleted++;
      } catch (err: any) {
        errors.push({ id, message: err.message || 'Gagal menghapus' });
      }
    }
    db.run('COMMIT');
  } catch (err: any) {
    db.run('ROLLBACK');
    return { success: false, deleted, errors: [{ id: '', message: err.message || 'Gagal menghapus massal' }] };
  }

  return { success: errors.length === 0, deleted, errors };
}

export async function addPoints(id: string, points: number): Promise<CustomerRow | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { error: `CUST_003: Pelanggan tidak ditemukan` };

    const newPoints = Math.max(0, existing.points + points);
    db.run(`UPDATE customers SET points = ? WHERE id = ?`, [newPoints, id]);
    const updated = await getCustomerById(id);
    return updated || { error: `CUST_003: Pelanggan tidak ditemukan` };
  } catch (err: any) {
    return { error: err.message || 'Gagal menambahkan poin' };
  }
}

/**
 * Dipanggil setelah transaksi selesai.
 * Update points, total_spent, dan tier sekaligus.
 */
export async function recordTransactionPoints(
  id: string,
  transactionTotalCents: number
): Promise<{ customer: CustomerRow; earnedPoints: number } | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { error: `CUST_003: Pelanggan tidak ditemukan` };

    // Import service functions inline to avoid circular deps
    const { calculatePoints, calculateTier } = await import('./service.ts');

    const earned = calculatePoints(transactionTotalCents, existing.tier);
    const newPoints = existing.points + earned;
    const newTotalSpent = (existing.totalSpent || 0) + transactionTotalCents;
    const newTier = calculateTier(newTotalSpent);

    db.run(
      `UPDATE customers SET points = ?, total_spent = ?, tier = ? WHERE id = ?`,
      [newPoints, newTotalSpent, newTier, id]
    );

    const updated = await getCustomerById(id);
    if (!updated) return { error: `CUST_003: Pelanggan tidak ditemukan` };
    return { customer: updated, earnedPoints: earned };
  } catch (err: any) {
    return { error: err.message || 'Gagal update poin transaksi' };
  }
}

export async function redeemPoints(id: string, points: number): Promise<{ customer: CustomerRow; discount: number } | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { error: `CUST_003: Pelanggan tidak ditemukan` };

    if (existing.points < points) {
      return { error: `CUST_002: Poin tidak cukup. Milik ${existing.points}, butuh ${points}` };
    }

    // 1 poin = Rp 100
    const discount = points * 100;
    const newPoints = existing.points - points;

    db.run(`UPDATE customers SET points = ? WHERE id = ?`, [newPoints, id]);
    const updated = await getCustomerById(id);
    if (!updated) return { error: `CUST_003: Pelanggan tidak ditemukan` };
    return { customer: updated, discount };
  } catch (err: any) {
    return { error: err.message || 'Gagal menukar poin' };
  }
}

import * as XLSX from 'xlsx';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { getDb } from '../../db/index.ts';

export interface CustomerExportParams {
  filter?: {
    search?: string;
  };
  format: 'csv' | 'xlsx';
}

function buildWhere(filter?: CustomerExportParams['filter']): string {
  const parts: string[] = [];
  if (filter?.search) {
    const q = `%${esc(filter.search)}%`;
    parts.push(`(name LIKE '%${q}' OR phone LIKE '%${q}')`);
  }
  return parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '';
}

export async function exportCustomers(params: CustomerExportParams): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const db = await getDb();
    const where = buildWhere(params.filter);
    const sql = `SELECT name, phone, email, address, points, tier, total_spent FROM customers ${where} ORDER BY name ASC`;
    const result = db.exec(sql);

    const headers = ['Nama', 'Telepon', 'Email', 'Alamat', 'Poin', 'Tier', 'Total Belanja'];
    const rows: (string | number | null)[][] = [headers];

    if (result.length > 0 && result[0]!.values.length > 0) {
      for (const r of result[0]!.values) {
        rows.push([
          String(r[0]),
          r[1] != null ? String(r[1]) : '',
          r[2] != null ? String(r[2]) : '',
          r[3] != null ? String(r[3]) : '',
          Number(r[4]) || 0,
          String(r[5]) || 'bronze',
          Number(r[6]) || 0,
        ]);
      }
    }

    const date = new Date().toISOString().split('T')[0];
    const fileName = `pelanggan_export_${date}.${params.format}`;
    const outputDir = path.join(process.cwd(), 'data');
    const outputPath = path.join(outputDir, fileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (params.format === 'csv') {
      const csvContent = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      fs.writeFileSync(outputPath, '\uFEFF' + csvContent);
    } else {
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pelanggan');
      const buffer: Uint8Array = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(outputPath, Buffer.from(buffer));
    }

    return { success: true, filePath: outputPath };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || 'Gagal export' };
  }
}

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

