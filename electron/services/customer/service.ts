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
