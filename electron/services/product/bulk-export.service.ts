import * as XLSX from 'xlsx';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { getDb } from '../../db/index.ts';

export interface ExportParams {
  filter?: {
    categoryId?: string;
    search?: string;
    isActive?: boolean;
  };
  format: 'csv' | 'xlsx';
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function buildWhere(filter?: ExportParams['filter']): string {
  const parts: string[] = [];
  if (filter?.categoryId) parts.push(`category_id = '${esc(filter.categoryId)}'`);
  if (filter?.search) {
    const q = `%${esc(filter.search)}%`;
    parts.push(`(name LIKE '%${q}' OR sku LIKE '%${q}' OR barcode LIKE '%${q}')`);
  }
  if (filter?.isActive !== undefined) parts.push(`is_active = ${filter.isActive ? 1 : 0}`);
  return parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '';
}

export async function exportProducts(params: ExportParams): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const db = await getDb();
    const where = buildWhere(params.filter);
    const sql = `SELECT name, sku, barcode, category_id, price_buy, price_sell, stock, base_unit, min_stock, is_active FROM products ${where} ORDER BY name ASC`;
    const result = db.exec(sql);

    const headers = ['Nama Produk', 'SKU', 'Barcode', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan', 'Min Stok', 'Status'];
    const rows: (string | number | null)[][] = [headers];

    if (result.length > 0 && result[0]!.values.length > 0) {
      for (const r of result[0]!.values) {
        rows.push([
          String(r[0]),
          r[1] != null ? String(r[1]) : '',
          r[2] != null ? String(r[2]) : '',
          r[3] != null ? String(r[3]) : '',
          Number(r[4]) || 0,
          Number(r[5]) || 0,
          Number(r[6]) || 0,
          String(r[7] || 'pcs'),
          Number(r[8]) || 0,
          Number(r[9]) === 1 ? 'Aktif' : 'Nonaktif',
        ]);
      }
    }

    const date = new Date().toISOString().split('T')[0];
    const fileName = `produk_export_${date}.${params.format}`;
    const outputDir = path.join(process.cwd(), 'data');
    const outputPath = path.join(outputDir, fileName);

    // Pastikan direktori data ada
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (params.format === 'csv') {
      const csvContent = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      fs.writeFileSync(outputPath, '\uFEFF' + csvContent); // BOM for Excel
    } else {
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produk');
      const buffer: Uint8Array = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(outputPath, Buffer.from(buffer));
    }

    return { success: true, filePath: outputPath };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || 'Gagal export' };
  }
}
