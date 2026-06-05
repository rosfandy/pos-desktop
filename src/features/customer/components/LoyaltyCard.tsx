'use client';

import { useMemo } from 'react';
import type { CustomerRow } from '@/lib/api';
import { Crown, Coins, ArrowUpRight, ShoppingBag } from 'phosphor-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LoyaltyCardProps {
  customer: CustomerRow;
  onRedeemPoints?: (points: number) => void;
  className?: string;
}

// ─── Tier Definitions ───────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  bronze:   { bg: 'bg-orange-50',    text: 'text-orange-700',    border: 'border-orange-200',    ring: 'ring-orange-100' },
  silver:   { bg: 'bg-slate-50',     text: 'text-slate-600',     border: 'border-slate-200',     ring: 'ring-slate-100' },
  gold:     { bg: 'bg-yellow-50',    text: 'text-yellow-700',    border: 'border-yellow-200',    ring: 'ring-yellow-100' },
  platinum: { bg: 'bg-violet-50',    text: 'text-violet-700',    border: 'border-violet-200',    ring: 'ring-violet-100' },
};

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

const TIER_THRESHOLDS: Record<string, number> = {
  bronze:   0,
  silver:   100_000_000,   // Rp 1.000.000 in cents
  gold:     500_000_000,   // Rp 5.000.000
  platinum: 1_000_000_000, // Rp 10.000.000
};

const NEXT_TIER: Record<string, string | null> = {
  bronze:   'silver',
  silver:   'gold',
  gold:     'platinum',
  platinum: null,
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function LoyaltyCard({ customer, onRedeemPoints, className }: LoyaltyCardProps) {
  const currentTier = customer.tier;
  const nextTier = NEXT_TIER[currentTier];
  const tierStyle = TIER_COLORS[currentTier] || TIER_COLORS.bronze;
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;

  // Progress to next tier
  const progress = useMemo(() => {
    if (!nextThreshold) return 100;
    const current = customer.totalSpent;
    if (current >= nextThreshold) return 100;
    const prevThreshold = TIER_THRESHOLDS[currentTier];
    return Math.max(0, Math.min(100, ((current - prevThreshold) / (nextThreshold - prevThreshold)) * 100));
  }, [customer.totalSpent, currentTier, nextThreshold]);

  const remainingToNextTier = nextThreshold
    ? Math.max(0, nextThreshold - customer.totalSpent)
    : 0;

  return (
    <div className={cn(
      'rounded-xl border-2 overflow-hidden transition-all',
      tierStyle.border, tierStyle.ring, 'ring-4',
      className
    )}>
      {/* ── Header: Tier Badge + Tier Icon ─────────────────────────────────── */}
      <div className={cn('px-4 py-3 flex items-center justify-between', tierStyle.bg)}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{TIER_ICONS[currentTier]}</span>
          <div>
            <p className={cn('text-[18px] font-bold leading-tight', tierStyle.text)}>
              {TIER_LABEL[currentTier]}
            </p>
            <p className="text-[10px] text-neutral-500 font-medium">Member</p>
          </div>
        </div>
        <Crown className={cn('w-5 h-5', tierStyle.text)} weight="fill" />
      </div>

      {/* ── Points Balance ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-card text-card-foreground border-b border-border">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Poin Tersedia</p>
            <p className="text-[28px] font-bold text-indigo-600 tabular-nums leading-none mt-0.5">
              {customer.points.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-neutral-400 mt-1">
              ≈ Rp {(customer.points * 100).toLocaleString('id-ID')} nilai tukar
            </p>
          </div>
          {customer.points > 0 && onRedeemPoints && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => onRedeemPoints(customer.points)}
              className="flex items-center gap-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
              title="Tukar semua poin"
            >
              <Coins className="w-3.5 h-3.5" />
              Tukar Poin
            </Button>
          )}
        </div>
      </div>

      {/* ── Tier Progress ───────────────────────────────────────────────────── */}
      {nextTier && (
        <div className="px-4 py-3 bg-card text-card-foreground">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-neutral-500">Progress ke {TIER_LABEL[nextTier]}</span>
            <span className="text-neutral-400 font-mono">
              Rp {(remainingToNextTier / 100).toLocaleString('id-ID')} lagi
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', tierStyle.bg.replace('bg-', 'bg-').replace('-50', '-500'))}
              style={{
                width: `${progress}%`,
                backgroundColor: currentTier === 'bronze' ? '#f97316' :
                                 currentTier === 'silver' ? '#64748b' :
                                 currentTier === 'gold' ? '#eab308' : '#8b5cf6',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Stats Footer ────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <ShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-medium text-neutral-700">
            Rp {(customer.totalSpent / 100).toLocaleString('id-ID')}
          </span>
          <span>total belanja</span>
        </div>
        {nextTier && (
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
            <span>{TIER_LABEL[nextTier]}</span>
            <span className="text-neutral-400">next</span>
          </div>
        )}
      </div>
    </div>
  );
}
