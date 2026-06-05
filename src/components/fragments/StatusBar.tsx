import { useEffect, useState, useRef } from 'react';
import { CheckCircle, Circle, Printer } from 'phosphor-react';
import { useAuthStore } from '@/stores/authStore';
import { useShiftStore } from '@/stores/shiftStore';
import PrinterQueuePopover from '@/components/printer/PrinterQueuePopover';

function StatusItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default function StatusBar() {
  const { user } = useAuthStore();
  const { currentShift } = useShiftStore();
  const [totalProducts, setTotalProducts] = useState(0);
  const [showPrinterQueue, setShowPrinterQueue] = useState(false);
  const printerBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    window.api.productCount().then((res: any) => {
      if (cancelled) return;
      if (res && typeof res === 'object' && res.ok && res.data) {
        setTotalProducts(res.data.active ?? res.data.total ?? 0);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="h-6 shrink-0 flex items-center px-3 gap-4 bg-card text-card-foreground border-t border-border select-none relative">
      <StatusItem icon={<CheckCircle weight="fill" className="w-3 h-3 text-emerald-500" />} label="Sistem aktif" />
      {currentShift ? (
        <StatusItem icon={<CheckCircle weight="fill" className="w-3 h-3 text-emerald-500" />} label="Shift aktif" />
      ) : (
        <StatusItem icon={<Circle weight="fill" className="w-3 h-3 text-amber-400" />} label="Shift belum dibuka" />
      )}
      <span className="text-[10px] text-muted-foreground tabular-nums">{totalProducts} produk</span>
      <div className="flex-1" />
      <button
        ref={printerBtnRef}
        onClick={() => setShowPrinterQueue((prev) => !prev)}
        className="flex items-center gap-1 px-1.5 py-0.5 text-muted-foreground hover:text-indigo-600 hover:bg-muted/50 transition-colors"
        title="Lihat antrian printer"
      >
        <Printer weight="fill" className="w-3 h-3" />
      </button>
      <span className="text-[10px] text-muted-foreground">
        {user ? `Masuk sebagai ${user.name}` : ''}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </span>

      {/* Printer Queue Popover */}
      <PrinterQueuePopover
        open={showPrinterQueue}
        onClose={() => setShowPrinterQueue(false)}
        anchorRef={printerBtnRef}
      />
    </div>
  );
}
