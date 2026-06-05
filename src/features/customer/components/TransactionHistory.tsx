'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CustomerTransactionRow } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Receipt,
  CaretUp,
  CaretDown,
  Coins,
  Package,
} from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/fragments/data-table';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TransactionHistoryProps {
  customerId: string;
  className?: string;
}

type SortKey = 'date' | 'total' | 'invoice';
type SortDir = 'asc' | 'desc';

// ─── Payment Badge ──────────────────────────────────────────────────────────────

const PAYMENT_COLORS: Record<string, string> = {
  cash:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  qris:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  debit:   'bg-blue-50 text-blue-700 border-blue-200',
  transfer:'bg-slate-50 text-slate-600 border-slate-200',
  credit:  'bg-amber-50 text-amber-700 border-amber-200',
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  debit: 'Debit',
  transfer: 'Transfer',
  credit: 'Kredit',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  held:      { bg: 'bg-amber-50',  text: 'text-amber-700'  },
  voided:    { bg: 'bg-red-50',    text: 'text-red-700'    },
  refunded:  { bg: 'bg-slate-50', text: 'text-slate-600'  },
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'Selesai',
  held:      'Ditahan',
  voided:    'Dibatalkan',
  refunded:  'Diretur',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatRupiah(cents: number): string {
  return `Rp ${(cents / 100).toLocaleString('id-ID')}`;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function TransactionHistory({ customerId, className }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<CustomerTransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [limit] = useState(50);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await window.api.customerTransactions(customerId, limit);
      if (res.ok && res.data) {
        setTransactions(res.data);
      } else {
        setError(res.error?.message || 'Gagal memuat riwayat transaksi');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat transaksi');
    } finally {
      setIsLoading(false);
    }
  }, [customerId, limit]);

  useEffect(() => {
    if (customerId) {
      loadTransactions();
    }
  }, [customerId, loadTransactions]);

  // Sorted transactions
  const sorted = useMemo(() => {
    const list = [...transactions];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date':
          cmp = a.createdAt - b.createdAt;
          break;
        case 'total':
          cmp = a.total - b.total;
          break;
        case 'invoice':
          cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [transactions, sortKey, sortDir]);

  // Totals
  const totalSpent = useMemo(
    () => transactions.reduce((sum, t) => sum + t.total, 0),
    [transactions]
  );
  const totalTransactions = transactions.length;

  // ── Sort toggle ─────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('desc');
      return key;
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* ── Summary stats ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Receipt className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-medium text-neutral-700">{totalTransactions}</span>
          <span>transaksi</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Coins className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-medium text-neutral-700">{formatRupiah(totalSpent)}</span>
          <span>total</span>
        </div>
        <Button
          variant="link"
          size="xs"
          onClick={loadTransactions}
          className="ml-auto text-[10px] text-indigo-600"
        >
          Refresh
        </Button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-neutral-400 text-[12px]">
            Memuat…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-red-500 text-[12px]">
            <p>{error}</p>
            <Button variant="link" size="xs" onClick={loadTransactions} className="text-indigo-600 underline mt-1">Coba lagi</Button>
          </div>
        ) : (
          <DataTable
            data={sorted}
            getRowKey={(tx) => tx.id}
            emptyMessage={
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                <Receipt className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-[13px] font-medium">Belum ada transaksi</p>
                <p className="text-[11px] mt-1">Riwayat transaksi akan muncul di sini</p>
              </div>
            }
            columns={[
              {
                key: 'date',
                header: (
                  <span className="flex items-center gap-0.5">
                    Tanggal
                    {sortKey === 'date' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                  </span>
                ),
                sortable: true,
                onHeaderClick: () => toggleSort('date'),
                render: (tx) => (
                  <>
                    <p className="text-[11px] text-neutral-800 tabular-nums">{formatDate(tx.createdAt)}</p>
                    <p className="text-[10px] text-neutral-400">{formatTime(tx.createdAt)}</p>
                  </>
                ),
              },
              {
                key: 'invoiceNumber',
                sortable: true,
                onHeaderClick: () => toggleSort('invoice'),
                header: (
                  <span className="flex items-center gap-0.5">
                    No. Invoice
                    {sortKey === 'invoice' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                  </span>
                ),
                render: (tx) => (
                  <p className="text-[11px] text-neutral-800 font-mono">{tx.invoiceNumber}</p>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (tx) => {
                  const statusStyle = STATUS_COLORS[tx.status] || STATUS_COLORS.completed;
                  return (
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium', statusStyle.bg, statusStyle.text)}>
                      {STATUS_LABEL[tx.status] || tx.status}
                    </span>
                  );
                },
              },
              {
                key: 'paymentMethod',
                header: 'Metode',
                render: (tx) => {
                  const paymentStyle = PAYMENT_COLORS[tx.paymentMethod] || PAYMENT_COLORS.cash;
                  return (
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border', paymentStyle)}>
                      {PAYMENT_LABEL[tx.paymentMethod] || tx.paymentMethod}
                    </span>
                  );
                },
              },
              {
                key: 'itemCount',
                header: <Package className="w-3 h-3 inline" />,
                headerClassName: 'text-center',
                cellClassName: 'text-center text-[11px] text-neutral-500 tabular-nums',
                render: (tx) => tx.itemCount,
              },
              {
                key: 'total',
                sortable: true,
                onHeaderClick: () => toggleSort('total'),
                header: (
                  <span className="flex items-center justify-end gap-0.5">
                    Total
                    {sortKey === 'total' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                  </span>
                ),
                headerClassName: 'text-right',
                cellClassName: 'text-right text-[12px] font-semibold text-neutral-800 tabular-nums',
                render: (tx) => formatRupiah(tx.total),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
