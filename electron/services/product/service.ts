import { getDb } from '../../db/index.ts';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  priceBuy: number;
  priceSell: number;
  stock: number;
  baseUnit: string;
  imagePath: string | null;
  minStock: number;
  isActive: boolean;
  _isUpdate?: boolean; // internal flag for bulkSaveProducts write phase
}

interface ProductUnitRow {
  id: string;
  productId: string;
  unitName: string;
  conversionFactor: number;
  priceSell: number | null;
  isDefault: boolean;
}

interface ProductWithUnits extends ProductRow {
  units: ProductUnitRow[];
}

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  cursor?: string;   // opaque cursor for pagination (base64 encoded created_at+id)
  limit?: number;    // max rows per page (default 50, max 200)
  lowStock?: boolean;
  lowStockThreshold?: number;
}

export interface ProductPageResult {
  data: ProductRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  priceBuy: number;
  priceSell: number;
  stock: number;
  baseUnit: string;
  imagePath?: string;
  minStock: number;
  isActive?: boolean;
  units: Array<{
    id?: string;
    unitName: string;
    conversionFactor: number;
    priceSell?: number;
    isDefault?: boolean;
  }>;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  priceBuy?: number;
  priceSell?: number;
  stock?: number;
  baseUnit?: string;
  imagePath?: string | null;
  minStock?: number;
  isActive?: boolean;
  units?: Array<{
    id?: string;
    unitName: string;
    conversionFactor: number;
    priceSell?: number;
    isDefault?: boolean;
  }>;
}

interface StockCheckResult {
  stock: number;
  minStock: number;
  isLow: boolean;
}

// ─── SQL Builder ───────────────────────────────────────────────────────────────

/** Escape single quotes for SQL */
function esc(s: string): string {
  return s.replace(/'/g, "''");
}

/** Build WHERE clause dari filter (dengan string interpolation, aman untuk Electron offline app) */
function buildWhere(filter?: ProductFilter): string {
  const parts: string[] = [];

  if (filter?.categoryId) {
    parts.push(`p.category_id = '${esc(filter.categoryId)}'`);
  }
  if (filter?.search) {
    const q = `%${esc(filter.search)}%`;
    parts.push(`(p.name LIKE '%${q}' OR p.sku LIKE '%${q}' OR p.barcode LIKE '%${q}')`);
  }
  // Only add is_active filter if explicitly requested by caller.
  // When filter.isActive is omitted → no is_active filter → show all (active + inactive).
  if (filter?.isActive !== undefined) {
    parts.push(`p.is_active = ${filter.isActive ? 1 : 0}`);
  }

  // Low stock filter — implicitly applies is_active = 1
  if (filter?.lowStock) {
    if (filter.lowStockThreshold && filter.lowStockThreshold > 0) {
      parts.push(`p.is_active = 1 AND p.stock <= ${filter.lowStockThreshold}`);
    } else {
      parts.push(`p.is_active = 1 AND p.stock <= p.min_stock`);
    }
  }

  return parts.join(' AND ');
}

const BASE_SQL = `
  SELECT
    p.id, p.name, p.sku, p.barcode,
    p.category_id, c.name,
    p.price_buy, p.price_sell,
    p.stock, p.base_unit, p.image_path, p.min_stock, p.is_active,
    p.created_at, p.updated_at
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
`;

const LEGACY_BASE_SQL = `
  SELECT id, name, barcode, category, price, cost, stock, unit, unit_conversion, is_active
  FROM products
`;

// ─── Cursor helpers ────────────────────────────────────────────────────────────

/** Encode last row's (created_at, id) into an opaque cursor string */
function makeCursor(createdAt: number, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString('base64url');
}

/** Decode cursor back to (created_at, id), or return null if invalid */
function decodeCursor(cursor?: string): { createdAt: number; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, 'base64url').toString();
    const [createdAtStr, id] = raw.split('|');
    return { createdAt: Number(createdAtStr), id };
  } catch {
    return null;
  }
}

// ─── Service ───────────────────────────────────────────────────────────────────

export async function listProducts(filter?: ProductFilter): Promise<ProductPageResult> {
  try {
    const db = await getDb();

    // Cek apakah skema baru ada (ada kolom sku/min_stock/category_id)
    const info = db.exec("PRAGMA table_info(products)");
    const hasNewSchema = info.length > 0 && info[0]!.values.some((r: any[]) => ['sku', 'min_stock', 'category_id'].includes(String(r[1])));

    const whereClause = buildWhere(filter);
    const whereSql = whereClause ? `WHERE ${whereClause}` : '';
    const limit = Math.min(filter?.limit ?? 50, 200); // clamp max 200
    const cursor = decodeCursor(filter?.cursor);

    // Build ORDER BY + cursor WHERE
    const orderBy = hasNewSchema ? 'p.created_at DESC, p.id DESC' : 'created_at DESC, id DESC';
    const cursorClause = cursor ? `AND (${hasNewSchema ? 'p' : ''}.created_at, ${hasNewSchema ? 'p' : ''}.id) < (${cursor.createdAt}, '${esc(cursor.id)}')` : '';

    const baseSql = hasNewSchema ? BASE_SQL : LEGACY_BASE_SQL;
    const sql = `${baseSql} ${whereSql} ${cursorClause} ORDER BY ${orderBy} LIMIT ${limit}`;

    const result = db.exec(sql);
    const rows = result.length > 0 && result[0]!.values.length > 0
      ? result[0]!.values.map((r: any[]) => hasNewSchema ? mapNewRow(r) : mapLegacyRow(r))
      : [];

    // Derive nextCursor from the last row (if we got exactly `limit` rows, there may be more)
    let nextCursor: string | null = null;
    let hasMore = false;
    if (rows.length === limit) {
      // Fetch created_at of the last row to build a proper cursor
      const lastRaw = result[0]!.values[rows.length - 1] as any[];
      const createdAtIdx = hasNewSchema ? 13 : 11; // created_at index: new schema=13 (after is_active=12), legacy=11
      const lastCreatedAt = Number(lastRaw[createdAtIdx]);
      nextCursor = makeCursor(lastCreatedAt, rows[rows.length - 1].id);
      hasMore = true;
    }

    return { data: rows, nextCursor, hasMore };
  } catch {
    // ignore DB error
  }
  return { data: [], nextCursor: null, hasMore: false };
}

/** Map row skema baru (13 kolom) ke ProductRow */
function mapNewRow(row: any[]): ProductRow {
  return {
    id: String(row[0]),
    name: String(row[1]),
    sku: row[2] != null ? String(row[2]) : null,
    barcode: row[3] != null ? String(row[3]) : null,
    categoryId: row[4] != null ? String(row[4]) : null,
    categoryName: row[5] != null ? String(row[5]) : null,
    priceBuy: Number(row[6]) || 0,
    priceSell: Number(row[7]) || 0,
    stock: Number(row[8]) || 0,
    baseUnit: String(row[9] || 'pcs'),
    imagePath: row[10] != null ? String(row[10]) : null,
    minStock: Number(row[11]) || 0,
    isActive: Boolean(row[12]),
  };
}

/** Map row legacy (kolom lama: price, cost, unit) ke ProductRow */
function mapLegacyRow(row: any[]): ProductRow {
  return {
    id: String(row[0]),
    name: String(row[1]),
    sku: null,
    barcode: row[2] != null ? String(row[2]) : null,
    categoryId: null,
    categoryName: row[3] != null ? String(row[3]) : null,
    priceBuy: Number(row[4]) || 0,
    priceSell: Number(row[5]) || 0,
    stock: Number(row[6]) || 0,
    baseUnit: String(row[7] || 'pcs'),
    imagePath: null,
    minStock: 0,
    isActive: Boolean(row[8]),
  };
}

/** Cari produk by barcode */
export async function getProductByBarcode(barcode: string): Promise<ProductRow | null> {
  try {
    const db = await getDb();
    const info = db.exec("PRAGMA table_info(products)");
    const isNew = info.length > 0 && info[0]!.values.some((r: any[]) => ['sku', 'min_stock', 'category_id'].includes(String(r[1])));

    const whereBarcode = isNew
      ? `WHERE p.barcode = '${barcode.replace(/'/g, "''")}'`
      : `WHERE barcode = '${barcode.replace(/'/g, "''")}'`;
    const select = isNew
      ? `SELECT p.id, p.name, p.sku, p.barcode, p.category_id, c.name, p.price_buy, p.price_sell, p.stock, p.base_unit, p.image_path, p.min_stock, p.is_active FROM products p LEFT JOIN categories c ON p.category_id = c.id`
      : `SELECT id, name, barcode, category, price, cost, stock, unit, unit_conversion, is_active FROM products`;

    const result = db.exec(`${select} ${whereBarcode} LIMIT 1`);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return isNew ? mapNewRow(result[0]!.values[0]) : mapLegacyRow(result[0]!.values[0]);
    }
  } catch { /* ignore */ }
  return null;
}

/** Cari produk by ID */
export async function getProductById(id: string): Promise<ProductRow | null> {
  try {
    const db = await getDb();
    const info = db.exec("PRAGMA table_info(products)");
    const isNew = info.length > 0 && info[0]!.values.some((r: any[]) => ['sku', 'min_stock', 'category_id'].includes(String(r[1])));

    const whereId = isNew
      ? `WHERE p.id = '${id.replace(/'/g, "''")}'`
      : `WHERE id = '${id.replace(/'/g, "''")}'`;
    const select = isNew
      ? `SELECT p.id, p.name, p.sku, p.barcode, p.category_id, c.name, p.price_buy, p.price_sell, p.stock, p.base_unit, p.image_path, p.min_stock, p.is_active FROM products p LEFT JOIN categories c ON p.category_id = c.id`
      : `SELECT id, name, barcode, category, price, cost, stock, unit, unit_conversion, is_active FROM products`;

    const result = db.exec(`${select} ${whereId} LIMIT 1`);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return isNew ? mapNewRow(result[0]!.values[0]) : mapLegacyRow(result[0]!.values[0]);
    }
  } catch { /* ignore */ }
  return null;
}

/** Update stok produk */
export async function updateProductStock(productId: string, quantityChange: number): Promise<boolean> {
  try {
    const db = await getDb();
    db.run(`UPDATE products SET stock = MAX(0, stock + ${quantityChange}), updated_at = ${Date.now()} WHERE id = '${productId.replace(/'/g, "''")}'`);
    return true;
  } catch {
    // DB error
  }
  return false;
}

// ─── Duplicate Check ────────────────────────────────────────────────────────────

async function checkDuplicate(field: 'sku' | 'barcode', value: string, excludeId?: string): Promise<string | null> {
  if (!value) return null;
  const db = await getDb();
  const col = field === 'sku' ? 'sku' : 'barcode';
  const result = db.exec(`SELECT id FROM products WHERE ${col} = '${esc(value)}' AND id != '${excludeId ? esc(excludeId) : ''}' LIMIT 1`);
  if (result.length > 0 && result[0]!.values.length > 0) {
    return `PROD_001: ${field === 'sku' ? 'SKU' : 'Barcode'} '${value}' sudah digunakan produk lain`;
  }
  return null;
}

// ─── Product CRUD ───────────────────────────────────────────────────────────────

export async function getProductWithUnits(id: string): Promise<ProductWithUnits | null> {
  if (!id) return null;
  try {
    const db = await getDb();
    const info = db.exec("PRAGMA table_info(products)");
    const isNew = info.length > 0 && info[0]!.values.some((r: any[]) => ['sku', 'min_stock', 'category_id'].includes(String(r[1])));

    const productSql = isNew
      ? `SELECT p.id, p.name, p.sku, p.barcode, p.category_id, c.name, p.price_buy, p.price_sell, p.stock, p.base_unit, p.image_path, p.min_stock, p.is_active FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = '${esc(id)}' LIMIT 1`
      : `SELECT id, name, barcode, category, price, cost, stock, unit, unit_conversion, is_active FROM products WHERE id = '${esc(id)}' LIMIT 1`;

    const productResult = db.exec(productSql);
    if (productResult.length === 0 || productResult[0]!.values.length === 0) return null;

    const product = isNew ? mapNewRow(productResult[0]!.values[0]) : mapLegacyRow(productResult[0]!.values[0]);

    // Fetch units
    const unitsResult = db.exec(`SELECT id, product_id, unit_name, conversion_factor, price_sell, is_default FROM product_units WHERE product_id = '${esc(id)}' ORDER BY is_default DESC, unit_name ASC`);
    const units: ProductUnitRow[] = unitsResult.length > 0
      ? unitsResult[0]!.values.map((r: any[]) => ({
          id: String(r[0]),
          productId: String(r[1]),
          unitName: String(r[2]),
          conversionFactor: Number(r[3]) || 1,
          priceSell: r[4] != null ? Number(r[4]) : null,
          isDefault: Boolean(r[5]),
        }))
      : [];

    return { ...product, units };
  } catch {
    return null;
  }
}

export async function createProduct(input: CreateProductInput, userId?: string): Promise<ProductWithUnits | { error: string }> {
  try {
    const db = await getDb();
    const id = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Check duplicate sku
    if (input.sku) {
      const dup = await checkDuplicate('sku', input.sku);
      if (dup) return { error: dup };
    }
    // Check duplicate barcode
    if (input.barcode) {
      const dup = await checkDuplicate('barcode', input.barcode);
      if (dup) return { error: dup };
    }

    db.run('BEGIN TRANSACTION');

    try {
      db.run(
        `INSERT INTO products (id, name, sku, barcode, category_id, price_buy, price_sell, stock, base_unit, image_path, min_stock, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.sku || null,
          input.barcode || null,
          input.categoryId || null,
          input.priceBuy,
          input.priceSell,
          input.stock,
          input.baseUnit || 'pcs',
          input.imagePath || null,
          input.minStock || 0,
          input.isActive !== false ? 1 : 0,
          Date.now(),
          Date.now(),
        ]
      );

      // Insert units
      for (const unit of input.units) {
        const unitId = unit.id || `unit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.run(
          `INSERT INTO product_units (id, product_id, unit_name, conversion_factor, price_sell, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            unitId,
            id,
            unit.unitName,
            unit.conversionFactor || 1,
            unit.priceSell ?? null,
            unit.isDefault ? 1 : 0,
            Date.now(),
          ]
        );
      }

      db.run('COMMIT');
    } catch (err) {
      try { db.run('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    }

    // Audit trail — create
    const newSnapshot: Record<string, unknown> = {
      id, name: input.name, sku: input.sku ?? null, barcode: input.barcode ?? null,
      categoryId: input.categoryId ?? null, priceBuy: input.priceBuy, priceSell: input.priceSell,
      stock: input.stock, baseUnit: input.baseUnit || 'pcs', minStock: input.minStock || 0,
      isActive: input.isActive !== false,
    };
    void writeHistory(id, 'create', null, newSnapshot, userId);

    return getProductWithUnits(id) as Promise<ProductWithUnits>;
  } catch (err: any) {
    return { error: err.message || 'Gagal membuat produk' };
  }
}

export async function updateProduct(id: string, input: UpdateProductInput, userId?: string): Promise<ProductWithUnits | { error: string }> {
  if (!id) return { error: 'PROD_002: ID produk tidak boleh kosong' };
  try {
    const db = await getDb();
    const existing = await getProductWithUnits(id);
    if (!existing) return { error: `PROD_002: Produk dengan id '${id}' tidak ditemukan` };

    // Snapshot before update for audit trail
    const oldSnapshot = productSnapshot(existing);

    // Check duplicate sku
    if (input.sku !== undefined && input.sku !== null && input.sku !== existing.sku) {
      const dup = await checkDuplicate('sku', input.sku, id);
      if (dup) return { error: dup };
    }
    // Check duplicate barcode
    if (input.barcode !== undefined && input.barcode !== null && input.barcode !== existing.barcode) {
      const dup = await checkDuplicate('barcode', input.barcode, id);
      if (dup) return { error: dup };
    }

    const sets: string[] = [];
    const params: any[] = [];

    if (input.name !== undefined) { sets.push('name = ?'); params.push(input.name); }
    if (input.sku !== undefined) { sets.push('sku = ?'); params.push(input.sku || null); }
    if (input.barcode !== undefined) { sets.push('barcode = ?'); params.push(input.barcode || null); }
    if (input.categoryId !== undefined) { sets.push('category_id = ?'); params.push(input.categoryId || null); }
    if (input.priceBuy !== undefined) { sets.push('price_buy = ?'); params.push(input.priceBuy); }
    if (input.priceSell !== undefined) { sets.push('price_sell = ?'); params.push(input.priceSell); }
    if (input.stock !== undefined) { sets.push('stock = ?'); params.push(input.stock); }
    if (input.baseUnit !== undefined) { sets.push('base_unit = ?'); params.push(input.baseUnit); }
    if (input.imagePath !== undefined) { sets.push('image_path = ?'); params.push(input.imagePath); }
    if (input.minStock !== undefined) { sets.push('min_stock = ?'); params.push(input.minStock); }
    if (input.isActive !== undefined) { sets.push('is_active = ?'); params.push(input.isActive ? 1 : 0); }
    sets.push('updated_at = ?');
    params.push(Date.now());

    if (sets.length > 1) { // at least updated_at
      db.run(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }

    // Replace units if provided
    if (input.units !== undefined) {
      db.run('BEGIN TRANSACTION');
      try {
        db.run('DELETE FROM product_units WHERE product_id = ?', [id]);
        for (const unit of input.units) {
          const unitId = unit.id || `unit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          db.run(
            `INSERT INTO product_units (id, product_id, unit_name, conversion_factor, price_sell, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              unitId,
              id,
              unit.unitName,
              unit.conversionFactor || 1,
              unit.priceSell ?? null,
              unit.isDefault ? 1 : 0,
              Date.now(),
            ]
          );
        }
        db.run('COMMIT');
      } catch (err) {
        try { db.run('ROLLBACK'); } catch { /* ignore */ }
        throw err;
      }
    }

    // Build new snapshot for audit trail
    const updatedStock = input.stock ?? existing.stock;
    const newSnapshot: Record<string, unknown> = {
      id: existing.id, name: input.name ?? existing.name,
      sku: input.sku ?? existing.sku, barcode: input.barcode ?? existing.barcode,
      categoryId: input.categoryId ?? existing.categoryId,
      priceBuy: input.priceBuy ?? existing.priceBuy,
      priceSell: input.priceSell ?? existing.priceSell,
      stock: updatedStock, baseUnit: input.baseUnit ?? existing.baseUnit,
      minStock: input.minStock ?? existing.minStock,
      isActive: input.isActive ?? existing.isActive,
    };
    void writeHistory(id, 'update', oldSnapshot, newSnapshot, userId);

    return getProductWithUnits(id) as Promise<ProductWithUnits>;
  } catch (err: any) {
    return { error: err.message || 'Gagal memperbarui produk' };
  }
}

export async function bulkSaveProducts(
  rows: any[],
  userId?: string,
): Promise<{ success: number; errors: { row: number; message: string }[] }> {
  const errors: { row: number; message: string }[] = [];
  let successCount = 0;

  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: 0, errors: [{ row: 0, message: 'Tidak ada data produk untuk disimpan' }] };
  }

  const db = await getDb();
  const info = db.exec("PRAGMA table_info(products)");
  const isNew = info.length > 0 && info[0]!.values.some((r: any[]) => ['sku', 'min_stock', 'category_id'].includes(String(r[1])));

  // Pre-collect existing barcodes and SKUs for duplicate checks (ALL products, not just active)
  const existingBarcodes = new Map<string, string>(); // value (exact case) -> id
  const existingSkus = new Map<string, string>();
  try {
    const existingResult = db.exec(
      `SELECT id, barcode, sku FROM products WHERE barcode IS NOT NULL OR sku IS NOT NULL`,
    );
    if (existingResult.length > 0 && existingResult[0]!.values.length > 0) {
      for (const r of existingResult[0]!.values as any[][]) {
        if (r[1]) existingBarcodes.set(String(r[1]).trim(), String(r[0])); // exact case
        if (r[2]) existingSkus.set(String(r[2]).trim(), String(r[0]));     // exact case
      }
    }
  } catch {
    // ignore
  }

  // Collect in-batch barcodes and SKUs to detect cross-row duplicates
  const batchBarcodes = new Map<string, number>(); // exact barcode value -> rowIndex
  const batchSkus = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') {
      errors.push({ row: i, message: 'Baris tidak valid' });
      continue;
    }

    // ── Validation ──
    const name = (row.name ?? '').toString().trim();
    if (!name) {
      errors.push({ row: i, message: 'Nama produk wajib diisi' });
      continue;
    }

    const priceBuy = Number(row.priceBuy);
    if (isNaN(priceBuy) || priceBuy < 0) {
      errors.push({ row: i, message: 'Harga beli harus >= 0' });
      continue;
    }

    const priceSell = Number(row.priceSell);
    if (isNaN(priceSell) || priceSell < 0) {
      errors.push({ row: i, message: 'Harga jual harus >= 0' });
      continue;
    }

    const stock = Number(row.stock);
    if (isNaN(stock) || stock < 0) {
      errors.push({ row: i, message: 'Stok harus >= 0' });
      continue;
    }

    const minStock = Number(row.minStock);
    if (isNaN(minStock) || minStock < 0) {
      errors.push({ row: i, message: 'Stok minimal harus >= 0' });
      continue;
    }

    const isActive = row.isActive !== false; // default true

    // ── Build product data ──
    // IMPORTANT: Determine isUpdate from the ORIGINAL row.id BEFORE we overwrite it below.
    // If row.id is falsy (undefined/null/''), this is a brand-new row → INSERT.
    // If row.id has a value (e.g. "prod_1780..."), this is an existing DB row → UPDATE.
    const isUpdate = !!row.id;
    const id = row.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sku = row.sku ? String(row.sku).trim() : null;
    const barcode = row.barcode ? String(row.barcode).trim() : null;
    const baseUnit = row.baseUnit ? String(row.baseUnit).trim() : 'pcs';

    // ── Duplicate checks ──
    if (barcode) {
      // Check existing DB (exact case to match DB constraint)
      if (existingBarcodes.has(barcode) && existingBarcodes.get(barcode) !== id) {
        errors.push({ row: i, message: `Barcode '${barcode}' sudah digunakan produk lain` });
        continue;
      }
      // Check in-batch (exact case)
      if (batchBarcodes.has(barcode)) {
        errors.push({ row: i, message: `Barcode '${barcode}' duplikat pada baris ${batchBarcodes.get(barcode)! + 1}` });
        continue;
      }
      batchBarcodes.set(barcode, i);
    }

    if (sku) {
      // Check existing DB (exact case)
      if (existingSkus.has(sku) && existingSkus.get(sku) !== id) {
        errors.push({ row: i, message: `SKU '${sku}' sudah digunakan produk lain` });
        continue;
      }
      // Check in-batch (exact case)
      if (batchSkus.has(sku)) {
        errors.push({ row: i, message: `SKU '${sku}' duplikat pada baris ${batchSkus.get(sku)! + 1}` });
        continue;
      }
      batchSkus.set(sku, i);
    }

    const productData = {
      id,
      name,
      sku,
      barcode,
      categoryId: row.categoryId ? String(row.categoryId) : null,
      priceBuy,
      priceSell,
      stock,
      baseUnit,
      minStock,
      isActive,
      _isUpdate: isUpdate,  // carry over the isUpdate flag into the write phase
      units: row.units || [],
    };

    // Accumulate; actual DB writes happen in the transaction below
    rows[i] = productData;
  }

  // Filter out rows with errors
  const validRows = rows.filter((_, i) => !errors.some((e) => e.row === i));

  if (validRows.length === 0) {
    return { success: 0, errors };
  }

  // ── Single database transaction for all writes ──
  try {
    db.run('BEGIN TRANSACTION');

    for (const product of validRows) {
      // Use the flag captured during validation, before product.id was auto-generated.
      const isUpdate = product._isUpdate === true;

      if (isUpdate) {
        // UPDATE existing product
        const sets: string[] = [];
        const params: any[] = [];
        if (product.name !== undefined) { sets.push('name = ?'); params.push(product.name); }
        if (product.sku !== undefined) { sets.push('sku = ?'); params.push(product.sku); }
        if (product.barcode !== undefined) { sets.push('barcode = ?'); params.push(product.barcode); }
        if (product.categoryId !== undefined) { sets.push('category_id = ?'); params.push(product.categoryId); }
        if (product.priceBuy !== undefined) { sets.push('price_buy = ?'); params.push(product.priceBuy); }
        if (product.priceSell !== undefined) { sets.push('price_sell = ?'); params.push(product.priceSell); }
        if (product.stock !== undefined) { sets.push('stock = ?'); params.push(product.stock); }
        if (product.baseUnit !== undefined) { sets.push('base_unit = ?'); params.push(product.baseUnit); }
        if (product.minStock !== undefined) { sets.push('min_stock = ?'); params.push(product.minStock); }
        if (product.isActive !== undefined) { sets.push('is_active = ?'); params.push(product.isActive ? 1 : 0); }
        sets.push('updated_at = ?');
        params.push(Date.now());
        params.push(product.id);

        db.run(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, params);

        // Update units if provided
        if (product.units && product.units.length > 0) {
          db.run('DELETE FROM product_units WHERE product_id = ?', [product.id]);
          for (const unit of product.units) {
            const unitId = unit.id || `unit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            db.run(
              `INSERT INTO product_units (id, product_id, unit_name, conversion_factor, price_sell, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                unitId,
                product.id,
                unit.unitName,
                unit.conversionFactor || 1,
                unit.priceSell ?? null,
                unit.isDefault ? 1 : 0,
                Date.now(),
              ],
            );
          }
        }

        // Audit trail — update
        void writeHistory(product.id, 'update', null, {
          id: product.id, name: product.name, sku: product.sku, barcode: product.barcode,
          categoryId: product.categoryId, priceBuy: product.priceBuy, priceSell: product.priceSell,
          stock: product.stock, baseUnit: product.baseUnit, minStock: product.minStock,
          isActive: product.isActive,
        }, userId, 'Bulk save update');
      } else {
        // INSERT new product
        db.run(
          `INSERT INTO products (id, name, sku, barcode, category_id, price_buy, price_sell, stock, base_unit, min_stock, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id,
            product.name,
            product.sku || null,
            product.barcode || null,
            product.categoryId || null,
            product.priceBuy,
            product.priceSell,
            product.stock,
            product.baseUnit,
            product.minStock,
            product.isActive ? 1 : 0,
            Date.now(),
            Date.now(),
          ],
        );

        // Insert units
        if (product.units && product.units.length > 0) {
          for (const unit of product.units) {
            const unitId = unit.id || `unit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            db.run(
              `INSERT INTO product_units (id, product_id, unit_name, conversion_factor, price_sell, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                unitId,
                product.id,
                unit.unitName,
                unit.conversionFactor || 1,
                unit.priceSell ?? null,
                unit.isDefault ? 1 : 0,
                Date.now(),
              ],
            );
          }
        }

        // Audit trail — create
        void writeHistory(product.id, 'create', null, {
          id: product.id, name: product.name, sku: product.sku, barcode: product.barcode,
          categoryId: product.categoryId, priceBuy: product.priceBuy, priceSell: product.priceSell,
          stock: product.stock, baseUnit: product.baseUnit, minStock: product.minStock,
          isActive: product.isActive,
        }, userId, 'Bulk save create');
      }

      successCount++;
    }

    db.run('COMMIT');
  } catch (err: any) {
    try { db.run('ROLLBACK'); } catch { /* ignore */ }
    // Add transaction error to errors list
    const failedRows = validRows.map((p) => p.name).join(', ');
    errors.push({ row: -1, message: `Transaksi gagal: ${err.message || 'Unknown error'}. Data yang gagal: ${failedRows}` });
    return { success: successCount, errors };
  }

  return { success: successCount, errors };
}

export async function deleteProduct(id: string, userId?: string): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: 'ID produk tidak boleh kosong' };
  try {
    const db = await getDb();
    const existing = await getProductWithUnits(id);
    if (!existing) return { success: false, error: `PROD_003: Produk dengan id '${id}' tidak ditemukan` };

    // Snapshot before deletion for audit trail
    const oldSnapshot = productSnapshot(existing);

    // Check if product has transactions (hard delete protection)
    const txResult = db.exec(`SELECT COUNT(*) FROM transaction_items WHERE product_id = '${esc(id)}' LIMIT 1`);
    const txCount = txResult.length > 0 ? Number(txResult[0]!.values[0]![0]) : 0;

    if (txCount > 0) {
      // Soft delete
      db.run(`UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?`, [Date.now(), id]);
      void writeHistory(id, 'delete', oldSnapshot, null, userId, 'Soft delete — produk memiliki transaksi');
      return { success: true };
    }

    // Hard delete (no transactions)
    db.run('BEGIN TRANSACTION');
    try {
      db.run('DELETE FROM product_units WHERE product_id = ?', [id]);
      db.run('DELETE FROM products WHERE id = ?', [id]);
      db.run('COMMIT');
      void writeHistory(id, 'delete', oldSnapshot, null, userId, 'Hard delete — tidak ada transaksi');
    } catch (err) {
      try { db.run('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghapus produk' };
  }
}

export async function checkStock(id: string): Promise<StockCheckResult | null> {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT stock, min_stock FROM products WHERE id = '${esc(id)}' LIMIT 1`);
    if (result.length === 0 || result[0]!.values.length === 0) return null;
    const [stock, minStock] = result[0]!.values[0]!;
    return {
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      isLow: (Number(stock) || 0) <= (Number(minStock) || 0),
    };
  } catch {
    return null;
  }
}

/** Return all active products where stock <= min_stock (or threshold if provided) */
export async function getLowStockProducts(threshold?: number): Promise<ProductRow[]> {
  try {
    const db = await getDb();
    const info = db.exec("PRAGMA table_info(products)");
    const isNew = info.length > 0 && info[0]!.values.some((r: any[]) => ['sku', 'min_stock', 'category_id'].includes(String(r[1])));

    // If a global threshold is provided (> 0), use it; otherwise fall back to per-product min_stock
    const whereClause = isNew
      ? (threshold && threshold > 0)
        ? `p.is_active = 1 AND p.stock <= ${threshold}`
        : `p.is_active = 1 AND p.stock <= p.min_stock`
      : `is_active = 1 AND stock <= 0`;

    const sql = isNew
      ? `SELECT p.id, p.name, p.sku, p.barcode, p.category_id, c.name, p.price_buy, p.price_sell, p.stock, p.base_unit, p.image_path, p.min_stock, p.is_active FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${whereClause} ORDER BY p.name ASC`
      : `SELECT id, name, barcode, category, price, cost, stock, unit, unit_conversion, is_active FROM products WHERE ${whereClause} ORDER BY name ASC`;

    const result = db.exec(sql);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return result[0]!.values.map((r: any[]) => isNew ? mapNewRow(r) : mapLegacyRow(r));
    }
  } catch { /* ignore */ }
  return [];
}

// ─── Audit Trail ────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  productId: string;
  userId: string | null;
  action: string;
  changedAt: number;
  oldData: string | null;
  newData: string | null;
  notes: string | null;
}

/** Write an audit log entry (async) */
async function writeHistory(productId: string, action: string, oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null, userId?: string, notes?: string): Promise<void> {
  try {
    const db = await getDb();
    const id = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.run(
      `INSERT INTO product_history (id, product_id, user_id, action, changed_at, old_data, new_data, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        productId,
        userId || null,
        action,
        Date.now(),
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        notes || null,
      ]
    );
  } catch { /* ignore audit errors — must not break product CRUD */ }
}

export interface ProductCounts {
  total: number;
  active: number;
  lowStock: number;
}

/**
 * Hitung statistik produk dalam 1 query hemat (tanpa load semua baris).
 * total    = semua produk
 * active   = produk is_active = 1
 * lowStock = produk is_active = 1 DAN stock <= min_stock
 */
export async function productCount(): Promise<ProductCounts> {
  try {
    const db = await getDb();
    const info = db.exec("PRAGMA table_info(products)");
    const hasNewSchema = info.length > 0 && info[0]!.values.some((r: any[]) => ['sku', 'min_stock', 'category_id'].includes(String(r[1])));

    if (hasNewSchema) {
      // Use a single COUNT query with CASE for efficiency
      const result = db.exec(`
        SELECT
          COUNT(*)                              AS total,
          SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN p.is_active = 1 AND p.stock <= p.min_stock THEN 1 ELSE 0 END) AS lowStock
        FROM products p
      `);
      if (result.length > 0 && result[0]!.values.length > 0) {
        const row = result[0]!.values[0]!;
        return {
          total: Number(row[0]) || 0,
          active: Number(row[1]) || 0,
          lowStock: Number(row[2]) || 0,
        };
      }
    } else {
      // Legacy schema: min_stock doesn't exist, lowStock = stock <= 0
      const result = db.exec(`
        SELECT
          COUNT(*)                              AS total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN is_active = 1 AND stock <= 0 THEN 1 ELSE 0 END) AS lowStock
        FROM products
      `);
      if (result.length > 0 && result[0]!.values.length > 0) {
        const row = result[0]!.values[0]!;
        return {
          total: Number(row[0]) || 0,
          active: Number(row[1]) || 0,
          lowStock: Number(row[2]) || 0,
        };
      }
    }
  } catch { /* ignore */ }
  return { total: 0, active: 0, lowStock: 0 };
}

/** Build a plain-object snapshot of a product row for diffing */
function productSnapshot(p: ProductRow): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    categoryId: p.categoryId,
    priceBuy: p.priceBuy,
    priceSell: p.priceSell,
    stock: p.stock,
    baseUnit: p.baseUnit,
    minStock: p.minStock,
    isActive: p.isActive,
  };
}

/** Fetch history entries for a product, newest first */
export async function getProductHistory(productId: string): Promise<HistoryEntry[]> {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT id, product_id, user_id, action, changed_at, old_data, new_data, notes
       FROM product_history
       WHERE product_id = '${esc(productId)}'
       ORDER BY changed_at DESC
       LIMIT 100`
    );
    if (result.length === 0 || result[0]!.values.length === 0) return [];
    return result[0]!.values.map((r: any[]) => ({
      id: String(r[0]),
      productId: String(r[1]),
      userId: r[2] != null ? String(r[2]) : null,
      action: String(r[3]),
      changedAt: Number(r[4]) || 0,
      oldData: r[5] != null ? String(r[5]) : null,
      newData: r[6] != null ? String(r[6]) : null,
      notes: r[7] != null ? String(r[7]) : null,
    }));
  } catch {
    return [];
  }
}
