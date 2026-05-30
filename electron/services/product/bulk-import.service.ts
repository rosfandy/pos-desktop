import * as XLSX from 'xlsx';
import { getDb } from '../../db/index.ts';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ImportRow {
  rowIndex: number;
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  priceBuy: number;
  priceSell: number;
  stock: number;
  baseUnit: string;
  minStock: number;
  isActive: boolean;
  units: Array<{ unitName: string; conversionFactor: number; priceSell?: number; isDefault?: boolean }>;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  errors: Array<{ row: number; field?: string; message: string }>;
}

export interface PreviewResult {
  rows: ImportRow[];
  totalRows: number;
  errors: Array<{ row: number; message: string }>;
}

// ─── Column mapping ────────────────────────────────────────────────────────────

const COLUMN_ALIASES: Record<string, string[]> = {
  name:       ['nama', 'name', 'nama produk', 'product name', 'nama_produk'],
  sku:        ['sku', 'kode sku', 'sku produk'],
  barcode:    ['barcode', 'kode', 'kode barang', 'barcode barang'],
  categoryId: ['kategori', 'category', 'kategori_id', 'category_id', 'id kategori'],
  priceBuy:   ['harga beli', 'harga_beli', 'cost', 'price_buy', 'hargabeli'],
  priceSell:  ['harga jual', 'harga_jual', 'price', 'price_sell', 'hargajual'],
  stock:      ['stok', 'stock', 'qty', 'quantity'],
  baseUnit:   ['satuan', 'unit', 'base_unit', 'satuan_dasar'],
  minStock:   ['min stok', 'min_stock', 'minstock', 'stok minimal', 'min_stok'],
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

function parseBool(value: any, fallback: boolean): boolean {
  if (value === null || value === undefined || value === '') return fallback;
  const v = String(value).toLowerCase().trim();
  return v === '1' || v === 'true' || v === 'ya' || v === 'yes'
    ? true
    : v === '0' || v === 'false' || v === 'tidak'
    ? false
    : fallback;
}

// ─── Parse ─────────────────────────────────────────────────────────────────────

function parseWorkbook(buffer: Buffer): ImportRow[] {
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
      sku: rowObj.sku ? String(rowObj.sku).trim() : undefined,
      barcode: rowObj.barcode ? String(rowObj.barcode).trim() : undefined,
      categoryId: rowObj.categoryId ? String(rowObj.categoryId).trim() : undefined,
      priceBuy: parseNumber(rowObj.priceBuy, 0),
      priceSell: parseNumber(rowObj.priceSell, 0),
      stock: parseNumber(rowObj.stock, 0),
      baseUnit: String(rowObj.baseUnit || 'pcs').trim(),
      minStock: parseNumber(rowObj.minStock, 0),
      isActive: parseBool(rowObj.isActive ?? rowObj.is_active ?? true, true),
      units: [{ unitName: String(rowObj.baseUnit || 'pcs').trim(), conversionFactor: 1, isDefault: true }],
    };
  }).filter(Boolean) as ImportRow[];
}

// ─── Preview (parse + validate, no DB write) ──────────────────────────────────

export async function previewImport(filePath: string): Promise<PreviewResult> {
  const fs = await import('fs');
  const path = await import('path');

  try {
    const resolvedPath = path.resolve(filePath);
    const buffer = fs.readFileSync(resolvedPath);
    const rows = parseWorkbook(Buffer.from(buffer));

    if (rows.length === 0) {
      return { rows: [], totalRows: 0, errors: [{ row: 0, message: 'File kosong atau tidak bisa dibaca' }] };
    }

    const db = await getDb();

    const existingSkus = new Set<string>();
    const existingBarcodes = new Set<string>();
    try {
      const skuRows = db.exec('SELECT sku FROM products WHERE sku IS NOT NULL');
      skuRows[0]?.values?.forEach((r) => existingSkus.add(String(r[0])));
      const barcodeRows = db.exec('SELECT barcode FROM products WHERE barcode IS NOT NULL');
      barcodeRows[0]?.values?.forEach((r) => existingBarcodes.add(String(r[0])));
    } catch { /* ignore */ }

    const validCategoryIds = new Set<string>();
    try {
      const catRows = db.exec('SELECT id FROM categories');
      catRows[0]?.values?.forEach((r) => validCategoryIds.add(String(r[0])));
    } catch { /* ignore */ }

    const errors: PreviewResult['errors'] = [];
    for (const row of rows) {
      if (!row.name) {
        errors.push({ row: row.rowIndex, message: 'Nama produk wajib diisi' });
        continue;
      }
      if (row.priceSell <= 0) errors.push({ row: row.rowIndex, message: 'Harga jual harus > 0' });
      if (row.stock < 0) errors.push({ row: row.rowIndex, message: 'Stok tidak boleh negatif' });
      if (row.sku && existingSkus.has(row.sku)) errors.push({ row: row.rowIndex, message: `SKU '${row.sku}' sudah ada` });
      if (row.barcode && existingBarcodes.has(row.barcode)) errors.push({ row: row.rowIndex, message: `Barcode '${row.barcode}' sudah ada` });
      if (row.categoryId && !validCategoryIds.has(row.categoryId)) errors.push({ row: row.rowIndex, message: `Kategori '${row.categoryId}' tidak ditemukan` });
    }

    return { rows, totalRows: rows.length, errors };
  } catch (err) {
    return { rows: [], totalRows: 0, errors: [{ row: 0, message: (err as Error)?.message || 'Gagal membaca file' }] };
  }
}

// ─── Commit (atomic DB write) ─────────────────────────────────────────────────

export async function commitImport(rows: ImportRow[]): Promise<ImportResult> {
  const db = await getDb();

  if (rows.length === 0) {
    return { success: false, totalRows: 0, imported: 0, errors: [{ row: 0, message: 'Tidak ada data untuk di-import' }] };
  }

  db.run('BEGIN TRANSACTION');
  try {
    let imported = 0;
    const errors: ImportResult['errors'] = [];

    for (const row of rows) {
      try {
        const id = `prod_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const priceBuyCents = Math.round(row.priceBuy * 100);
        const priceSellCents = Math.round(row.priceSell * 100);

        db.run(
          `INSERT INTO products (id, name, sku, barcode, category_id, price_buy, price_sell, stock, base_unit, min_stock, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, row.name, row.sku || null, row.barcode || null, row.categoryId || null,
           priceBuyCents, priceSellCents, row.stock, row.baseUnit || 'pcs',
           row.minStock, row.isActive ? 1 : 0, Date.now(), Date.now()]
        );

        const unitId = `unit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.run(
          `INSERT INTO product_units (id, product_id, unit_name, conversion_factor, price_sell, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [unitId, id, row.baseUnit || 'pcs', 1, priceSellCents, 1, Date.now()]
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
