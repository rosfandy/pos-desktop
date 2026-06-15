import { getDb } from '../../db/index.ts';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface InventoryLogRow {
  id: string;
  productId: string;
  locationId: string;
  locationName?: string;
  type: string;
  quantity: number;
  unit: string;
  conversionFactor: number;
  reason: string | null;
  referenceId: string | null;
  userId: string;
  createdAt: number;
  productName?: string;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StockInInput {
  productId: string;
  quantity: number;        // in display unit (e.g. kg, pcs)
  unit: string;
  locationId?: string;
  conversionFactor?: number;
  costPrice?: number;
  supplier?: string;
  reason?: string;
  userId: string;
  referenceId?: string;
}

export interface StockOutInput {
  productId: string;
  quantity: number;
  unit: string;
  locationId?: string;
  conversionFactor?: number;
  reason: string;
  userId: string;
  referenceId?: string;
}

export interface AdjustmentInput {
  productId: string;
  newQuantity: number;     // new absolute stock (in base unit)
  unit: string;
  locationId?: string;
  conversionFactor?: number;
  reason: string;
  userId: string;
}

export interface TransferInput {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  unit: string;
  conversionFactor?: number;
  reason: string;
  userId: string;
}

// ─── Errors ────────────────────────────────────────────────────────────────────

export class InventoryError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'InventoryError';
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Insert inventory log directly via getDb() */
async function insertLog(raw: {
  id: string;
  productId: string;
  locationId: string;
  type: string;
  quantity: number;
  unit: string;
  conversionFactor: number;
  reason?: string | null;
  referenceId?: string | null;
  userId: string;
  createdAt: number;
}): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO inventory_logs (id, product_id, location_id, type, quantity, unit, conversion_factor, reason, reference_id, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      raw.id, raw.productId, raw.locationId, raw.type, raw.quantity, raw.unit, raw.conversionFactor,
      raw.reason ?? null, raw.referenceId ?? null, raw.userId, raw.createdAt,
    ]
  );
}

// ─── Stock In ──────────────────────────────────────────────────────────────────

export async function stockIn(input: StockInInput): Promise<InventoryLogRow> {
  const db = await getDb();
  const factor = input.conversionFactor || 1;
  const baseQty = input.quantity * factor;
  const locationId = input.locationId || 'loc_main';

  db.run(`UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?`, [baseQty, Date.now(), input.productId]);

  const log: InventoryLogRow = {
    id: genId('inv'),
    productId: input.productId,
    locationId,
    type: 'in',
    quantity: baseQty,
    unit: input.unit,
    conversionFactor: factor,
    reason: input.reason || input.supplier || null,
    referenceId: input.referenceId ?? null,
    userId: input.userId,
    createdAt: Date.now(),
  };
  await insertLog(log);
  return log;
}

// ─── Stock Out ─────────────────────────────────────────────────────────────────

export async function stockOut(input: StockOutInput): Promise<InventoryLogRow> {
  const db = await getDb();
  const factor = input.conversionFactor || 1;
  const baseQty = input.quantity * factor;
  const locationId = input.locationId || 'loc_main';

  // Validate stock availability
  const result = db.exec(`SELECT stock FROM products WHERE id = '${esc(input.productId)}' LIMIT 1`);
  const currentStock = result.length > 0 && result[0]!.values.length > 0
    ? Number(result[0]!.values[0]![0]) || 0
    : 0;

  if (currentStock < baseQty) {
    throw new InventoryError('INV_001', `Stok tidak mencukupi. Tersedia: ${currentStock}, diminta: ${baseQty}`);
  }

  db.run(`UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?`, [baseQty, Date.now(), input.productId]);

  const log: InventoryLogRow = {
    id: genId('inv'),
    productId: input.productId,
    locationId,
    type: 'out',
    quantity: baseQty,
    unit: input.unit,
    conversionFactor: factor,
    reason: input.reason,
    referenceId: input.referenceId ?? null,
    userId: input.userId,
    createdAt: Date.now(),
  };
  await insertLog(log);
  return log;
}

// ─── Adjustment ────────────────────────────────────────────────────────────────

export async function adjust(input: AdjustmentInput): Promise<InventoryLogRow> {
  const db = await getDb();
  const factor = input.conversionFactor || 1;
  const newBaseQty = input.newQuantity * factor;
  const locationId = input.locationId || 'loc_main';

  // Update stock to new absolute value
  db.run(`UPDATE products SET stock = ?, updated_at = ? WHERE id = ?`, [newBaseQty, Date.now(), input.productId]);

  const log: InventoryLogRow = {
    id: genId('inv'),
    productId: input.productId,
    locationId,
    type: 'adjustment',
    quantity: newBaseQty,
    unit: input.unit,
    conversionFactor: factor,
    reason: input.reason,
    referenceId: null,
    userId: input.userId,
    createdAt: Date.now(),
  };
  await insertLog(log);
  return log;
}

// ─── Transfer Between Locations ─────────────────────────────────────────────────

export async function transferStock(input: TransferInput): Promise<{ outLog: InventoryLogRow; inLog: InventoryLogRow }> {
  const db = await getDb();
  const factor = input.conversionFactor || 1;
  const baseQty = input.quantity * factor;
  const now = Date.now();

  // Validate source stock
  const result = db.exec(`SELECT stock FROM products WHERE id = '${esc(input.productId)}' LIMIT 1`);
  const currentStock = result.length > 0 && result[0]!.values.length > 0
    ? Number(result[0]!.values[0]![0]) || 0
    : 0;

  if (currentStock < baseQty) {
    throw new InventoryError('INV_001', `Stok tidak mencukupi di lokasi asal. Tersedia: ${currentStock}, diminta: ${baseQty}`);
  }

  // Deduct from source, add to destination (single transaction)
  db.run('BEGIN TRANSACTION');
  try {
    db.run(`UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?`, [baseQty, now, input.productId]);
    db.run(`UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?`, [baseQty, now, input.productId]);

    const outLog: InventoryLogRow = {
      id: genId('xfr'),
      productId: input.productId,
      locationId: input.fromLocationId,
      type: 'transfer_out',
      quantity: baseQty,
      unit: input.unit,
      conversionFactor: factor,
      reason: input.reason,
      referenceId: null,
      userId: input.userId,
      createdAt: now,
    };

    const inLog: InventoryLogRow = {
      id: genId('xfr'),
      productId: input.productId,
      locationId: input.toLocationId,
      type: 'transfer_in',
      quantity: baseQty,
      unit: input.unit,
      conversionFactor: factor,
      reason: input.reason,
      referenceId: null,
      userId: input.userId,
      createdAt: now,
    };

    await insertLog(outLog);
    await insertLog(inLog);

    db.run('COMMIT');
    return { outLog, inLog };
  } catch (err) {
    try { db.run('ROLLBACK'); } catch { /* ignore */ }
    throw err;
  }
}

// ─── Query Helpers ─────────────────────────────────────────────────────────────

export async function getInventoryLogs(filter?: {
  productId?: string;
  type?: string;
  userId?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}): Promise<InventoryLogRow[]> {
  const db = await getDb();
  const clauses: string[] = [];

  if (filter?.productId) clauses.push(`il.product_id = '${esc(filter.productId)}'`);
  if (filter?.type) clauses.push(`il.type = '${esc(filter.type)}'`);
  if (filter?.userId) clauses.push(`il.user_id = '${esc(filter.userId)}'`);
  if (filter?.startDate) clauses.push(`il.created_at >= ${filter.startDate}`);
  if (filter?.endDate) clauses.push(`il.created_at <= ${filter.endDate}`);

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = filter?.limit ?? 100;
  const offset = filter?.offset ?? 0;

  const result = db.exec(
    `SELECT il.id, il.product_id, il.location_id, l.name, il.type, il.quantity, il.unit, il.conversion_factor,
            il.reason, il.reference_id, il.user_id, il.created_at, p.name, u.name
     FROM inventory_logs il
     LEFT JOIN products p ON il.product_id = p.id
     LEFT JOIN locations l ON il.location_id = l.id
     LEFT JOIN users u ON il.user_id = u.id
     ${where}
     ORDER BY il.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`
  );

  if (result.length === 0 || result[0]!.values.length === 0) return [];

  return result[0]!.values.map((r: any[]) => ({
    id: String(r[0]), productId: String(r[1]), locationId: String(r[2]),
    locationName: r[3] != null ? String(r[3]) : undefined,
    type: String(r[4]), quantity: Number(r[5]) || 0, unit: String(r[6]),
    conversionFactor: Number(r[7]) || 1,
    reason: r[8] != null ? String(r[8]) : null,
    referenceId: r[9] != null ? String(r[9]) : null,
    userId: String(r[10]), createdAt: Number(r[11]) || 0,
    productName: r[12] != null ? String(r[12]) : undefined,
    userName: r[13] != null ? String(r[13]) : undefined,
  }));
}

export async function getLogsByProduct(productId: string): Promise<InventoryLogRow[]> {
  return getInventoryLogs({ productId, limit: 1000 });
}

export async function getCurrentStock(productId: string): Promise<number> {
  const logs = await getLogsByProduct(productId);
  return logs.reduce((stock, log) => {
    switch (log.type) {
      case 'in':
      case 'return':
      case 'transfer_in':
        return stock + log.quantity;
      case 'out':
      case 'sale':
      case 'damage':
      case 'expired':
      case 'transfer_out':
        return stock - log.quantity;
      case 'adjustment':
        return log.quantity;
      default:
        return stock;
    }
  }, 0);
}

/** Validate that enough stock is available before a transaction */
export async function validateStockAvailability(
  productId: string,
  requestedQty: number,
  unitName: string,
  productUnits: Array<{ unitName: string; conversionFactor: number }>
): Promise<boolean> {
  const db = await getDb();
  const unit = productUnits.find((u) => u.unitName === unitName);
  const factor = unit?.conversionFactor || 1;
  const baseQty = requestedQty * factor;

  const result = db.exec(`SELECT stock FROM products WHERE id = '${esc(productId)}' LIMIT 1`);
  const currentStock = result.length > 0 && result[0]!.values.length > 0
    ? Number(result[0]!.values[0]![0]) || 0
    : 0;

  return currentStock >= baseQty;
}

// ─── Locations ──────────────────────────────────────────────────────────────────

export interface LocationRow {
  id: string;
  name: string;
  type: string;
  address: string | null;
  isActive: boolean;
}

export async function listLocations(): Promise<LocationRow[]> {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT id, name, type, address, is_active FROM locations ORDER BY name ASC`
    );
    if (result.length > 0 && result[0]!.values.length > 0) {
      return result[0]!.values.map((r: any[]) => ({
        id: String(r[0]),
        name: String(r[1]),
        type: String(r[2]),
        address: r[3] != null ? String(r[3]) : null,
        isActive: Boolean(r[4]),
      }));
    }
  } catch { /* ignore */ }
  // Fallback: default locations
  return [
    { id: 'loc_main', name: 'Toko Utama', type: 'store', address: null, isActive: true },
    { id: 'loc_warehouse', name: 'Gudang', type: 'warehouse', address: null, isActive: true },
    { id: 'loc_backroom', name: 'Back Room', type: 'backroom', address: null, isActive: true },
  ];
}

// ─── Stock Movement Report ──────────────────────────────────────────────────────

export interface StockMovementRow {
  productId: string;
  productName: string;
  baseUnit: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  adjustmentNet: number;
  closingBalance: number;
}

export async function getStockMovementReport(filter?: {
  productId?: string;
  locationId?: string;
  startDate?: number;
  endDate?: number;
  type?: string;
}): Promise<StockMovementRow[]> {
  try {
    const db = await getDb();
    const clauses: string[] = [];

    if (filter?.productId) clauses.push(`il.product_id = '${esc(filter.productId)}'`);
    if (filter?.locationId) clauses.push(`il.location_id = '${esc(filter.locationId)}'`);
    if (filter?.type) clauses.push(`il.type = '${esc(filter.type)}'`);
    if (filter?.startDate) clauses.push(`il.created_at >= ${filter.startDate}`);
    if (filter?.endDate) clauses.push(`il.created_at <= ${filter.endDate}`);

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    // Get distinct products that have logs in the period
    const productsResult = db.exec(
      `SELECT DISTINCT il.product_id, p.name, p.base_unit
       FROM inventory_logs il
       LEFT JOIN products p ON il.product_id = p.id
       ${where}
       ORDER BY p.name ASC`
    );

    if (productsResult.length === 0 || productsResult[0]!.values.length === 0) return [];

    const rows: StockMovementRow[] = [];

    for (const pr of productsResult[0]!.values) {
      const pid = String(pr[0]);
      const pname = pr[1] != null ? String(pr[1]) : pid;
      const baseUnit = pr[2] != null ? String(pr[2]) : 'pcs';

      // Opening balance: all logs before startDate (or all if no startDate)
      const openClauses = [`il.product_id = '${esc(pid)}'`];
      if (filter?.startDate) openClauses.push(`il.created_at < ${filter.startDate}`);
      const openWhere = `WHERE ${openClauses.join(' AND ')}`;

      const openResult = db.exec(
        `SELECT il.type, il.quantity FROM inventory_logs il ${openWhere}`
      );
      let opening = 0;
      if (openResult.length > 0 && openResult[0]!.values.length > 0) {
        opening = openResult[0]!.values.reduce((sum: number, r: any[]) => {
          const type = String(r[0]);
          const qty = Number(r[1]) || 0;
          if (['in', 'return', 'transfer_in'].includes(type)) return sum + qty;
          if (['out', 'sale', 'damage', 'expired', 'transfer_out'].includes(type)) return sum - qty;
          if (type === 'adjustment') return qty; // absolute override
          return sum;
        }, 0);
      }

      // Period movements
      const periodResult = db.exec(
        `SELECT il.type, il.quantity FROM inventory_logs il ${where} AND il.product_id = '${esc(pid)}'`
      );
      let totalIn = 0, totalOut = 0, adjustmentNet = 0;
      if (periodResult.length > 0 && periodResult[0]!.values.length > 0) {
        for (const r of periodResult[0]!.values) {
          const type = String(r[0]);
          const qty = Number(r[1]) || 0;
          if (['in', 'return', 'transfer_in'].includes(type)) totalIn += qty;
          else if (['out', 'sale', 'damage', 'expired', 'transfer_out'].includes(type)) totalOut += qty;
          else if (type === 'adjustment') adjustmentNet += qty;
        }
      }

      rows.push({
        productId: pid,
        productName: pname,
        baseUnit,
        openingBalance: opening,
        totalIn,
        totalOut,
        adjustmentNet,
        closingBalance: opening + totalIn - totalOut + adjustmentNet,
      });
    }

    return rows;
  } catch { /* ignore */ }
  return [];
}
