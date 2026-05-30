'use client';

import { useMemo, useState, useEffect } from 'react';
import { useInventoryStore } from '@/stores/inventoryStore';
import type { ProductRow } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MagnifyingGlass, Funnel, FileArrowUp, CaretUp, CaretDown } from 'phosphor-react';

function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T; error?: { code: string; message: string } };
    if (r.ok) return r.data as T;
  }
  return fallback ?? null;
}

type SortKey = 'productName' | 'openingBalance' | 'totalIn' | 'totalOut' | 'adjustmentNet' | 'closingBalance';
type SortDir = 'asc' | 'desc';

export default function StockMovementReport() {
  const { movementRows, movementLoading } = useInventoryStore();
  const [products, setProducts] = useState<ProductRow[]>([]);

  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [locationFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('productName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Load products for filter dropdown
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res: any = await window.api.productList({ isActive: true, limit: 200 });
        const page = unwrap<{ data: ProductRow[] }>(res, { data: [] });
        if (!cancelled && page?.data) {
          setProducts(page.data);
        }
      } catch {
        if (!cancelled) setProducts([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter
  const filtered = useMemo(() => {
    let list = [...movementRows];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.productName.toLowerCase().includes(q) || r.productId.toLowerCase().includes(q)
      );
    }

    if (productFilter) {
      list = list.filter((r) => r.productId === productFilter);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'productName':
          cmp = a.productName.localeCompare(b.productName);
          break;
        case 'openingBalance':
          cmp = a.openingBalance - b.openingBalance;
          break;
        case 'totalIn':
          cmp = a.totalIn - b.totalIn;
          break;
        case 'totalOut':
          cmp = a.totalOut - b.totalOut;
          break;
        case 'adjustmentNet':
          cmp = a.adjustmentNet - b.adjustmentNet;
          break;
        case 'closingBalance':
          cmp = a.closingBalance - b.closingBalance;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [movementRows, search, productFilter, locationFilter, sortKey, sortDir]);

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

  // ── Summary ──────────────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        opening: acc.opening + r.openingBalance,
        in: acc.in + r.totalIn,
        out: acc.out + r.totalOut,
        adjust: acc.adjust + r.adjustmentNet,
        closing: acc.closing + r.closingBalance,
      }),
      { opening: 0, in: 0, out: 0, adjust: 0, closing: 0 }
    );
  }, [filtered]);

  // ── Export ───────────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const header = ['Produk', 'Satuan', 'Saldo Awal', 'Total Masuk', 'Total Keluar', 'Penyesuaian', 'Saldo Akhir'];
    const rows = filtered.map((r) => [
      r.productName,
      r.baseUnit,
      String(r.openingBalance),
      String(r.totalIn),
      String(r.totalOut),
      String(r.adjustmentNet),
      String(r.closingBalance),
    ]);
    // Summary row
    const summaryRow = ['TOTAL', '', String(summary.opening), String(summary.in), String(summary.out), String(summary.adjust), String(summary.closing)];
    const csvContent = [header, ...rows, summaryRow].map((row) => row.join(',')).join('\n');
    const csv = '\uFEFF' + csvContent; // BOM for Excel UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-stok-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => {
    if (n === 0) return '—';
    const s = n > 0 ? `+${n}` : String(n);
    return s;
  };

  const qtyColor = (n: number) => {
    if (n > 0) return 'text-emerald-600';
    if (n < 0) return 'text-red-600';
    return 'text-neutral-600';
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
            placeholder="Cari produk…"
            className="h-7 pl-7 text-[11px]"
          />
        </div>

        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="h-7 px-2 text-[11px] border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Semua produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <Funnel className="w-3.5 h-3.5 text-neutral-400" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="h-7 text-[10px]"
        >
          <FileArrowUp className="w-3 h-3 mr-1" />
          CSV
        </Button>
      </div>

      {/* ── Summary strip ──────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-neutral-100 bg-neutral-50 px-3 py-2 grid grid-cols-5 gap-2">
        {[
          { label: 'Saldo Awal', val: summary.opening, color: 'text-neutral-600' },
          { label: 'Masuk', val: summary.in, color: 'text-emerald-600' },
          { label: 'Keluar', val: -summary.out, color: 'text-red-600' },
          { label: 'Adjust', val: summary.adjust, color: 'text-blue-600' },
          { label: 'Saldo Akhir', val: summary.closing, color: 'text-indigo-600 font-bold' },
        ].map(({ label, val, color }) => (
          <div key={label} className="text-center">
            <p className="text-[9px] text-neutral-400 uppercase tracking-wide">{label}</p>
            <p className={cn('text-[12px] font-semibold tabular-nums', color)}>{fmt(val)}</p>
          </div>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-neutral-50">
            <tr className="border-b border-neutral-200">
              <th
                className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('productName')}
              >
                <span className="flex items-center gap-0.5">
                  Produk
                  {sortKey === 'productName' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-center">
                Satuan
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-right cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('openingBalance')}
              >
                <span className="flex items-center justify-end gap-0.5">
                  Saldo Awal
                  {sortKey === 'openingBalance' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider text-right cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('totalIn')}
              >
                <span className="flex items-center justify-end gap-0.5">
                  Masuk
                  {sortKey === 'totalIn' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-red-600 uppercase tracking-wider text-right cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('totalOut')}
              >
                <span className="flex items-center justify-end gap-0.5">
                  Keluar
                  {sortKey === 'totalOut' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-blue-600 uppercase tracking-wider text-right cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('adjustmentNet')}
              >
                <span className="flex items-center justify-end gap-0.5">
                  Adjust
                  {sortKey === 'adjustmentNet' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-indigo-600 uppercase tracking-wider text-right cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('closingBalance')}
              >
                <span className="flex items-center justify-end gap-0.5">
                  Saldo Akhir
                  {sortKey === 'closingBalance' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {movementLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-400 text-[11px]">
                  Memuat…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-400 text-[11px]">
                  Belum ada data pergerakan stok
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.productId} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="px-3 py-2 text-[11px] font-medium text-neutral-800">
                    {row.productName}
                  </td>
                  <td className="px-3 py-2 text-[10px] text-neutral-500 text-center">
                    {row.baseUnit}
                  </td>
                  <td className={cn('px-3 py-2 text-[11px] text-right tabular-nums', qtyColor(row.openingBalance))}>
                    {fmt(row.openingBalance)}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-right tabular-nums text-emerald-600 font-medium">
                    +{row.totalIn}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-right tabular-nums text-red-600 font-medium">
                    -{row.totalOut}
                  </td>
                  <td className={cn('px-3 py-2 text-[11px] text-right tabular-nums', qtyColor(row.adjustmentNet))}>
                    {fmt(row.adjustmentNet)}
                  </td>
                  <td className={cn('px-3 py-2 text-[11px] text-right tabular-nums font-semibold', qtyColor(row.closingBalance))}>
                    {fmt(row.closingBalance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-7 flex items-center justify-between px-3 border-t border-neutral-200 bg-white text-[10px] text-neutral-500">
        <span>{filtered.length} produk</span>
      </div>
    </div>
  );
}
