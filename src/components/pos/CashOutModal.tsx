import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Warning, CurrencyDollar } from 'phosphor-react';

interface CashOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  userId: string;
  onSuccess?: () => void;
}

export default function CashOutModal({ open, onOpenChange, shiftId, userId, onSuccess }: CashOutModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const amountNum = Number(amount) || 0;
    if (amountNum <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }
    if (!reason.trim()) {
      setError('Alasan pengeluaran wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await (window as any).api.cashFlowRecordOut({
        shiftId,
        amount: Math.round(amountNum * 100),
        reason: reason.trim(),
        userId,
      });

      if (res.ok) {
        setAmount('');
        setReason('');
        onOpenChange(false);
        onSuccess?.();
      } else {
        setError(res.error?.message || 'Gagal mencatat pengeluaran');
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setReason('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[360px] p-0 gap-0 sm:max-w-[360px] shadow-2xl bg-white">
        <DialogHeader className="px-3 pt-3 pb-1.5">
          <DialogTitle className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-800">
            <CurrencyDollar weight="fill" className="w-3.5 h-3.5 text-red-500" />
            Kas Keluar
          </DialogTitle>
          <DialogDescription className="pt-1.5 text-[10px] text-neutral-600 leading-relaxed">
            Catat pengeluaran kas dari laci (misal: beli keperluan toko, dll).
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 pb-2 space-y-2">
          {error && (
            <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2 text-[10px] text-red-700 leading-relaxed">
              <Warning weight="fill" className="w-3 h-3 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Jumlah</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500 font-medium">Rp</span>
              <Input
                type="text"
                inputMode="numeric"
                value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(raw);
                }}
                placeholder="0"
                className="h-9 pl-8 text-[12px] tabular-nums"
                autoFocus
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Alasan</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Misal: beli plastik, bensin, dll"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none placeholder:text-neutral-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
          <Button variant="outline" size="xs" onClick={handleClose} className="h-7 px-3 text-[10px]">
            Batal
          </Button>
          <Button
            size="xs"
            onClick={handleSubmit}
            disabled={loading || !amount || Number(amount) <= 0 || !reason.trim()}
            className="h-7 px-3 bg-red-600 hover:bg-red-700 text-[10px] text-white"
          >
            {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
