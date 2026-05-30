import * as XLSX from 'xlsx';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { getDb } from '../../db/index.ts';

export interface CustomerExportParams {
  filter?: {
    search?: string;
    isActive?: boolean;
  };
  format: 'csv' | 'xlsx';
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function buildWhere(filter?: CustomerExportParams['filter']): string {
  const parts: string[] = [];
  if (filter?.isActive !== undefined) {
    parts.push(`is_active = ${filter.isActive ? 1 : 0}`);
  }
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
    const sql = `SELECT name, phone, email, address, points, tier, total_spent, is_active FROM customers ${where} ORDER BY name ASC`;
    const result = db.exec(sql);

    const headers = ['Nama', 'Telepon', 'Email', 'Alamat', 'Poin', 'Tier', 'Total Belanja', 'Status'];
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
          Number(r[7]) === 1 ? 'Aktif' : 'Nonaktif',
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
