import { useEffect, useState } from 'react';
import { CheckCircle, Circle } from 'phosphor-react';
import { useAuthStore } from '@/stores/authStore';
import { useShiftStore } from '@/stores/shiftStore';

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
    <div className="h-6 shrink-0 flex items-center px-3 gap-4 bg-card text-card-foreground border-t border-border select-none">
      <StatusItem icon={<CheckCircle weight="fill" className="w-3 h-3 text-emerald-500" />} label="Sistem aktif" />
      {currentShift ? (
        <StatusItem icon={<CheckCircle weight="fill" className="w-3 h-3 text-emerald-500" />} label="Shift aktif" />
      ) : (
        <StatusItem icon={<Circle weight="fill" className="w-3 h-3 text-amber-400" />} label="Shift belum dibuka" />
      )}
      <span className="text-[10px] text-muted-foreground tabular-nums">{totalProducts} produk</span>
      <div className="flex-1" />
      <span className="text-[10px] text-muted-foreground">
        {user ? `Masuk sebagai ${user.name}` : ''}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </span>
    </div>
  );
}
