import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Warning, CurrencyDollar } from 'phosphor-react';
import {
  PosButton,
  PosForm,
  PosFormSection,
  PosLabel,
  PosHint,
  PosAlert,
} from '@/components/ui/pos-ui';

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
        <PosForm className="gap-0">
          <PosFormSection className="flex items-center gap-1.5">
            <CurrencyDollar weight="fill" className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wide">Kas Keluar</span>
          </PosFormSection>
          <PosHint className="leading-snug">
            Catat pengeluaran kas dari laci (misal: beli keperluan toko, dll).
          </PosHint>

          {error && (
            <PosAlert tone="error" className="flex items-start gap-1.5 text-[10px]">
              <Warning weight="fill" className="w-3 h-3 mt-0.5 shrink-0" />
              {error}
            </PosAlert>
          )}

          <div className="space-y-1">
            <PosLabel>Jumlah</PosLabel>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-medium">Rp</span>
              <Input
                type="text"
                inputMode="numeric"
                value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(raw);
                }}
                placeholder="0"
                className="h-8 pl-8 text-[11px] tabular-nums"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1">
            <PosLabel>Alasan</PosLabel>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Misal: beli plastik, bensin, dll"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none placeholder:text-neutral-400"
            />
          </div>
        </PosForm>

        <div className="pos-form-row h-9 justify-end px-3 border-t border-neutral-200">
          <PosButton variant="secondary" onClick={handleClose} className="h-7 px-3 text-[10px]">Batal</PosButton>
          <PosButton
            variant="danger"
            onClick={handleSubmit}
            disabled={loading || !amount || Number(amount) <= 0 || !reason.trim()}
            className="h-7 px-3 text-[10px]"
          >
            {loading ? 'Menyimpan…' : 'Simpan Pengeluaran'}
          </PosButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
