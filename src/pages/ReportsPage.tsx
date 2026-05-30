'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn, unwrap } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { SalesReport, StockReport, FinanceReport, Transaction } from '@/lib/api';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import {
  CurrencyDollar,
  Receipt,
  Package,
  Warning,
  ChartBar,
  TrendUp,
  ArrowUp,
  ArrowDown,
  MagnifyingGlass,
  XCircle,
  Spinner,
} from 'phosphor-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const formatRupiah = (cents: number) =>
  `Rp ${(Math.round(cents) / 100).toLocaleString('id-ID')}`;

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const TABS: { id: 'sales' | 'stock' | 'finance' | 'transactions'; label: string; icon: React.ElementType }[] = [
  { id: 'sales',        label: 'Penjualan',  icon: CurrencyDollar },
  { id: 'transactions', label: 'Transaksi',   icon: Receipt },
  { id: 'stock',        label: 'Stok',        icon: Package },
  { id: 'finance',      label: 'Keuangan',    icon: ChartBar },
];

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'sales' | 'stock' | 'finance' | 'transactions'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'transaksi' || tab === 'transactions') return 'transactions';
    return 'sales';
  });

  // Date range
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Sales
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  // Stock
  const [stockData, setStockData] = useState<StockReport | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockSearch, setStockSearch] = useState('');

  // Finance
  const [financeData, setFinanceData] = useState<FinanceReport | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  // Transactions
  const [txList, setTxList] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Timestamps (seconds)
  const startTs = Math.floor(new Date(startDate).getTime() / 1000);
  const endTs = Math.floor(new Date(endDate).getTime() / 1000) + 86399;

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchSales = async () => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      const res = await window.api.reportSales({ startDate: startTs, endDate: endTs });
      const data = unwrap<SalesReport>(res);
      if (data) setSalesData(data);
      else setSalesError((res as any)?.error?.message || 'Gagal memuat laporan penjualan');
    } catch { setSalesError('Gagal memuat laporan penjualan'); }
    finally { setSalesLoading(false); }
  };

  const fetchStock = async () => {
    setStockLoading(true);
    setStockError(null);
    try {
      const res = await window.api.reportStock();
      const data = unwrap<StockReport>(res);
      if (data) setStockData(data);
      else setStockError((res as any)?.error?.message || 'Gagal memuat laporan stok');
    } catch { setStockError('Gagal memuat laporan stok'); }
    finally { setStockLoading(false); }
  };

  const fetchFinance = async () => {
    setFinanceLoading(true);
    setFinanceError(null);
    try {
      const res = await window.api.reportFinance({ startDate: startTs, endDate: endTs });
      const data = unwrap<FinanceReport>(res);
      if (data) setFinanceData(data);
      else setFinanceError((res as any)?.error?.message || 'Gagal memuat laporan keuangan');
    } catch { setFinanceError('Gagal memuat laporan keuangan'); }
    finally { setFinanceLoading(false); }
  };

  // Auto-fetch on tab/date change
  useEffect(() => {
    if (activeTab === 'sales') fetchSales();
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'stock') fetchStock();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'finance') fetchFinance();
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab, startDate, endDate]);

  // Sync query param with tab changes
  useEffect(() => {
    const paramTab = searchParams.get('tab');
    const target = paramTab === 'transaksi' || paramTab === 'transactions' ? 'transactions' : null;
    if (target !== null && target !== activeTab) {
      setActiveTab(target);
    }
  }, [searchParams]);

  // Update query param when tab changes
  const handleTabChange = (tab: 'sales' | 'stock' | 'finance' | 'transactions') => {
    setActiveTab(tab);
    if (tab === 'transactions') {
      setSearchParams({ tab: 'transaksi' });
    } else {
      // Preserve empty params
      const newParams = new URLSearchParams();
      setSearchParams(Object.fromEntries(newParams));
    }
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    setTxError(null);
    try {
      const res = await window.api.transactionList();
      const data = unwrap<Transaction[]>(res);
      if (data) {
        // Filter by date
        const filtered = data.filter((tx) => {
          return tx.createdAt >= startTs && tx.createdAt <= endTs;
        });
        setTxList(filtered);
      } else setTxError((res as any)?.error?.message || 'Gagal memuat transaksi');
    } catch { setTxError('Gagal memuat transaksi'); }
    finally { setTxLoading(false); }
  };

  // ── Stock search filter ──────────────────────────────────────────────────

  const filteredStock = useMemo(() => {
    if (!stockData || !stockSearch.trim()) return stockData;
    const q = stockSearch.toLowerCase();
    return {
      ...stockData,
      products: stockData.products.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q) ||
          (p.categoryName ?? '').toLowerCase().includes(q)
      ),
    };
  }, [stockData, stockSearch]);

  // ── Tab bar common ───────────────────────────────────────────────────────

  const renderTabBar = (showDateRange = true) => (
    <div className="flex items-center gap-3 flex-wrap border-b border-neutral-200 bg-white px-4 py-2 shrink-0">
      {showDateRange && (
        <>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-medium text-neutral-500 whitespace-nowrap">Dari</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 w-36 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-medium text-neutral-500 whitespace-nowrap">Sampai</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-7 w-36 text-[11px]"
            />
          </div>
          <Button
            onClick={activeTab === 'sales' ? fetchSales : activeTab === 'finance' ? fetchFinance : fetchTransactions}
            disabled={activeTab === 'sales' ? salesLoading : activeTab === 'finance' ? financeLoading : txLoading}
            size="sm"
            className="h-7 text-[11px]"
          >
            {(activeTab === 'sales' ? salesLoading : activeTab === 'finance' ? financeLoading : txLoading) ? 'Memuat…' : 'Muat Ulang'}
          </Button>
        </>
      )}
    </div>
  );

  // ── Summary card ─────────────────────────────────────────────────────────

  const Card = ({
    label,
    value,
    icon: Icon,
    color,
    delta,
    up,
  }: {
    label: string;
    value: string;
    icon: React.ElementType;
    color: string;
    delta?: string;
    up?: boolean;
  }) => (
    <div className="bg-white border border-neutral-200 rounded px-3 py-2.5 flex items-center gap-3">
      <div className={cn('shrink-0', color)}><Icon weight="fill" className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-neutral-500 truncate">{label}</p>
        <p className="text-lg font-bold leading-tight text-neutral-900 tabular-nums">{value}</p>
      </div>
      {delta && (
        <div className={cn('flex items-center gap-0.5 text-[10px] font-medium shrink-0', up ? 'text-emerald-600' : 'text-amber-500')}>
          {up ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
          {delta}
        </div>
      )}
    </div>
  );

  // ── Table component ──────────────────────────────────────────────────────

  const TablePanel = ({
    title,
    toolbar,
    children,
  }: {
    title: string;
    toolbar?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="bg-white border border-neutral-200 rounded overflow-hidden">
      <div className="h-8 flex items-center justify-between px-3 border-b border-neutral-100 bg-neutral-50 shrink-0">
        <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">{title}</span>
        {toolbar && <div className="flex items-center gap-1">{toolbar}</div>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );

  // ── Render: Transactions ─────────────────────────────────────────────────

  if (activeTab === 'transactions') {
    return (
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-200 bg-white shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors',
                activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
              )}
            >
              <Icon weight={activeTab === id ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {renderTabBar(true)}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {txError && (
            <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-600">{txError}</div>
          )}

          {txLoading && (
            <div className="flex items-center justify-center py-16">
              <Spinner className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="ml-2 text-[11px] text-neutral-500">Memuat transaksi…</span>
            </div>
          )}

          {!txLoading && txList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt weight="duotone" className="w-10 h-10 text-neutral-300 mb-2" />
              <p className="text-[11px] text-neutral-400">Belum ada transaksi di periode ini</p>
            </div>
          )}

          {!txLoading && txList.length > 0 && (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 uppercase w-10">No</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 uppercase">No. Invoice</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Tanggal</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Pembeli</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Kasir</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Pembayaran</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {txList.map((tx, i) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTxId(tx.id)}
                    className="border-b border-neutral-100 hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2 text-[11px] text-neutral-400 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2 text-[11px] font-medium text-neutral-800 tabular-nums">{tx.invoiceNumber}</td>
                    <td className="px-4 py-2 text-[11px] text-neutral-600 tabular-nums">
                      {new Date(tx.createdAt * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-neutral-600">{tx.customerName || '-'}</td>
                    <td className="px-4 py-2 text-[11px] text-neutral-600">{tx.userName || '-'}</td>
                    <td className="px-4 py-2 text-[11px] text-neutral-600">
                      <span className={cn(
                        'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold',
                        tx.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                        tx.paymentMethod === 'debit' ? 'bg-blue-100 text-blue-700' :
                        tx.paymentMethod === 'qris' ? 'bg-violet-100 text-violet-700' :
                        'bg-neutral-100 text-neutral-700'
                      )}>
                        {tx.paymentMethod === 'cash' ? 'Tunai' :
                         tx.paymentMethod === 'debit' ? 'Debit' :
                         tx.paymentMethod === 'qris' ? 'QRIS' :
                         tx.paymentMethod === 'transfer' ? 'Transfer' :
                         tx.paymentMethod === 'credit' ? 'Kredit' : tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[11px] font-semibold text-indigo-600 text-right tabular-nums">{formatRupiah(tx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail modal */}
        <TransactionDetailModal
          open={selectedTxId !== null}
          onClose={() => setSelectedTxId(null)}
          transactionId={selectedTxId}
        />
      </div>
    );
  }

  // ── Render: Sales ────────────────────────────────────────────────────────

  if (activeTab === 'sales') {
    return (
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-200 bg-white shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors',
                activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
              )}
            >
              <Icon weight={activeTab === id ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {renderTabBar(true)}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {salesError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-600">{salesError}</div>
          )}

          {salesLoading && !salesData && (
            <div className="flex items-center justify-center h-48">
              <Spinner className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="ml-2 text-[11px] text-neutral-400">Memuat…</span>
            </div>
          )}

          {salesData && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <Card label="Omzet"               value={formatRupiah(salesData.summary.totalRevenue)}      icon={CurrencyDollar} color="text-emerald-600" />
                <Card label="Untung / Rugi"       value={formatRupiah(salesData.summary.totalProfit)}       icon={ChartBar}       color={salesData.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
                <Card label="Total Transaksi"     value={String(salesData.summary.totalTransactions)}       icon={Receipt}        color="text-indigo-600" />
                <Card label="Rata-rata Transaksi"  value={formatRupiah(salesData.summary.averageTicket)}     icon={TrendUp}        color="text-violet-600" />
              </div>

              {/* Revenue chart — ApexCharts */}
              <div className="bg-white border border-neutral-200 rounded overflow-hidden">
                <div className="h-8 flex items-center justify-between px-3 border-b border-neutral-100 bg-neutral-50 shrink-0">
                  <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">Trend Penjualan Harian</span>
                </div>
                <div className="p-3">
                  {salesData.byDay.length > 0 ? (
                    <Chart
                      options={(() => {
                        const opts: ApexOptions = {
                          chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', sparkline: { enabled: false } },
                          plotOptions: { bar: { columnWidth: '65%', borderRadius: 2 } },
                          xaxis: {
                            categories: salesData.byDay.map((d) => {
                              const dt = new Date(d.date + 'T00:00:00');
                              return `${dt.getDate()}/${dt.getMonth() + 1}`;
                            }),
                            labels: { style: { fontSize: '10px', colors: '#737373' } },
                            axisBorder: { show: false },
                            axisTicks: { show: false },
                          },
                          yaxis: {
                            labels: {
                              style: { fontSize: '10px', colors: '#737373' },
                              formatter: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v),
                            },
                          },
                          grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
                          tooltip: { y: { formatter: (v: number) => formatRupiah(v) } },
                          colors: ['#6366f1'],
                          dataLabels: { enabled: false },
                        };
                        return opts;
                      })()}
                      series={[{ name: 'Pendapatan', data: salesData.byDay.map((d) => d.revenue) }]}
                      type="bar"
                      height={200}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-32 text-[11px] text-neutral-400">Tidak ada data untuk periode ini</div>
                  )}
                </div>
              </div>

              {/* Top products */}
              <TablePanel title="Produk Terlaris">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[500px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase w-10">No</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Produk</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Kuantitas</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.byProduct.map((p, i) => (
                      <tr key={p.productId} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="px-3 py-2 text-[11px] text-neutral-400 tabular-nums">{i + 1}</td>
                        <td className="px-3 py-2 text-[11px] font-medium text-neutral-800">{p.productName}</td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums text-neutral-600">{p.quantity}</td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums font-semibold text-indigo-600">{formatRupiah(p.revenue)}</td>
                      </tr>
                    ))}
                    {salesData.byProduct.length === 0 && (
                      <tr><td colSpan={4} className="px-3 py-8 text-center text-[11px] text-neutral-400">Belum ada data penjualan</td></tr>
                    )}
                  </tbody>
                </table>
              </TablePanel>

              {/* Payment method */}
              <TablePanel title="Metode Pembayaran">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[400px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Metode</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Transaksi</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.byPayment.map((pm) => (
                      <tr key={pm.method} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="px-3 py-2 text-[11px] text-neutral-800 capitalize">{pm.method}</td>
                        <td className="px-3 py-2 text-[11px] text-center tabular-nums text-neutral-600">{pm.count}</td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums font-semibold text-neutral-800">{formatRupiah(pm.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TablePanel>

              {/* By cashier */}
              <TablePanel title="Per Kasir">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[400px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Kasir</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Transaksi</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.byCashier.map((c) => (
                      <tr key={c.userId} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="px-3 py-2 text-[11px] text-neutral-800">{c.userName || c.userId}</td>
                        <td className="px-3 py-2 text-[11px] text-center tabular-nums text-neutral-600">{c.transactions}</td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums font-semibold text-neutral-800">{formatRupiah(c.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TablePanel>

              {/* By shift */}
              <TablePanel title="Per Shift">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[500px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Shift</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Kasir</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Status</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Transaksi</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.byShift.map((s) => (
                      <tr key={s.shiftId ?? 'no-shift'} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="px-3 py-2 text-[11px] text-neutral-800 tabular-nums">
                          {s.shiftId ? (
                            <>
                              {new Date(s.openedAt * 1000).toLocaleDateString('id-ID', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </>
                          ) : (
                            <span className="text-neutral-300 italic">Tanpa Shift</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-neutral-600">{s.userName}</td>
                        <td className="px-3 py-2 text-[11px] text-center">
                          {s.shiftId ? (
                            <span className={cn(
                              'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold',
                              s.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                            )}>
                              {s.status === 'open' ? 'Buka' : 'Tutup'}
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums text-neutral-600">{s.transactions}</td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums font-semibold text-neutral-800">{formatRupiah(s.total)}</td>
                      </tr>
                    ))}
                    {salesData.byShift.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-8 text-center text-[11px] text-neutral-400">Belum ada data shift</td></tr>
                    )}
                  </tbody>
                </table>
              </TablePanel>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Stock ─────────────────────────────────────────────────────────

  if (activeTab === 'stock') {
    return (
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-200 bg-white shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors',
                activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
              )}
            >
              <Icon weight={activeTab === id ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Toolbar: search + refresh */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200 bg-white shrink-0">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <Input
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              placeholder="Cari produk, SKU, kategori…"
              className="h-7 pl-7 pr-7 text-[11px]"
            />
            {stockSearch && (
              <button onClick={() => setStockSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button onClick={fetchStock} disabled={stockLoading} size="sm" className="h-7 text-[11px]">
            {stockLoading ? 'Memuat…' : 'Muat Ulang'}
          </Button>
          {stockData && (
            <span className="text-[10px] text-neutral-400 tabular-nums">{stockData.products.length} produk</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {stockError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-600">{stockError}</div>
          )}

          {stockLoading && !stockData && (
            <div className="flex items-center justify-center h-48">
              <Spinner className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="ml-2 text-[11px] text-neutral-400">Memuat…</span>
            </div>
          )}

          {filteredStock && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <Card label="Total Produk"        value={String(filteredStock.products.length)}                                icon={Package}        color="text-violet-600" />
                <Card label="Nilai Stok"           value={formatRupiah(filteredStock.totalValue)}                               icon={CurrencyDollar} color="text-emerald-600" />
                <Card label="Stok Rendah"          value={String(filteredStock.lowStockCount)}                                  icon={Warning}        color="text-amber-500" />
                <Card label="Stok Habis"           value={String(filteredStock.outOfStockCount)}                               icon={Warning}        color="text-red-500" />
              </div>

              {/* Stock table */}
              <div className="bg-white border border-neutral-200 rounded overflow-hidden">
                <div className="h-8 flex items-center px-3 border-b border-neutral-100 bg-neutral-50 shrink-0">
                  <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">Detail Stok</span>
                </div>
                <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                  <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-neutral-50">
                      <tr className="border-b border-neutral-200">
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase w-10">No</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Produk</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">SKU</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Kategori</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Stok</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Satuan</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Min</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Status</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Nilai Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStock.products.length === 0 ? (
                        <tr><td colSpan={9} className="px-3 py-12 text-center text-[11px] text-neutral-400">Tidak ada produk</td></tr>
                      ) : (
                        filteredStock.products.map((p, i) => (
                          <tr key={p.productId} className={cn('border-b border-neutral-100 hover:bg-neutral-50', p.currentStock <= 0 && 'opacity-50')}>
                            <td className="px-3 py-2 text-[11px] text-neutral-400 tabular-nums">{i + 1}</td>
                            <td className="px-3 py-2 text-[11px] font-medium text-neutral-800">{p.productName}</td>
                            <td className="px-3 py-2 text-[11px] text-neutral-500 font-mono">{p.sku || '—'}</td>
                            <td className="px-3 py-2 text-[11px] text-neutral-500">{p.categoryName || '—'}</td>
                            <td className={cn('px-3 py-2 text-[11px] text-center tabular-nums', 
                              p.currentStock <= 0 ? 'text-red-500 font-semibold' : p.currentStock <= p.minStock ? 'text-amber-500' : 'text-neutral-600')}>
                              {p.currentStock}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-center text-neutral-500">{p.baseUnit}</td>
                            <td className="px-3 py-2 text-[11px] text-center tabular-nums text-neutral-400">{p.minStock}</td>
                            <td className="px-3 py-2 text-[11px] text-center">
                              <span className={cn(
                                'inline-block w-2 h-2 rounded-full',
                                p.status === 'ok' ? 'bg-emerald-500' : p.status === 'low' ? 'bg-amber-400' : 'bg-red-500'
                              )} title={p.status === 'ok' ? 'Aman' : p.status === 'low' ? 'Rendah' : 'Habis'} />
                            </td>
                            <td className="px-3 py-2 text-[11px] text-right tabular-nums text-neutral-600">{formatRupiah(p.stockValue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Finance ───────────────────────────────────────────────────────

  if (activeTab === 'finance') {
    return (
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-200 bg-white shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors',
                activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
              )}
            >
              <Icon weight={activeTab === id ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {renderTabBar(true)}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {financeError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-600">{financeError}</div>
          )}

          {financeLoading && !financeData && (
            <div className="flex items-center justify-center h-48">
              <Spinner className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="ml-2 text-[11px] text-neutral-400">Memuat…</span>
            </div>
          )}

          {financeData && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <Card label="Pendapatan"        value={formatRupiah(financeData.revenue)}         icon={CurrencyDollar} color="text-emerald-600" />
                <Card label="Total Diskon"       value={formatRupiah(financeData.discount)}        icon={ArrowDown}      color="text-red-500" />
                <Card label="Pajak"              value={formatRupiah(financeData.tax)}             icon={ChartBar}       color="text-indigo-600" />
                <Card label="Pendapatan Bersih"  value={formatRupiah(financeData.netRevenue)}      icon={ArrowUp}        color="text-emerald-600" />
              </div>

              {/* Finance chart — ApexCharts */}
              <div className="bg-white border border-neutral-200 rounded overflow-hidden">
                <div className="h-8 flex items-center justify-between px-3 border-b border-neutral-100 bg-neutral-50 shrink-0">
                  <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">Trend Pendapatan Harian</span>
                </div>
                <div className="p-3">
                  {financeData.byDay.length > 0 ? (
                    <Chart
                      options={(() => {
                        const opts: ApexOptions = {
                          chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', sparkline: { enabled: false } },
                          plotOptions: { bar: { columnWidth: '65%', borderRadius: 2 } },
                          xaxis: {
                            categories: financeData.byDay.map((d) => {
                              const dt = new Date(d.date + 'T00:00:00');
                              return `${dt.getDate()}/${dt.getMonth() + 1}`;
                            }),
                            labels: { style: { fontSize: '10px', colors: '#737373' } },
                            axisBorder: { show: false },
                            axisTicks: { show: false },
                          },
                          yaxis: {
                            labels: {
                              style: { fontSize: '10px', colors: '#737373' },
                              formatter: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v),
                            },
                          },
                          grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
                          tooltip: { y: { formatter: (v: number) => formatRupiah(v) } },
                          colors: ['#10b981'],
                          dataLabels: { enabled: false },
                        };
                        return opts;
                      })()}
                      series={[{ name: 'Pendapatan', data: financeData.byDay.map((d) => d.revenue) }]}
                      type="bar"
                      height={200}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-32 text-[11px] text-neutral-400">Tidak ada data untuk periode ini</div>
                  )}
                </div>
              </div>

              {/* Daily breakdown */}
              <TablePanel title="Breakdown Harian">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[500px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase">Tanggal</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Transaksi</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeData.byDay.map((d) => (
                      <tr key={d.date} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="px-3 py-2 text-[11px] text-neutral-600">{formatDate(d.date)}</td>
                        <td className="px-3 py-2 text-[11px] text-center tabular-nums text-neutral-600">{d.transactions}</td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums font-semibold text-neutral-800">{formatRupiah(d.revenue)}</td>
                      </tr>
                    ))}
                    {financeData.byDay.length === 0 && (
                      <tr><td colSpan={3} className="px-3 py-8 text-center text-[11px] text-neutral-400">Belum ada data</td></tr>
                    )}
                  </tbody>
                </table>
              </TablePanel>
            </>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
