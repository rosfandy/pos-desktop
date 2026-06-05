import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  Storefront,
  Package,
  Cube,
  ChartBar,
  CurrencyDollar,
  ShoppingCart,
  Receipt,
  Warning,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Spinner,
} from 'phosphor-react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useShiftStore } from '@/stores/shiftStore';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { cn, unwrap } from '@/lib/utils';
import type { ProductRow, Transaction } from '@/lib/api';
import LoginPage from '@/pages/LoginPage';
import SettingsPage from '@/pages/SettingsPage';
import POSTerminalPage from '@/pages/POSTerminalPage';
import ProductPage from '@/pages/ProductPage';
import InventoryPage from '@/pages/InventoryPage';
import CustomersPage from '@/pages/CustomersPage';
import ReportsPage from '@/pages/ReportsPage';
import ShiftPage from '@/pages/ShiftPage';
import { TransactionDetailModal } from '@/features/transaction/components/TransactionDetailModal';
import OpenShiftModal from '@/features/shift/components/OpenShiftModal';
import CloseShiftModal from '@/features/shift/components/CloseShiftModal';
import UpdateDialog from '@/features/update/components/UpdateDialog';
import Sidebar from '@/components/fragments/Sidebar';
import Toolbar from '@/components/fragments/Toolbar';
import StatusBar from '@/components/fragments/StatusBar';

// ── App Shell ─────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-2">
          <Spinner className="w-5 h-5 text-indigo-500 animate-spin" />
          <span className="text-[12px] text-neutral-500">Memuat…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch { return false; }
  });

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('sidebar_collapsed', String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Toolbar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-neutral-100">{children}</main>
        <StatusBar />
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Buka Kasir',    icon: Storefront, to: '/pos',       desc: 'Mulai transaksi' },
  { label: 'Tambah Produk', icon: Package,    to: '/products',  desc: 'Daftarkan produk' },
  { label: 'Laporan',       icon: ChartBar,   to: '/reports',   desc: 'Lihat penjualan' },
  { label: 'Inventaris',    icon: Cube,       to: '/inventory', desc: 'Update stok' },
];

function Panel({
  title,
  toolbar,
  children,
  className,
}: {
  title: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col bg-card text-card-foreground border border-border shadow-sm overflow-hidden', className)}>
      <div className="h-9 flex items-center justify-between px-3 border-b border-neutral-200 bg-neutral-50 shrink-0">
        <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">{title}</span>
        {toolbar && <div className="flex items-center gap-1">{toolbar}</div>}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentShift } = useShiftStore();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<ProductRow[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [shiftTxCount, setShiftTxCount] = useState(0);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    useShiftStore.getState().checkCurrentShift(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!currentShift?.id) return;
    let cancelled = false;
    window.api.shiftSummary(currentShift.id).then((res: any) => {
      if (cancelled || !res?.ok) return;
      setShiftTxCount(res.data?.totalTransactions ?? 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentShift?.id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [countsRes, lowStockRes, txsRes, catsRes] = await Promise.all([
          window.api.productCount(),
          window.api.productLowStock(),
          window.api.transactionList(),
          window.api.categoryList(),
        ]);

        if (cancelled) return;

        // Product count
        const counts = unwrap<{ total: number; active: number }>(countsRes);
        setTotalProducts(counts?.active ?? counts?.total ?? 0);

        // Low stock
        const lowStockData = unwrap<ProductRow[]>(lowStockRes) ?? [];
        const activeLow = lowStockData;
        setLowStockCount(activeLow.length);
        setLowStockProducts(activeLow.slice(0, 5));

        // Transactions — filter hanya status 'completed' (konsisten dengan laporan Penjualan)
        const allTransactions = unwrap<Transaction[]>(txsRes) ?? [];
        const completedTx = allTransactions.filter((tx: Transaction) => tx.status === 'completed');
        const todayStart = Math.floor(new Date(new Date().toDateString()).getTime() / 1000);
        const todayTx = completedTx.filter((tx: Transaction) => tx.createdAt >= todayStart);
        setTodaySales(todayTx.reduce((sum: number, tx: Transaction) => sum + tx.total, 0));
        setTodayTransactions(todayTx.length);
        setRecentTransactions(todayTx);

        // Categories
        const cats = unwrap<{ id: string }[]>(catsRes) ?? [];
        setTotalCategories(cats.length);
      } catch {
        // silently fail — dashboard tetap tampil tanpa data
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleOpenShiftSuccess = useCallback(() => {
    setShowOpenShiftModal(false);
    if (user?.id) useShiftStore.getState().checkCurrentShift(user.id);
  }, [user?.id]);

  const handleCloseShiftSuccess = useCallback(() => {
    setShowCloseShiftModal(false);
    if (user?.id) useShiftStore.getState().checkCurrentShift(user.id);
  }, [user?.id]);

  const formatRupiah = (cents: number) => `Rp ${(cents / 100).toLocaleString('id-ID')}`;
  const formatRupiahShort = (cents: number) => {
    const rp = cents / 100;
    const abs = Math.abs(rp);
    const sign = rp < 0 ? '-' : '';
    if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}jt`;
    if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`;
    return `${sign}Rp ${Math.round(abs).toLocaleString('id-ID')}`;
  };
  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
    <div className="flex flex-col gap-3 h-full p-2">
      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Penjualan Hari Ini', value: formatRupiahShort(todaySales), delta: `${todayTransactions} transaksi`, up: true,  icon: CurrencyDollar, color: 'text-emerald-600' },
          { label: 'Transaksi',          value: String(todayTransactions),     delta: `+${todayTransactions}`,  up: true,  icon: ShoppingCart,   color: 'text-indigo-600' },
          { label: 'Total Produk',       value: String(totalProducts),     delta: 'aktif', up: true,  icon: Package,  color: 'text-violet-600' },
          { label: 'Stok Menipis',       value: String(lowStockCount),     delta: `${totalCategories} kategori`, up: false, icon: Warning,  color: lowStockCount > 0 ? 'text-red-500' : 'text-amber-500' },
        ].map(({ label, value, delta, up, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card text-card-foreground border border-border rounded px-3 py-2.5 flex items-center gap-3"
          >
            <div className={cn('shrink-0', color)}>
              <Icon weight="fill" className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-neutral-500 truncate">{label}</p>
              <p className="text-lg font-bold leading-tight text-neutral-900 tabular-nums">{value}</p>
            </div>
            <div className={cn('flex items-center gap-0.5 text-[10px] font-medium shrink-0', up ? 'text-emerald-600' : 'text-amber-500')}>
              {up ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
              {delta}
            </div>
          </div>
        ))}
      </div>

      {/* Main panels row */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* Quick actions */}
        <Panel title="Aksi Cepat" className="w-48 shrink-0">
          <div className="p-2 flex flex-col gap-1">
            {QUICK_ACTIONS.map(({ label, icon: Icon, to, desc }) => (
              <Button
                key={label}
                variant="ghost"
                onClick={() => navigate(to)}
                className="flex items-center gap-2.5 px-2.5 py-2 w-full justify-start hover:bg-indigo-50 hover:text-indigo-700 group"
              >
                <Icon weight="fill" className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-indigo-500" />
                <div className='flex flex-col text-start'>
                  <p className="text-[11px] font-semibold text-neutral-700 group-hover:text-indigo-700 leading-tight">{label}</p>
                  <p className="text-[10px] text-neutral-400 leading-tight">{desc}</p>
                </div>
              </Button>
            ))}
          </div>
        </Panel>

        {/* Recent transactions */}
        <Panel
          title="Transaksi Terkini"
          className="flex-1"
          toolbar={
            <Button
              variant="link"
              size="xs"
              onClick={() => navigate('/reports?tab=transaksi')}
              className="text-[10px] text-indigo-600"
            >
              Semua
            </Button>
          }
        >
          {/* Table header */}
          <div className="grid grid-cols-[1fr_60px_80px_80px_80px] border-b border-neutral-100 bg-neutral-50">
            {['No. Transaksi', 'Pembeli', 'Waktu', 'Kasir', 'Total'].map((h) => (
              <div key={h} className="px-3 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                {h}
              </div>
            ))}
          </div>
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 h-36 text-center">
              <Receipt weight="duotone" className="w-8 h-8 text-neutral-300" />
              <p className="text-[11px] text-neutral-400">Belum ada transaksi hari ini</p>
            </div>
          ) : (
            <div className="overflow-y-auto ">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTxId(tx.id)}
                  className="grid grid-cols-[1fr_60px_80px_80px_80px] border-b border-neutral-50 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <div className="px-3 py-1.5 text-[11px] text-neutral-800 font-medium tabular-nums">
                    {tx.invoiceNumber}
                  </div>
                  <div className="px-3 py-1.5 text-[11px] text-neutral-600 truncate">
                    {tx.customerName || '-'}
                  </div>
                  <div className="px-3 py-1.5 text-[11px] text-neutral-500 tabular-nums">
                    {formatTime(tx.createdAt)}
                  </div>
                  <div className="px-3 py-1.5 text-[11px] text-neutral-500 truncate">
                    {tx.userName || '-'}
                  </div>
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-800 tabular-nums text-right">
                    {formatRupiah(tx.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Right column */}
        <div className="w-56 shrink-0 flex flex-col gap-3">

          {/* Shift status */}
          <Panel title="Status Shift">
            {currentShift ? (
              <div className="px-3 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Status</span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle weight="fill" className="w-3 h-3" />
                    Shift Aktif
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Modal Awal</span>
                  <span className="text-[11px] font-semibold text-neutral-800 tabular-nums">
                    Rp {(currentShift.openingCash / 100).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Transaksi</span>
                  <span className="text-[11px] font-semibold text-neutral-800 tabular-nums">
                    {shiftTxCount}
                  </span>
                </div>
                <div className="pt-1 border-t border-neutral-100 flex gap-2">
                  <Button
                    onClick={() => navigate('/shifts')}
                    variant="outline"
                    className="flex-1 text-[11px] font-semibold py-1.5 h-auto"
                  >
                    Lihat Shift
                  </Button>
                  <Button
                    onClick={() => setShowCloseShiftModal(true)}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold py-1.5 h-auto"
                  >
                    Tutup Shift
                  </Button>
                </div>
              </div>
            ) : (
              <div className="px-3 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Status</span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                    <XCircle weight="fill" className="w-3 h-3" />
                    Belum Buka
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Modal Awal</span>
                  <span className="text-[11px] font-semibold text-neutral-800 tabular-nums">Rp 0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Transaksi</span>
                  <span className="text-[11px] font-semibold text-neutral-800 tabular-nums">0</span>
                </div>
                <div className="pt-1 border-t border-neutral-100">
                  <Button
                    onClick={() => setShowOpenShiftModal(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold py-1.5"
                  >
                    Buka Shift
                  </Button>
                </div>
              </div>
            )}
          </Panel>

          {/* Stock alerts */}
          <Panel
            title="Peringatan Stok"
            toolbar={
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold',
                lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              )}>
                {lowStockCount}
              </span>
            }
            className="flex-1"
          >
            {lowStockCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 h-24 text-center">
                <CheckCircle weight="fill" className="w-6 h-6 text-emerald-400" />
                <p className="text-[11px] text-neutral-400">Semua stok aman</p>
              </div>
            ) : (
              <div className="flex flex-col overflow-y-auto max-h-full">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/inventory?tab=in&productId=${p.id}`)}
                    className="px-3 py-2 border-b border-neutral-50 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <p className="text-[11px] font-medium text-neutral-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-red-500 tabular-nums">
                      {p.stock} {p.baseUnit} (min {p.minStock})
                    </p>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <div className="px-3 py-2 text-[10px] text-indigo-600 text-center">
                    +{lowStockProducts.length - 5} produk lagi
                  </div>
                )}
              </div>
            )}
          </Panel>

        </div>
      </div>

    </div>

      {/* Transaction detail modal */}
      <TransactionDetailModal
        open={selectedTxId !== null}
        onClose={() => setSelectedTxId(null)}
        transactionId={selectedTxId}
      />
      <OpenShiftModal
        open={showOpenShiftModal}
        onOpenChange={setShowOpenShiftModal}
        onSuccess={handleOpenShiftSuccess}
      />
      {currentShift && (
        <CloseShiftModal
          open={showCloseShiftModal}
          onOpenChange={setShowCloseShiftModal}
          shift={currentShift}
          onSuccess={handleCloseShiftSuccess}
        />
      )}
    </>
  );
}

import { useAutoUpdater } from '@/hooks/useAutoUpdater';

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const initTheme = useThemeStore((s) => s.initTheme);
  const { status, info, showDialog, checkUpdate, downloadUpdate, installUpdate, skipUpdate } = useAutoUpdater();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  // Load settings on mount (includes font-size preference)
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply font-size class to <html>
  useEffect(() => {
    document.documentElement.className = document.documentElement.className
      .replace(/text-size-\S+/g, '')
      .trim();
    document.documentElement.classList.add(`text-size-${fontSize}`);
  }, [fontSize]);

  useEffect(() => {
    checkAuth();
    initTheme();
    // Check update 3 detik setelah app start (hanya di production)
    if ((window as any).api?.updaterCheck) {
      setTimeout(() => checkUpdate(), 3000);
    }
  }, [checkAuth, initTheme]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/"          element={<DashboardPage />} />
                  <Route path="/pos"       element={<POSTerminalPage />} />
                  <Route path="/products"  element={<ProductPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                   <Route path="/reports"   element={<ReportsPage />} />
                  <Route path="/shifts"    element={<ShiftPage />} />
                  <Route path="/settings"  element={<SettingsPage />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
      <UpdateDialog
        open={showDialog}
        status={status}
        info={info}
        onClose={skipUpdate}
        onDownload={downloadUpdate}
        onInstall={installUpdate}
      />
    </HashRouter>
  );
}
