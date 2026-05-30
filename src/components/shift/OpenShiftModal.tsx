import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShiftStore } from '@/stores/shiftStore';
import { useAuthStore } from '@/stores/authStore';
import { CurrencyDollar, Clock } from 'phosphor-react';

interface OpenShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function OpenShiftModal({ open, onOpenChange, onSuccess }: OpenShiftModalProps) {
  const [openingCash, setOpeningCash] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const { openShift, loading } = useShiftStore();
  const { user } = useAuthStore();

  // ── Format helpers ───────────────────────────────────────────────────────────
  const formatRupiah = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return '0';
    return num.toLocaleString('id-ID');
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') {
      setOpeningCash('0');
    } else {
      setOpeningCash(String(parseInt(raw, 10)));
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleOpen = async () => {
    if (!user?.id) return;
    setError(null);
    const cash = Math.round(Number(openingCash) * 100);
    const res = await openShift(user.id, cash);
    if (res.ok) {
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(res.error || 'Gagal membuka shift');
    }
  };

  const handleClose = () => {
    setOpeningCash('0');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[360px] p-0 gap-0 sm:max-w-[360px] shadow-2xl bg-white">
        <DialogHeader className="px-3 pt-3 pb-1.5">
          <DialogTitle className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-800">
            <Clock weight="fill" className="w-3.5 h-3.5 text-emerald-500" />
            Buka Shift
          </DialogTitle>
          <DialogDescription className="pt-1.5 text-[10px] text-neutral-600 leading-relaxed">
            Masukkan uang modal awal untuk memulai shift.
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 pb-2 space-y-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[10px] text-red-700 leading-relaxed">
              {error}
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 text-[10px] text-neutral-500 bg-neutral-50 rounded-lg px-2.5 py-2">
              <span className="font-medium text-neutral-700">Kasir:</span>
              <span>{user.name}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Uang Modal Awal</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500 font-medium">Rp</span>
              <Input
                type="text"
                inputMode="numeric"
                value={formatRupiah(openingCash)}
                onChange={handleCashChange}
                placeholder="0"
                className="h-8 pl-8 text-[12px] tabular-nums"
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
          <Button variant="outline" size="xs" onClick={handleClose} className="h-7 px-3 text-[10px]">
            Batal
          </Button>
          <Button
            size="xs"
            onClick={handleOpen}
            disabled={loading || Number(openingCash) < 0}
            className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-[10px] text-white"
          >
            <CurrencyDollar weight="fill" className="w-3 h-3" />
            {loading ? 'Membuka...' : 'Buka Shift'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
