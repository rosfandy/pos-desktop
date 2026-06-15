import { createShift, getOpenShift, updateShift, getById, getShiftSummary } from './repo.ts';
import type { ShiftRow, OpenShiftDTO, CloseShiftDTO } from './repo.ts';

// ─── Generate unique ID ──────────────────────────────────────────────────────

function generateId(): string {
  return `shf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Open Shift ──────────────────────────────────────────────────────────────

export async function openShift(data: { userId: string; openingCash: number }): Promise<ShiftRow> {
  if (data.openingCash < 0) {
    throw new Error('SHIFT_003');
  }

  const existing = await getOpenShift(data.userId);
  if (existing) {
    throw new Error('SHIFT_001');
  }

  const dto: OpenShiftDTO = {
    id: generateId(),
    userId: data.userId,
    openingCash: data.openingCash,
  };

  return createShift(dto);
}

// ─── Close Shift ─────────────────────────────────────────────────────────────

export async function closeShift(data: { shiftId: string; closingCash: number; notes?: string }): Promise<ShiftRow> {
  if (data.closingCash < 0) {
    throw new Error('SHIFT_003');
  }

  const shift = await getById(data.shiftId);
  if (!shift || shift.status === 'closed') {
    throw new Error('SHIFT_002');
  }

  // Calculate from actual transactions
  const summary = await getShiftSummary(data.shiftId);
  const expectedCash = shift.openingCash + summary.totalCashSales;
  const discrepancy = data.closingCash - expectedCash;

  const dto: CloseShiftDTO = {
    shiftId: data.shiftId,
    closedAt: Date.now(),
    closingCash: data.closingCash,
    expectedCash,
    totalSales: summary.totalSales,
    totalCashSales: summary.totalCashSales,
    totalNonCashSales: summary.totalNonCashSales,
    discrepancy,
    notes: data.notes,
  };

  const updated = await updateShift(data.shiftId, {
    ...dto,
    status: 'closed',
  });

  if (!updated) throw new Error('SHIFT_002');
  return updated;
}

// ─── Get Current Shift ───────────────────────────────────────────────────────

export async function getCurrentShift(userId: string): Promise<ShiftRow | null> {
  return getOpenShift(userId);
}
import { getDb } from '../../db/index.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShiftRow {
  id: string;
  userId: string;
  openedAt: number;
  closedAt: number | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  totalSales: number;
  totalCashSales: number;
  totalNonCashSales: number;
  discrepancy: number | null;
  status: 'open' | 'closed';
  notes: string | null;
  userName?: string;
}

export interface OpenShiftDTO {
  id: string;
  userId: string;
  openingCash: number;
}

export interface CloseShiftDTO {
  shiftId: string;
  closedAt: number;
  closingCash: number;
  expectedCash: number;
  totalSales: number;
  totalCashSales: number;
  totalNonCashSales: number;
  discrepancy: number;
  notes?: string;
}

export interface ShiftFilter {
  userId?: string;
  status?: string;
  from?: number;
  to?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function rowToShift(row: unknown[]): ShiftRow {
  return {
    id: String(row[0]),
    userId: String(row[1]),
    openedAt: Number(row[2]),
    closedAt: row[3] != null ? Number(row[3]) : null,
    openingCash: Number(row[4]),
    closingCash: row[5] != null ? Number(row[5]) : null,
    totalSales: Number(row[6]),
    status: String(row[7]) as 'open' | 'closed',
    expectedCash: row[8] != null ? Number(row[8]) : null,
    totalCashSales: Number(row[9]),
    totalNonCashSales: Number(row[10]),
    discrepancy: row[11] != null ? Number(row[11]) : null,
    notes: row[12] != null ? String(row[12]) : null,
    userName: row[13] != null ? String(row[13]) : undefined,
  };
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function createShift(data: OpenShiftDTO): Promise<ShiftRow> {
  const db = await getDb();
  db.run(
    `INSERT INTO shifts (id, user_id, opened_at, opening_cash, status)
     VALUES (?, ?, ?, ?, 'open')`,
    [data.id, data.userId, Date.now(), data.openingCash]
  );
  return (await getById(data.id))!;
}

export async function getById(id: string): Promise<ShiftRow | null> {
  const db = await getDb();
  const rows = db.exec(
    `SELECT s.*, u.name AS user_name
     FROM shifts s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    [id]
  );
  if (!rows[0]?.values.length) return null;
  return rowToShift(rows[0].values[0]);
}

export async function getOpenShift(userId: string): Promise<ShiftRow | null> {
  const db = await getDb();
  const rows = db.exec(
    `SELECT s.*, u.name AS user_name
     FROM shifts s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.user_id = ? AND s.status = 'open'
     ORDER BY s.opened_at DESC
     LIMIT 1`,
    [userId]
  );
  if (!rows[0]?.values.length) return null;
  return rowToShift(rows[0].values[0]);
}

export async function updateShift(id: string, data: Partial<CloseShiftDTO & { status: string }>): Promise<ShiftRow | null> {
  const db = await getDb();
  const sets: string[] = [];
  const params: any[] = [];

  if (data.closedAt !== undefined) { sets.push('closed_at = ?'); params.push(data.closedAt); }
  if (data.closingCash !== undefined) { sets.push('closing_cash = ?'); params.push(data.closingCash); }
  if (data.expectedCash !== undefined) { sets.push('expected_cash = ?'); params.push(data.expectedCash); }
  if (data.totalSales !== undefined) { sets.push('total_sales = ?'); params.push(data.totalSales); }
  if (data.totalCashSales !== undefined) { sets.push('total_cash_sales = ?'); params.push(data.totalCashSales); }
  if (data.totalNonCashSales !== undefined) { sets.push('total_non_cash_sales = ?'); params.push(data.totalNonCashSales); }
  if (data.discrepancy !== undefined) { sets.push('discrepancy = ?'); params.push(data.discrepancy); }
  if (data.status !== undefined) { sets.push('status = ?'); params.push(data.status); }
  if (data.notes !== undefined) { sets.push('notes = ?'); params.push(data.notes); }

  if (sets.length === 0) return await getById(id);

  params.push(id);
  db.run(`UPDATE shifts SET ${sets.join(', ')} WHERE id = ?`, params);
  return await getById(id);
}

export async function listShifts(filter?: ShiftFilter): Promise<ShiftRow[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter?.userId) { conditions.push('s.user_id = ?'); params.push(filter.userId); }
  if (filter?.status) { conditions.push('s.status = ?'); params.push(filter.status); }
  if (filter?.from) { conditions.push('s.opened_at >= ?'); params.push(filter.from); }
  if (filter?.to) { conditions.push('s.opened_at <= ?'); params.push(filter.to); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.exec(
    `SELECT s.*, u.name AS user_name
     FROM shifts s
     LEFT JOIN users u ON u.id = s.user_id
     ${where}
     ORDER BY s.opened_at DESC`,
    params
  );
  return rows[0]?.values.map(rowToShift) ?? [];
}

export async function getShiftSummary(shiftId: string): Promise<{
  totalTransactions: number;
  totalSales: number;
  totalCashSales: number;
  totalNonCashSales: number;
}> {
  const db = await getDb();
  const rows = db.exec(
    `SELECT
       COUNT(*) AS total_transactions,
       COALESCE(SUM(total), 0) AS total_sales,
       COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) AS total_cash,
       COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN total ELSE 0 END), 0) AS total_non_cash
     FROM transactions
     WHERE shift_id = ? AND status = 'completed'`,
    [shiftId]
  );
  const r = rows[0]?.values[0] ?? [0, 0, 0, 0];
  return {
    totalTransactions: Number(r[0]),
    totalSales: Number(r[1]),
    totalCashSales: Number(r[2]),
    totalNonCashSales: Number(r[3]),
  };
}

