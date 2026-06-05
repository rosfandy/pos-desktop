import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  CurrencyDollar, CheckCircle, Warning, X, QrCode, CreditCard,
  Money, ArrowClockwise, Receipt
} from 'phosphor-react';

type PaymentMethod = 'cash' | 'debit' | 'qris' | 'transfer';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, amount: number) => void;
  total: number;
}

const QUICK_AMOUNTS = [0];

export default function PaymentModal({ open, onClose, onConfirm, total }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [inputAmount, setInputAmount] = useState('');
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input saat modal terbuka / ganti method ke cash
  useEffect(() => {
    if (open && method === 'cash') {
      // Tunggu dialog animation + portal render selesai, lalu fokus
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [open, method]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      // Ctrl+1..4 / Cmd+1..4 untuk pilih metode (bekerja walau fokus di input)
      if ((e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        switch (e.key) {
          case '1': setMethod('cash'); break;
          case '2': setMethod('qris'); break;
          case '3': setMethod('debit'); break;
          case '4': setMethod('transfer'); break;
        }
        return;
      }

      // Space untuk Uang Pas (bekerja walau fokus di input)
      if (e.key === ' ' && method === 'cash') {
        e.preventDefault();
        handleQuickAmount(0);
        return;
      }

      // Enter untuk konfirmasi (bekerja walau fokus di input)
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmRef.current();
        return;
      }

      // Skip jika fokus di input (biar user bisa ngetik angka)
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Calculate current amount in cents
  const currentAmountCents = method === 'cash'
    ? (parseFloat(inputAmount) * 100 || total)
    : total;

  const handleConfirm = () => {
    if (method === 'cash' && currentAmountCents < total) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onConfirm(method, currentAmountCents);
    onClose();
    // Reset state
    setInputAmount('');
    setMethod('cash');
  };

  // ── Ref for handleConfirm (avoid stale closure in keyboard handler) ──────────
  const confirmRef = useRef(handleConfirm);
  confirmRef.current = handleConfirm;

  const handleQuickAmount = (amount: number) => {
    if (amount === 0) {
      // Uang Pas — set sesuai total tagihan
      setInputAmount(String(total / 100));
    } else {
      setInputAmount(String(amount));
    }
    setShowError(false);
  };

  const methods: { key: PaymentMethod; label: string; icon: any; color: string; shortcut: string }[] = [
    { key: 'cash', label: 'Tunai', icon: Money, color: 'bg-emerald-500', shortcut: 'Ctrl+1' },
    { key: 'qris', label: 'QRIS', icon: QrCode, color: 'bg-blue-500', shortcut: 'Ctrl+2' },
    { key: 'debit', label: 'Debit', icon: CreditCard, color: 'bg-purple-500', shortcut: 'Ctrl+3' },
    { key: 'transfer', label: 'Transfer', icon: ArrowClockwise, color: 'bg-amber-500', shortcut: 'Ctrl+4' },
  ];

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent showCloseButton={false} className="w-[420px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 sm:max-w-[420px] bg-card text-card-foreground">
          {/* Header */}
          <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Receipt weight="fill" className="w-4 h-4 text-indigo-600" />
              <span className="text-[12px] font-semibold text-neutral-700">Pembayaran</span>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Total */}
            <div className="text-center py-3 bg-indigo-50 rounded-lg">
              <p className="text-[10px] text-indigo-500 uppercase tracking-wide font-semibold">Total Tagihan</p>
              <p className="text-[28px] font-bold text-indigo-700 mt-0.5">
                Rp{(total / 100).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Kembalian — langsung di bawah total */}
            {method === 'cash' && currentAmountCents > 0 && (
              <div className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2',
                currentAmountCents < total ? 'bg-red-50' : 'bg-emerald-50'
              )}>
                <span className="text-[11px] text-neutral-500">Kembalian</span>
                <span className={cn(
                  'text-[14px] font-bold',
                  currentAmountCents < total ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {currentAmountCents < total ? '-' : ''}Rp{(Math.abs(currentAmountCents - total) / 100).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Payment Methods */}
            <div className="grid grid-cols-4 gap-2">
              {methods.map((m) => {
                const Icon = m.icon;
                const isActive = method === m.key;
                return (
                  <Button
                    key={m.key}
                    variant={null}
                    onClick={() => setMethod(m.key)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all h-auto w-auto',
                      isActive
                        ? `${m.color} text-red-500! border-transparent hover:text-white hover:brightness-110`
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    )}
                  >
                    <Icon weight="fill" className={cn('w-5 h-5', isActive && 'text-white')} />
                    <span className={cn('text-[10px] font-semibold', isActive && 'text-white')}>{m.label}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-bold font-mono leading-none border',
                      isActive
                        ? 'bg-white/30 text-white border-white/30'
                        : 'bg-blue-50 text-blue-600 border-blue-300'
                    )}>{m.shortcut}</span>
                  </Button>
                );
              })}
            </div>

            {/* Cash Input */}
            {method === 'cash' && (
              <div className="space-y-2">
                <div className="relative">
                  <CurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    ref={inputRef}
                    autoFocus={open && method === 'cash'}
                    type="number"
                    value={inputAmount}
                    onChange={(e) => {
                      setInputAmount(e.target.value);
                      setShowError(false);
                    }}
                    placeholder="Jumlah bayar"
                    className="h-11 pl-10 text-[14px] font-semibold text-right"
                    min={0}
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_AMOUNTS.map((amt) => (
                    <Button
                      key={amt}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleQuickAmount(amt)}
                      className="text-[11px] h-8 px-3 flex-1 min-w-[4rem] bg-neutral-300! hover:bg-neutral-300"
                    >
                      {amt === 0 ? 'Uang Pas' : `+${(amt / 1000).toFixed(0)}rb`}
                      {amt === 0 && (
                        <span className="ml-1.5 px-1 py-0.5 rounded text-[8px] font-bold font-mono leading-none border bg-blue-50 text-blue-600 border-blue-300">Space</span>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Error */}
                {showError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                    <Warning weight="fill" className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-[11px] text-red-600">Jumlah pembayaran kurang</p>
                  </div>
                )}
              </div>
            )}

            {/* Non-cash methods */}
            {method !== 'cash' && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                <CheckCircle weight="fill" className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-700">
                  Metode {methods.find(m => m.key === method)?.label} — total Rp{(total / 100).toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 h-12 flex items-center justify-end gap-2 px-4 border-t border-neutral-200 bg-neutral-50">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-4 text-[11px]">
              Batal (Esc)
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={method === 'cash' && currentAmountCents < total}
              className="h-8 px-4 hover:bg-indigo-700 text-[11px] text-white"
            >
              Konfirmasi (Enter)
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
