'use client';

import { useMemo, useState, useEffect } from 'react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/fragments/data-table';
import { cn } from '@/lib/utils';
import { CaretUp, CaretDown, MagnifyingGlass, Funnel, ArrowClockwise } from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'createdAt' | 'productName' | 'type' | 'quantity' | 'locationName';
type SortDir = 'asc' | 'desc';

// ─── Badge colors by type ──────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  in:         { label: 'Masuk',    className: 'bg-emerald-100 text-emerald-700' },
  out:        { label: 'Keluar',   className: 'bg-amber-100 text-amber-700' },
  adjustment: { label: 'Adjust',   className: 'bg-blue-100 text-blue-700' },
  sale:       { label: 'Jual',     className: 'bg-indigo-100 text-indigo-700' },
  return:     { label: 'Retur',    className: 'bg-cyan-100 text-cyan-700' },
  damage:     { label: 'Rusak',    className: 'bg-red-100 text-red-700' },
  expired:    { label: 'Expired',  className: 'bg-orange-100 text-orange-700' },
  transfer_in:  { label: 'Transfer In',  className: 'bg-violet-100 text-violet-700' },
  transfer_out: { label: 'Transfer Out', className: 'bg-pink-100 text-pink-700' },
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function InventoryLogTable() {
  const { logs, loading, fetchLogs } = useInventoryStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Fetch logs langsung dari DB setiap kali component mount
  useEffect(() => {
    fetchLogs({ limit: 500 });
  }, [fetchLogs]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...logs];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.productName?.toLowerCase().includes(q) ||
          l.productId.toLowerCase().includes(q) ||
          (l.reason ?? '').toLowerCase().includes(q) ||
          (l.locationName ?? '').toLowerCase().includes(q)
      );
    }

    if (typeFilter) {
      list = list.filter((l) => l.type === typeFilter);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'createdAt':
          cmp = a.createdAt - b.createdAt;
          break;
        case 'productName':
          cmp = (a.productName ?? '').localeCompare(b.productName ?? '');
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'quantity':
          cmp = a.quantity - b.quantity;
          break;
        case 'locationName':
          cmp = (a.locationName ?? '').localeCompare(b.locationName ?? '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [logs, search, typeFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-3 py-2 flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk, lokasi, alasan…"
            className="h-7 pl-7 text-[11px]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-7 px-2 text-[11px] border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Semua tipe</option>
          {Object.entries(TYPE_BADGE).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <Funnel className="w-3.5 h-3.5 text-neutral-400" />

        <button
          onClick={() => fetchLogs({ limit: 500 })}
          disabled={loading}
          className="ml-1 text-neutral-400 hover:text-indigo-600 disabled:opacity-40"
          title="Refresh"
        >
          <ArrowClockwise className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <DataTable
          data={filtered}
          getRowKey={(log) => log.id}
          emptyMessage={loading ? 'Memuat…' : 'Belum ada log stok'}
          columns={[
            {
              key: 'createdAt',
              header: (
                <span className="flex items-center gap-0.5">
                  Tanggal
                  {sortKey === 'createdAt' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              onHeaderClick: () => toggleSort('createdAt'),
              cellClassName: 'text-[10px] text-neutral-500 whitespace-nowrap',
              render: (log) => formatDate(log.createdAt),
            },
            {
              key: 'productName',
              header: (
                <span className="flex items-center gap-0.5">
                  Produk
                  {sortKey === 'productName' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              onHeaderClick: () => toggleSort('productName'),
              cellClassName: 'text-[11px] font-medium text-neutral-800',
              render: (log) => log.productName || log.productId,
            },
            {
              key: 'locationName',
              header: (
                <span className="flex items-center gap-0.5">
                  Lokasi
                  {sortKey === 'locationName' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              onHeaderClick: () => toggleSort('locationName'),
              cellClassName: 'text-[10px] text-neutral-600',
              render: (log) => log.locationName || <span className="text-neutral-300 italic">—</span>,
            },
            {
              key: 'type',
              header: (
                <span className="flex items-center gap-0.5">
                  Tipe
                  {sortKey === 'type' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              onHeaderClick: () => toggleSort('type'),
              render: (log) => {
                const badge = TYPE_BADGE[log.type] ?? { label: log.type, className: 'bg-neutral-100 text-neutral-600' };
                return <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium', badge.className)}>{badge.label}</span>;
              },
            },
            {
              key: 'quantity',
              header: (
                <span className="flex items-center justify-end gap-0.5">
                  Qty
                  {sortKey === 'quantity' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              onHeaderClick: () => toggleSort('quantity'),
              headerClassName: 'text-right',
              cellClassName: 'text-[11px] text-right tabular-nums font-medium',
              render: (log) => {
                const isTransfer = log.type === 'transfer_in' || log.type === 'transfer_out';
                const isPositive = ['in', 'return', 'transfer_in'].includes(log.type);
                const qtyColor = isPositive ? 'text-emerald-600' : isTransfer ? 'text-violet-600' : 'text-red-600';
                return <span className={qtyColor}>{log.quantity > 0 ? '+' : ''}{log.quantity}</span>;
              },
            },
            {
              key: 'unit',
              header: 'Unit',
              headerClassName: 'text-center',
              cellClassName: 'text-[10px] text-neutral-500 text-center',
              render: (log) => log.unit,
            },
            {
              key: 'userName',
              header: 'User',
              cellClassName: 'text-[10px] text-neutral-400',
              render: (log) => log.userName || log.userId.substring(0, 8),
            },
            {
              key: 'reason',
              header: 'Alasan',
              cellClassName: 'text-[10px] text-neutral-500 max-w-[180px] truncate',
              render: (log) => <span title={log.reason ?? undefined}>{log.reason || '—'}</span>,
            },
          ]}
        />
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-7 flex items-center px-3 border-t border-neutral-200 bg-white text-[10px] text-neutral-500">
        <span>{filtered.length} entri</span>
      </div>
    </div>
  );
}
