'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn, unwrap } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { SalesReport, StockReport, FinanceReport, Transaction } from '@/lib/api';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { DataTable } from '@/components/fragments/data-table';
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
  ChartLine,
  ChartPieSlice,
} from 'phosphor-react';
import {
  PosPage, PosToolbar, PosToolbarTitle,
  PosSideMenu, PosSideMenuHeader, PosSideMenuNav, PosSideMenuItem,
  PosPanel, PosButton, PosAlert, PosLabel, PosHint,
  PosEmptyState, PosEmptyTitle,
} from '@/components/ui/pos-ui';
import { PosTableSection } from '@/components/ui/table';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatRupiah = (cents: number) =>
  `Rp ${(Math.round(cents) / 100).toLocaleString('id-ID')}`;
const formatRupiahDirect = (v: number) =>
  `Rp ${Math.round(v).toLocaleString('id-ID')}`;
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TABS: { id: 'sales' | 'stock' | 'finance' | 'transactions'; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'sales',        label: 'Penjualan', icon: ChartLine,     desc: 'Omzet, untung, produk terlaris, metode bayar' },
  { id: 'transactions', label: 'Transaksi',  icon: Receipt,      desc: 'Daftar transaksi di periode tertentu' },
  { id: 'stock',        label: 'Stok',       icon: Package,      desc: 'Nilai stok, stok rendah, stok habis' },
  { id: 'finance',      label: 'Keuangan',   icon: ChartPieSlice, desc: 'Kas masuk, kas keluar, diskon, pajak' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'sales' | 'stock' | 'finance' | 'transactions'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'transaksi' || tab === 'transactions') return 'transactions';
    return 'sales';
  });

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
  const [cashFlows, setCashFlows] = useState<any[]>([]);
  const [cashFlowLoading, setCashFlowLoading] = useState(false);

  // Transactions
  const [txList, setTxList] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const startTs = Math.floor(new Date(startDate).getTime() / 1000);
  const endTs = Math.floor(new Date(endDate).getTime() / 1000) + 86399;

  // ── Fetchers ─────────────────────────────────────────────────────────────

  const fetchSales = async () => {
    setSalesLoading(true); setSalesError(null);
    try {
      const res = await window.api.reportSales({ startDate: startTs, endDate: endTs });
      const data = unwrap<SalesReport>(res);
      if (data) setSalesData(data);
      else setSalesError((res as any)?.error?.message || 'Gagal memuat laporan penjualan');
    } catch { setSalesError('Gagal memuat laporan penjualan'); }
    finally { setSalesLoading(false); }
  };
  const fetchStock = async () => {
    setStockLoading(true); setStockError(null);
    try {
      const res = await window.api.reportStock();
      const data = unwrap<StockReport>(res);
      if (data) setStockData(data);
      else setStockError((res as any)?.error?.message || 'Gagal memuat laporan stok');
    } catch { setStockError('Gagal memuat laporan stok'); }
    finally { setStockLoading(false); }
  };
  const fetchFinance = async () => {
    setFinanceLoading(true); setCashFlowLoading(true); setFinanceError(null);
    try {
      const [finRes, cfRes] = await Promise.all([
        window.api.reportFinance({ startDate: startTs, endDate: endTs }),
        window.api.cashFlowListByDate({ startDate: startTs * 1000, endDate: endTs * 1000 }),
      ]);
      const data = unwrap<FinanceReport>(finRes);
      if (data) setFinanceData(data);
      else setFinanceError((finRes as any)?.error?.message || 'Gagal memuat laporan keuangan');
      const cfData = unwrap<any[]>(cfRes);
      if (cfData) setCashFlows(cfData);
    } catch { setFinanceError('Gagal memuat laporan keuangan'); }
    finally { setFinanceLoading(false); setCashFlowLoading(false); }
  };
  const fetchTransactions = async () => {
    setTxLoading(true); setTxError(null);
    try {
      const res = await window.api.transactionList();
      const data = unwrap<Transaction[]>(res);
      if (data) setTxList(data.filter((tx) => tx.createdAt >= startTs && tx.createdAt <= endTs));
      else setTxError((res as any)?.error?.message || 'Gagal memuat transaksi');
    } catch { setTxError('Gagal memuat transaksi'); }
    finally { setTxLoading(false); }
  };

  useEffect(() => { if (activeTab === 'sales') fetchSales(); }, [activeTab, startDate, endDate]);
  useEffect(() => { if (activeTab === 'stock') fetchStock(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'finance') fetchFinance(); }, [activeTab, startDate, endDate]);
  useEffect(() => { if (activeTab === 'transactions') fetchTransactions(); }, [activeTab, startDate, endDate]);

  // ── Query param sync ─────────────────────────────────────────────────────

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    const target = paramTab === 'transaksi' || paramTab === 'transactions' ? 'transactions' : null;
    if (target !== null && target !== activeTab) setActiveTab(target);
  }, [searchParams]);

  const handleTabChange = (tab: 'sales' | 'stock' | 'finance' | 'transactions') => {
    setActiveTab(tab);
    if (tab === 'transactions') setSearchParams({ tab: 'transaksi' });
    else setSearchParams({});
  };

  // ── Cash flow summary ────────────────────────────────────────────────────

  const cashFlowSummary = useMemo(() => {
    let totalIn = 0, totalOut = 0;
    for (const cf of cashFlows) {
      if (cf.type === 'in') totalIn += cf.amount;
      else totalOut += cf.amount;
    }
    return { totalIn, totalOut };
  }, [cashFlows]);

  const filteredStock = useMemo(() => {
    if (!stockData || !stockSearch.trim()) return stockData;
    const q = stockSearch.toLowerCase();
    return {
      ...stockData,
      products: stockData.products.filter(
        (p) => p.productName.toLowerCase().includes(q) ||
               (p.sku ?? '').toLowerCase().includes(q) ||
               (p.categoryName ?? '').toLowerCase().includes(q),
      ),
    };
  }, [stockData, stockSearch]);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  // ── Toolbar per tab ─────────────────────────────────────────────────────

  const renderDateToolbar = (loading: boolean, onReload: () => void) => (
    <div className="h-9 flex items-center gap-3 px-3 border-b border-neutral-300 bg-white shrink-0">
      <div className="flex items-center gap-1.5">
        <PosLabel className="!text-neutral-500 whitespace-nowrap">Dari</PosLabel>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-7 w-36 text-[11px]" />
      </div>
      <div className="flex items-center gap-1.5">
        <PosLabel className="!text-neutral-500 whitespace-nowrap">Sampai</PosLabel>
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-7 w-36 text-[11px]" />
      </div>
      <PosButton variant="primary" onClick={onReload} disabled={loading}>
        {loading ? 'Memuat…' : 'Muat Ulang'}
      </PosButton>
    </div>
  );

  // ── Stat card ──────────────────────────────────────────────────────────

  const renderStat = (label: string, value: string, Icon: React.ElementType, color: string) => (
    <div className="bg-white border border-neutral-300 px-3 py-2.5 flex items-center gap-3 shadow-sm">
      <div className={cn('shrink-0', color)}><Icon weight="fill" className="w-6 h-6" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-neutral-500 truncate">{label}</p>
        <p className="text-lg font-bold leading-tight text-neutral-900 tabular-nums">{value}</p>
      </div>
    </div>
  );

  // ── Content renderers ───────────────────────────────────────────────────

  const renderSales = () => (
    <div className="flex flex-col h-full">
      {renderDateToolbar(salesLoading, fetchSales)}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {salesError && <PosAlert tone="error">{salesError}</PosAlert>}

        {salesLoading && !salesData && (
          <div className="flex items-center justify-center h-48 text-neutral-500">
            <Spinner className="w-4 h-4 text-indigo-500 animate-spin mr-2" />
            Memuat…
          </div>
        )}

        {salesData && (
          <>
            <div className="grid grid-cols-4 gap-3">
              {renderStat('Omzet',               formatRupiah(salesData.summary.totalRevenue), CurrencyDollar, 'text-emerald-600')}
              {renderStat('Untung / Rugi',       formatRupiah(salesData.summary.totalProfit),  ChartBar,       salesData.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600')}
              {renderStat('Total Transaksi',     String(salesData.summary.totalTransactions),  Receipt,        'text-indigo-600')}
              {renderStat('Rata-rata Transaksi', formatRupiah(salesData.summary.averageTicket),    TrendUp,        'text-violet-600')}
            </div>

            {/* Chart */}
            <div className="bg-white border border-neutral-300 shadow-sm">
              <div className="h-9 flex items-center px-3 border-b border-neutral-200 bg-neutral-50">
                <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">Trend Penjualan Harian</span>
              </div>
              <div className="p-3">
                {salesData.byDay.length > 0 ? (
                  <Chart
                    options={{
                      chart: { type: 'line', toolbar: { show: false }, fontFamily: 'inherit' },
                      stroke: { curve: 'smooth', width: 2 },
                      markers: { size: 0 },
                      xaxis: {
                        categories: salesData.byDay.map((d) => { const dt = new Date(d.date + 'T00:00:00'); return `${dt.getDate()}/${dt.getMonth() + 1}`; }),
                        labels: { style: { fontSize: '10px', colors: '#737373' } },
                        axisBorder: { show: false }, axisTicks: { show: false },
                      },
                      yaxis: {
                        labels: {
                          style: { fontSize: '10px', colors: '#737373' },
                          formatter: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v),
                        },
                      },
                      grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
                      tooltip: { y: { formatter: (v: number) => formatRupiahDirect(v) } },
                      colors: ['#6366f1'],
                      dataLabels: { enabled: false },
                    } as ApexOptions}
                    series={[{ name: 'Pendapatan', data: salesData.byDay.map((d) => d.revenue / 100) }]}
                    type="line" height={200}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 text-[11px] text-neutral-400">Tidak ada data untuk periode ini</div>
                )}
              </div>
            </div>

            {/* Daily breakdown */}
            <ReportTable title="Breakdown Harian">
              <DataTable
                data={salesData.byDay}
                getRowKey={(d) => d.date}
                emptyMessage="Belum ada data"
                columns={[
                  { key: 'date', header: 'Tanggal', render: (d) => formatDate(d.date) },
                  { key: 'transactions', header: 'Transaksi', headerClassName: 'text-center', cellClassName: 'text-center tabular-nums', render: (d) => d.transactions },
                  { key: 'revenue', header: 'Pendapatan', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums font-semibold', render: (d) => formatRupiah(d.revenue) },
                ]}
              />
            </ReportTable>

            <ReportTable title="Produk Terlaris">
              <DataTable
                data={salesData.byProduct}
                getRowKey={(p) => p.productId}
                emptyMessage="Belum ada data penjualan"
                columns={[
                  { key: 'no', header: 'No', headerClassName: 'w-10', cellClassName: 'text-neutral-400 tabular-nums', render: (_, i) => i + 1 },
                  { key: 'productName', header: 'Produk', cellClassName: 'font-medium', render: (p) => p.productName },
                  { key: 'quantity', header: 'Kuantitas', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums', render: (p) => p.quantity },
                  { key: 'revenue', header: 'Pendapatan', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums font-semibold text-indigo-600', render: (p) => formatRupiah(p.revenue) },
                ]}
              />
            </ReportTable>

            <ReportTable title="Metode Pembayaran">
              <DataTable
                data={salesData.byPayment}
                getRowKey={(pm) => pm.method}
                columns={[
                  { key: 'method', header: 'Metode', cellClassName: 'capitalize', render: (pm) => pm.method },
                  { key: 'count', header: 'Transaksi', headerClassName: 'text-center', cellClassName: 'text-center tabular-nums', render: (pm) => pm.count },
                  { key: 'total', header: 'Total', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums font-semibold', render: (pm) => formatRupiah(pm.total) },
                ]}
              />
            </ReportTable>

            <ReportTable title="Per Kasir">
              <DataTable
                data={salesData.byCashier}
                getRowKey={(c) => c.userId}
                columns={[
                  { key: 'userName', header: 'Kasir', render: (c) => c.userName || c.userId },
                  { key: 'transactions', header: 'Transaksi', headerClassName: 'text-center', cellClassName: 'text-center tabular-nums', render: (c) => c.transactions },
                  { key: 'total', header: 'Total', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums font-semibold', render: (c) => formatRupiah(c.total) },
                ]}
              />
            </ReportTable>

            <ReportTable title="Per Shift">
              <DataTable
                data={salesData.byShift}
                getRowKey={(s) => s.shiftId ?? 'no-shift'}
                emptyMessage="Belum ada data shift"
                columns={[
                  { key: 'shift', header: 'Shift', cellClassName: 'tabular-nums', render: (s) => s.shiftId ? new Date(s.openedAt * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : <span className="text-neutral-300 italic">Tanpa Shift</span> },
                  { key: 'cashier', header: 'Kasir', render: (s) => s.userName },
                  { key: 'status', header: 'Status', headerClassName: 'text-center', cellClassName: 'text-center', render: (s) => s.shiftId ? (
                    <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold', s.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600')}>
                      {s.status === 'open' ? 'Buka' : 'Tutup'}
                    </span>
                  ) : <span className="text-neutral-300">—</span> },
                  { key: 'transactions', header: 'Transaksi', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums', render: (s) => s.transactions },
                  { key: 'total', header: 'Total', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums font-semibold', render: (s) => formatRupiah(s.total) },
                ]}
              />
            </ReportTable>
          </>
        )}
      </div>
    </div>
  );

  const renderStock = () => (
    <div className="flex flex-col h-full">
      <div className="h-9 flex items-center gap-2 px-3 border-b border-neutral-300 bg-white shrink-0">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <Input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="Cari produk, SKU, kategori…" className="h-7 pl-7 pr-7 text-[11px]" />
          {stockSearch && (
            <button onClick={() => setStockSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <PosButton variant="primary" onClick={fetchStock} disabled={stockLoading}>{stockLoading ? 'Memuat…' : 'Muat Ulang'}</PosButton>
        {stockData && <span className="text-[10px] text-neutral-400 tabular-nums">{stockData.products.length} produk</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {stockError && <PosAlert tone="error">{stockError}</PosAlert>}

        {stockLoading && !stockData && (
          <div className="flex items-center justify-center h-48 text-neutral-500">
            <Spinner className="w-4 h-4 text-indigo-500 animate-spin mr-2" /> Memuat…
          </div>
        )}

        {filteredStock && (
          <>
            <div className="grid grid-cols-4 gap-3">
              {renderStat('Total Produk', String(filteredStock.products.length),   Package,      'text-violet-600')}
              {renderStat('Nilai Stok',   formatRupiah(filteredStock.totalValue),  CurrencyDollar, 'text-emerald-600')}
              {renderStat('Stok Rendah',  String(filteredStock.lowStockCount),      Warning,      'text-amber-500')}
              {renderStat('Stok Habis',   String(filteredStock.outOfStockCount),   Warning,      'text-red-500')}
            </div>

            <ReportTable title="Detail Stok">
              <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                <DataTable
                  data={filteredStock.products}
                  getRowKey={(p) => p.productId}
                  tableClassName="min-w-[800px]"
                  emptyMessage="Tidak ada produk"
                  rowClassName={(p) => p.currentStock <= 0 ? 'opacity-50' : undefined}
                  columns={[
                    { key: 'no', header: 'No', headerClassName: 'w-10', cellClassName: 'text-neutral-400 tabular-nums', render: (_, i) => i + 1 },
                    { key: 'productName', header: 'Produk', cellClassName: 'font-medium', render: (p) => p.productName },
                    { key: 'sku', header: 'SKU', cellClassName: 'font-mono', render: (p) => p.sku || '—' },
                    { key: 'categoryName', header: 'Kategori', render: (p) => p.categoryName || '—' },
                    { key: 'currentStock', header: 'Stok', headerClassName: 'text-center', cellClassName: 'text-center tabular-nums', render: (p) => (
                      <span className={p.currentStock <= 0 ? 'text-red-500 font-semibold' : p.currentStock <= p.minStock ? 'text-amber-500' : 'text-neutral-600'}>
                        {p.currentStock}
                      </span>
                    ) },
                    { key: 'baseUnit', header: 'Satuan', headerClassName: 'text-center', cellClassName: 'text-center', render: (p) => p.baseUnit },
                    { key: 'minStock', header: 'Min', headerClassName: 'text-center', cellClassName: 'text-center tabular-nums text-neutral-400', render: (p) => p.minStock },
                    { key: 'status', header: 'Status', headerClassName: 'text-center', cellClassName: 'text-center', render: (p) => (
                      <span className={cn('inline-block w-2 h-2 rounded-full', p.status === 'ok' ? 'bg-emerald-500' : p.status === 'low' ? 'bg-amber-400' : 'bg-red-500')} />
                    ) },
                    { key: 'stockValue', header: 'Nilai Stok', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums', render: (p) => formatRupiah(p.stockValue) },
                  ]}
                />
              </div>
            </ReportTable>
          </>
        )}
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="flex flex-col h-full">
      {renderDateToolbar(financeLoading, fetchFinance)}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {financeError && <PosAlert tone="error">{financeError}</PosAlert>}

        {financeLoading && !financeData && (
          <div className="flex items-center justify-center h-48 text-neutral-500">
            <Spinner className="w-4 h-4 text-indigo-500 animate-spin mr-2" /> Memuat…
          </div>
        )}

        {financeData && (
          <>
            <div className="grid grid-cols-4 gap-3">
              {renderStat('Kas Masuk',    formatRupiah(cashFlowSummary.totalIn),  CurrencyDollar, 'text-emerald-600')}
              {renderStat('Kas Keluar',   formatRupiah(cashFlowSummary.totalOut), ArrowUp,        'text-red-500')}
              {renderStat('Total Diskon', formatRupiah(financeData.discount),       ArrowDown,      'text-red-500')}
              {renderStat('Pajak',        formatRupiah(financeData.tax),            ChartBar,       'text-indigo-600')}
            </div>

            <ReportTable title="Arus Kas">
              <div className="pt-3">
                {(cashFlowSummary.totalIn > 0 || cashFlowSummary.totalOut > 0) ? (
                  <Chart
                    options={{
                      chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
                      plotOptions: { bar: { columnWidth: '45%', borderRadius: 3, horizontal: false, distributed: true } },
                      xaxis: {
                        categories: ['Kas Masuk', 'Kas Keluar'],
                        labels: { style: { fontSize: '11px', fontWeight: 600, colors: ['#059669', '#dc2626'] } },
                        axisBorder: { show: false }, axisTicks: { show: false },
                      },
                      yaxis: {
                        labels: {
                          style: { fontSize: '10px', colors: '#737373' },
                          formatter: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v),
                        },
                      },
                      grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
                      tooltip: { y: { formatter: (v: number) => formatRupiahDirect(v) } },
                      colors: ['#10b981', '#ef4444'],
                      dataLabels: { enabled: true, formatter: (v: number) => formatRupiahDirect(v), style: { fontSize: '10px', fontWeight: 600, colors: ['#fff'] } },
                    } as ApexOptions}
                    series={[{ name: 'Total', data: [cashFlowSummary.totalIn / 100, cashFlowSummary.totalOut / 100] }]}
                    type="bar" height={200}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 text-[11px] text-neutral-400">Tidak ada data untuk periode ini</div>
                )}
              </div>
            </ReportTable>

            <ReportTable title="Kas Masuk / Keluar">
              {cashFlowLoading ? (
                <div className="flex items-center justify-center py-8 text-neutral-500">
                  <Spinner className="w-4 h-4 text-indigo-500 animate-spin mr-2" /> Memuat…
                </div>
              ) : (
                <DataTable
                  data={cashFlows}
                  getRowKey={(cf) => cf.id}
                  tableClassName="min-w-[500px]"
                  emptyMessage="Belum ada data kas"
                  columns={[
                    { key: 'no', header: 'No', headerClassName: 'w-10', cellClassName: 'text-neutral-400 tabular-nums', render: (_, i) => i + 1 },
                    { key: 'date', header: 'Tanggal', cellClassName: 'tabular-nums', render: (cf) => new Date(cf.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                    { key: 'type', header: 'Tipe', render: (cf) => (
                      <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold', cf.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                        {cf.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                    ) },
                    { key: 'reason', header: 'Alasan', render: (cf) => cf.reason },
                    { key: 'userName', header: 'Kasir', render: (cf) => cf.userName || '-' },
                    { key: 'amount', header: 'Jumlah', headerClassName: 'text-right', cellClassName: cn('text-right tabular-nums font-semibold'), render: (cf) => (
                      <span className={cf.type === 'in' ? 'text-emerald-600' : 'text-red-600'}>
                        {cf.type === 'in' ? '' : '-'}{formatRupiah(cf.amount)}
                      </span>
                    ) },
                  ]}
                />
              )}
            </ReportTable>
          </>
        )}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="flex flex-col h-full">
      {renderDateToolbar(txLoading, fetchTransactions)}

      <div className="flex-1 overflow-y-auto p-3">
        {txError && <PosAlert tone="error">{txError}</PosAlert>}

        {txLoading && (
          <div className="flex items-center justify-center py-16 text-neutral-500">
            <Spinner className="w-4 h-4 text-indigo-500 animate-spin mr-2" /> Memuat transaksi…
          </div>
        )}

        {!txLoading && txList.length === 0 && (
          <PosEmptyState className="py-16">
            <Receipt weight="duotone" className="w-10 h-10 text-neutral-300" />
            <PosEmptyTitle>Belum ada transaksi di periode ini</PosEmptyTitle>
          </PosEmptyState>
        )}

        {!txLoading && txList.length > 0 && (
          <ReportTable title={`Daftar Transaksi · ${txList.length}`}>
            <DataTable
              data={txList}
              getRowKey={(tx) => tx.id}
              onRowClick={(tx) => setSelectedTxId(tx.id)}
              columns={[
                { key: 'no', header: 'No', headerClassName: 'w-10', cellClassName: 'text-neutral-400 tabular-nums', render: (_, i) => i + 1 },
                { key: 'invoiceNumber', header: 'No. Invoice', cellClassName: 'font-medium tabular-nums', render: (tx) => tx.invoiceNumber },
                { key: 'date', header: 'Tanggal', cellClassName: 'tabular-nums', render: (tx) => new Date(tx.createdAt * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                { key: 'customerName', header: 'Pembeli', render: (tx) => tx.customerName || '-' },
                { key: 'userName', header: 'Kasir', render: (tx) => tx.userName || '-' },
                { key: 'paymentMethod', header: 'Pembayaran', render: (tx) => (
                  <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold',
                    tx.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                    tx.paymentMethod === 'debit' ? 'bg-blue-100 text-blue-700' :
                    tx.paymentMethod === 'qris' ? 'bg-violet-100 text-violet-700' :
                    'bg-neutral-100 text-neutral-700')}>
                    {tx.paymentMethod === 'cash' ? 'Tunai' : tx.paymentMethod === 'debit' ? 'Debit' : tx.paymentMethod === 'qris' ? 'QRIS' : tx.paymentMethod === 'transfer' ? 'Transfer' : tx.paymentMethod === 'credit' ? 'Kredit' : tx.paymentMethod}
                  </span>
                ) },
                { key: 'total', header: 'Total', headerClassName: 'text-right', cellClassName: 'text-right font-semibold text-indigo-600 tabular-nums', render: (tx) => formatRupiah(tx.total) },
              ]}
            />
          </ReportTable>
        )}
      </div>

      <TransactionDetailModal open={selectedTxId !== null} onClose={() => setSelectedTxId(null)} transactionId={selectedTxId} />
    </div>
  );

  return (
    <PosPage>
      <PosSideMenu className="w-40">
        <PosSideMenuHeader>
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Laporan</span>
        </PosSideMenuHeader>
        <PosSideMenuNav>
          {TABS.map(({ id, label, icon: Icon }) => (
            <PosSideMenuItem key={id} active={activeTab === id} onClick={() => handleTabChange(id)}>
              <Icon weight={activeTab === id ? 'fill' : 'regular'} className="w-3.5 h-3.5 shrink-0" />
              {label}
            </PosSideMenuItem>
          ))}
        </PosSideMenuNav>
      </PosSideMenu>

      <PosPanel className="m-2">
        <PosToolbar>
          {(() => { const Icon = currentTab.icon; return <Icon weight="fill" className="w-3.5 h-3.5 text-indigo-600 mr-2" />; })()}
          <PosToolbarTitle>{currentTab.label}</PosToolbarTitle>
          <div className="flex-1" />
          <PosHint>{currentTab.desc}</PosHint>
        </PosToolbar>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'sales'        && renderSales()}
          {activeTab === 'stock'        && renderStock()}
          {activeTab === 'finance'      && renderFinance()}
          {activeTab === 'transactions' && renderTransactions()}
        </div>
      </PosPanel>
    </PosPage>
  );
}

// ─── Sub-component: panel with title bar (reused for all sub-tables) ───────────

function ReportTable({ title, children }: { title: string; children: React.ReactNode }) {
  return <PosTableSection title={title}>{children}</PosTableSection>;
}
