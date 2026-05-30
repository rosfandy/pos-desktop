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
