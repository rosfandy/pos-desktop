import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Circle, Warning, MagnifyingGlass } from 'phosphor-react';
import type { Shift } from '@/lib/api';

interface ShiftHistoryProps {
  shifts: Shift[];
  loading: boolean;
}

export default function ShiftHistory({ shifts, loading }: ShiftHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  const filtered = statusFilter === 'all' ? shifts : shifts.filter((s) => s.status === statusFilter);

  if (loading && shifts.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-neutral-400">
        <span className="text-[11px]">Memuat…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card text-card-foreground">
        <MagnifyingGlass className="w-3 h-3 text-neutral-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-7 text-[11px] border border-neutral-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">Semua Status</option>
          <option value="open">Aktif</option>
          <option value="closed">Tutup</option>
        </select>
        <span className="text-[10px] text-neutral-400 tabular-nums ml-auto">{filtered.length} shift</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-neutral-300">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-[11px]">Belum ada shift</p>
          </div>
        ) : (
          filtered.map((shift) => (
            <ShiftRow key={shift.id} shift={shift} />
          ))
        )}
      </div>
    </div>
  );
}

function ShiftRow({ shift }: { shift: Shift }) {
  const isOpen = shift.status === 'open';
  const date = new Date(shift.openedAt).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = new Date(shift.openedAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const duration = isOpen
    ? formatDuration(shift.openedAt, Date.now())
    : formatDuration(shift.openedAt, shift.closedAt ?? Date.now());

  return (
    <div className="px-3 py-2 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center gap-2">
        <Circle
          weight="fill"
          className={cn('w-2.5 h-2.5 shrink-0', isOpen ? 'text-emerald-500' : 'text-neutral-300')}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-neutral-800">{shift.userName || '—'}</span>
            <span className={cn(
              'text-[10px] font-medium px-1 py-0.5 rounded',
              isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
            )}>
              {isOpen ? 'Aktif' : 'Tutup'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
            <span>{date} {time}</span>
            <span className="text-neutral-300">·</span>
            <span>{duration}</span>
            <span className="text-neutral-300">·</span>
            <span className="tabular-nums">Rp{(shift.totalSales / 100).toLocaleString('id-ID')}</span>
          </div>
        </div>
        {!isOpen && shift.discrepancy != null && shift.discrepancy !== 0 && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 shrink-0">
            <Warning weight="fill" className="w-3 h-3" />
            <span className={cn('tabular-nums', shift.discrepancy > 0 ? 'text-emerald-600' : 'text-red-500')}>
              {shift.discrepancy > 0 ? '+' : ''}Rp{(shift.discrepancy / 100).toLocaleString('id-ID')}
            </span>
          </div>
        )}
      </div>
      {shift.notes && (
        <p className="text-[10px] text-neutral-400 ml-5 mt-0.5 truncate">{shift.notes}</p>
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
