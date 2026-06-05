import { Clock, Circle } from 'phosphor-react';
import { cn } from '@/lib/utils';
import type { Shift } from '@/lib/api';

interface ShiftSummaryProps {
  shift: Shift | null;
  liveTotalSales?: number;
  onOpenShift?: () => void;
  onCloseShift?: () => void;
}

export default function ShiftSummary({ shift, liveTotalSales, onOpenShift, onCloseShift }: ShiftSummaryProps) {
  if (!shift) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
        <Circle weight="fill" className="w-2.5 h-2.5 text-neutral-400" />
        <span>Shift belum dibuka</span>
        {onOpenShift && (
          <button
            onClick={onOpenShift}
            className="text-indigo-600 hover:text-indigo-700 font-medium underline ml-1"
          >
            Buka Shift
          </button>
        )}
      </div>
    );
  }

  const isOpen = shift.status === 'open';
  const duration = isOpen
    ? formatDuration(shift.openedAt, Date.now())
    : formatDuration(shift.openedAt, shift.closedAt ?? Date.now());

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Clock weight="fill" className={cn('w-3 h-3', isOpen ? 'text-emerald-500' : 'text-neutral-400')} />
      <span className={cn('font-medium', isOpen ? 'text-emerald-700' : 'text-neutral-600')}>
        {isOpen ? 'Shift Aktif' : 'Shift Tutup'}
      </span>
      <span className="text-neutral-400">·</span>
      <span className="text-neutral-500">{duration}</span>
      <span className="text-neutral-400">·</span>
      <span className="text-neutral-500 tabular-nums">
        Rp{((liveTotalSales ?? shift.totalSales) / 100).toLocaleString('id-ID')}
      </span>
      {isOpen && onCloseShift && (
        <>
          <span className="text-neutral-300">|</span>
          <button
            onClick={onCloseShift}
            className="text-amber-600 hover:text-amber-700 font-medium underline"
          >
            Tutup Shift
          </button>
        </>
      )}
    </div>
  );
}

function formatDuration(from: number, to: number): string {
  const diffMs = to - from;
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m`;
}
