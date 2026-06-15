import { getDb } from '../../db/index.ts';
import type { CashFlow } from '../../db/schema.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RecordCashFlowDTO {
  shiftId: string;
  type: 'in' | 'out';
  amount: number;   // in cents
  reason: string;
  userId: string;
}

export interface CashFlowRow {
  id: string;
  shiftId: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  userId: string;
  userName: string | null;
  createdAt: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export async function recordCashFlow(dto: RecordCashFlowDTO): Promise<CashFlowRow> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = Date.now();

  db.run(
    `INSERT INTO cash_flows (id, shift_id, type, amount, reason, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, dto.shiftId, dto.type, dto.amount, dto.reason, dto.userId, now]
  );

  return {
    id,
    shiftId: dto.shiftId,
    type: dto.type,
    amount: dto.amount,
    reason: dto.reason,
    userId: dto.userId,
    userName: null,
    createdAt: now,
  };
}

export async function listCashFlows(shiftId: string): Promise<CashFlowRow[]> {
  const db = await getDb();
  const rows = db.exec(
    `SELECT cf.*, u.name as user_name FROM cash_flows cf
     LEFT JOIN users u ON cf.user_id = u.id
     WHERE cf.shift_id = '${shiftId.replace(/'/g, "''")}'
     ORDER BY cf.created_at ASC`
  );

  if (!rows[0]) return [];

  const cols = rows[0].columns;
  return rows[0].values.map((r: unknown[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((col: string, i: number) => { obj[col] = r[i]; });
    return {
      id: obj.id,
      shiftId: obj.shift_id,
      type: obj.type,
      amount: obj.amount,
      reason: obj.reason,
      userId: obj.user_id,
      userName: obj.user_name || null,
      createdAt: obj.created_at,
    } as CashFlowRow;
  });
}

export async function getShiftCashFlowSummary(shiftId: string): Promise<{ totalIn: number; totalOut: number }> {
  const flows = await listCashFlows(shiftId);
  let totalIn = 0;
  let totalOut = 0;
  for (const f of flows) {
    if (f.type === 'in') totalIn += f.amount;
    else totalOut += f.amount;
  }
  return { totalIn, totalOut };
}

export async function listCashFlowsByDate(startDate: number, endDate: number): Promise<CashFlowRow[]> {
  const db = await getDb();
  const rows = db.exec(
    `SELECT cf.*, u.name as user_name FROM cash_flows cf
     LEFT JOIN users u ON cf.user_id = u.id
     WHERE cf.created_at >= ${startDate} AND cf.created_at <= ${endDate}
     ORDER BY cf.created_at ASC`
  );

  if (!rows[0]) return [];

  const cols = rows[0].columns;
  return rows[0].values.map((r: unknown[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((col: string, i: number) => { obj[col] = r[i]; });
    return {
      id: obj.id,
      shiftId: obj.shift_id,
      type: obj.type,
      amount: obj.amount,
      reason: obj.reason,
      userId: obj.user_id,
      userName: obj.user_name || null,
      createdAt: obj.created_at,
    } as CashFlowRow;
  });
}
