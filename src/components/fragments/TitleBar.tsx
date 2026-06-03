import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Storefront,
  Files,
  Database,
  SignOut,
  X,
  House,
  Package,
  Users,
  Cube,
  ChartBar,
  Clock,
  Gear,
  Receipt,
  ArrowsClockwise,
  Info,
  Minus,
  Square,
  CornersOut,
} from 'phosphor-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Custom title bar / menu bar
 * - Drag region: app brand + menu bar (left side, padding-left to mid)
 * - Window controls: minimize, maximize/restore, close (right side, no-drag)
 * - Menu items: File, Edit, View, Tools, Help
 */
export default function TitleBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const [isMaximized, setIsMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');

  // Set the displayed version (loaded from package.json in production; static fallback here)
  useEffect(() => {
    setAppVersion('1.5.7');
  }, []);

  const handleMinimize = () => {
    window.api.windowMinimize();
  };

  const handleMaximize = () => {
    window.api.windowMaximize();
    setIsMaximized((prev) => !prev);
  };

  const handleClose = () => {
    window.api.windowClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      toast({
        title: 'Gagal logout',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  const handleBackup = async () => {
    try {
      const res = (await window.api.backupCreate()) as { ok: boolean; data?: { filename: string }; error?: { message: string } };
      if (res?.ok) {
        toast({
          title: 'Berhasil',
          description: `Cadangan tersimpan: ${res.data?.filename ?? 'berhasil'}`,
        });
      } else {
        toast({
          title: 'Gagal',
          description: res?.error?.message ?? 'Gagal membuat cadangan',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  // Highlight the current route's menu item
  const isCurrent = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div
      // Drag region for moving the window (no-drag children for clickable items)
      className="h-9 shrink-0 flex items-stretch bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App brand */}
      <div
        onClick={() => handleNavigate('/')}
        className="flex items-center gap-2 px-3 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
        title="POS Desktop — buka dashboard"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center shrink-0">
          <Storefront weight="fill" className="w-3 h-3 text-white" />
        </div>
        <span className="text-[12px] font-semibold tracking-wide text-neutral-800 dark:text-neutral-100">
          POS Desktop
        </span>
      </div>

      {/* Separator */}
      <div className="w-px bg-neutral-300 dark:bg-neutral-800 my-1.5" />

      {/* Menu bar */}
      <div
        className="flex items-stretch"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* File menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="px-3 text-[12px] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 outline-none focus:bg-neutral-200 dark:focus:bg-neutral-800 data-[popup-open]:bg-neutral-200 dark:data-[popup-open]:bg-neutral-800"
          >
            File
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuLabel>Beranda</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleNavigate('/')}>
              <House />
              <span>Dashboard</span>
              <DropdownMenuSubLabel>Ctrl+H</DropdownMenuSubLabel>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Operasional</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleNavigate('/pos')}>
              <Storefront />
              <span>Buka Kasir</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/shifts')}>
              <Clock />
              <span>Manajemen Shift</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/reports')}>
              <ChartBar />
              <span>Laporan Penjualan</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Data</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleBackup}>
              <Database />
              <span>Buat Cadangan</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/settings')}>
              <Gear />
              <span>Pengaturan</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout}>
              <SignOut />
              <span>Logout</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClose} variant="destructive">
              <X />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-3 text-[12px] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 outline-none focus:bg-neutral-200 dark:focus:bg-neutral-800 data-[popup-open]:bg-neutral-200 dark:data-[popup-open]:bg-neutral-800">
            Edit
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuLabel>Produk</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleNavigate('/products')}>
              <Package />
              <span>Daftar Produk</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/products')}>
              <Files />
              <span>Import / Export</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Pelanggan</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleNavigate('/customers')}>
              <Users />
              <span>Daftar Pelanggan</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-3 text-[12px] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 outline-none focus:bg-neutral-200 dark:focus:bg-neutral-800 data-[popup-open]:bg-neutral-200 dark:data-[popup-open]:bg-neutral-800">
            View
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuItem
              onClick={() => handleNavigate('/')}
              data-active={isCurrent('/')}
            >
              <House />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate('/pos')}
              data-active={isCurrent('/pos')}
            >
              <Storefront />
              <span>Halaman Kasir</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate('/products')}
              data-active={isCurrent('/products')}
            >
              <Package />
              <span>Manajemen Produk</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate('/inventory')}
              data-active={isCurrent('/inventory')}
            >
              <Cube />
              <span>Inventaris</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate('/customers')}
              data-active={isCurrent('/customers')}
            >
              <Users />
              <span>Manajemen Pelanggan</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate('/reports')}
              data-active={isCurrent('/reports')}
            >
              <ChartBar />
              <span>Laporan</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate('/shifts')}
              data-active={isCurrent('/shifts')}
            >
              <Clock />
              <span>Shift</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tools menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-3 text-[12px] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 outline-none focus:bg-neutral-200 dark:focus:bg-neutral-800 data-[popup-open]:bg-neutral-200 dark:data-[popup-open]:bg-neutral-800">
            Tools
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuLabel>Utilitas</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleNavigate('/settings')}>
              <Gear />
              <span>Pengaturan</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.api.updaterCheck()}>
              <ArrowsClockwise />
              <span>Cek Pembaruan</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Data</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleBackup}>
              <Database />
              <span>Cadangkan Database</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/reports')}>
              <Receipt />
              <span>Cetak Ulang Struk</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-3 text-[12px] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 outline-none focus:bg-neutral-200 dark:focus:bg-neutral-800 data-[popup-open]:bg-neutral-200 dark:data-[popup-open]:bg-neutral-800">
            Help
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Info />
                <span>Tentang</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuLabel>POS Desktop</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toast({ title: 'POS Desktop', description: `Versi ${appVersion}` })}>
                  <Info />
                  <span>Versi Aplikasi</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ title: 'User', description: user?.name ?? 'Tidak diketahui' })}>
                  <Users />
                  <span>Pengguna Aktif</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.api.getDbPath().then((p: string) => toast({ title: 'Lokasi Database', description: typeof p === 'string' ? p : String(p) }))}>
                  <Database />
                  <span>Lokasi Database</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Spacer — drag region */}
      <div className="flex-1" />

      {/* Window controls */}
      <div
        className="flex items-stretch"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          aria-label="Minimize"
          className="w-11 h-full flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          className="w-11 h-full flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          {isMaximized ? (
            <CornersOut className="w-3.5 h-3.5" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={handleClose}
          aria-label="Close"
          className="w-11 h-full flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-red-500 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Inline helper: shortcut label (since DropdownMenuShortcut expects right-aligned text)
function DropdownMenuSubLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}
