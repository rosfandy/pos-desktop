import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShiftStore } from '@/stores/shiftStore';
import { CurrencyDollar, Warning, ArrowDown } from 'phosphor-react';
import type { Shift, ShiftSummary, ApiResponse } from '@/lib/api';

interface CloseShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift;
  onSuccess?: () => void;
}

export default function CloseShiftModal({ open, onOpenChange, shift, onSuccess }: CloseShiftModalProps) {
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [txSummary, setTxSummary] = useState<{
    totalSales: number;
    totalCashSales: number;
    totalNonCashSales: number;
  } | null>(null);
  const [cashOutData, setCashOutData] = useState<{ totalOut: number; items: { amount: number; reason: string }[] }>({ totalOut: 0, items: [] });
  const { closeShift, loading } = useShiftStore();

  const openingCashRp = shift.openingCash / 100;

  // Fetch real transaction summary + cash out data when modal opens
  useEffect(() => {
    if (!open) return;

    // Load transaction summary
    window.api.shiftSummary(shift.id).then((res: ApiResponse<ShiftSummary>) => {
      if (res.ok && res.data) {
        setTxSummary({
          totalSales: res.data.totalSales || 0,
          totalCashSales: res.data.totalCashSales || 0,
          totalNonCashSales: res.data.totalNonCashSales || 0,
        });
      } else {
        // fallback to shift record values
        setTxSummary({
          totalSales: shift.totalSales,
          totalCashSales: shift.totalCashSales,
          totalNonCashSales: shift.totalNonCashSales,
        });
      }
    }).catch(() => {
      setTxSummary({
        totalSales: shift.totalSales,
        totalCashSales: shift.totalCashSales,
        totalNonCashSales: shift.totalNonCashSales,
      });
    });

    // Load cash out data
    window.api.cashFlowSummary(shift.id).then((res: any) => {
      if (res.ok && res.data) {
        setCashOutData((prev) => ({ ...prev, totalOut: res.data.totalOut || 0 }));
      }
    }).catch(() => {});
  }, [open, shift.id]);

  const summary = useMemo(() => {
    const cashSales = (txSummary?.totalCashSales ?? 0) / 100;
    const nonCashSales = (txSummary?.totalNonCashSales ?? 0) / 100;
    const totalSales = (txSummary?.totalSales ?? 0) / 100;
    const totalCashOut = cashOutData.totalOut / 100;
    // Expected cash = opening + cash sales - cash out
    const expectedCash = openingCashRp + cashSales - totalCashOut;
    const closingCashNum = Number(closingCash) || 0;
    const discrepancy = closingCashNum - expectedCash;

    return { cashSales, nonCashSales, totalSales, totalCashOut, expectedCash, discrepancy };
  }, [txSummary, cashOutData, closingCash, openingCashRp]);

  const handleClose = async () => {
    const cash = Math.round(Number(closingCash) * 100);
    const res = await closeShift(shift.id, cash, notes || undefined);
    if (res.ok) {
      setShowConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleCancel = () => {
    setClosingCash('');
    setNotes('');
    setShowConfirm(false);
    onOpenChange(false);
  };

  const isValid = closingCash !== '' && Number(closingCash) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[380px] p-0 gap-0 sm:max-w-[380px] bg-card text-card-foreground">
        <DialogHeader className="px-3 pt-3 pb-1.5">
          <DialogTitle className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-800">
            <CurrencyDollar weight="fill" className="w-3.5 h-3.5 text-amber-500" />
            Tutup Shift
          </DialogTitle>
          <DialogDescription className="pt-1.5 text-[10px] text-neutral-600 leading-relaxed">
            Masukkan uang fisik yang ada di tangan untuk menutup shift.
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 pb-2 space-y-1.5 max-h-[60vh] overflow-y-auto">
          {/* Summary */}
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-2.5 py-2 space-y-1 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Uang Modal Awal</span>
              <span className="font-medium text-neutral-700 tabular-nums">Rp{openingCashRp.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Penjualan Tunai</span>
              <span className="font-medium text-emerald-600 tabular-nums">Rp{summary.cashSales.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Penjualan Non-Tunai</span>
              <span className="font-medium text-indigo-600 tabular-nums">Rp{summary.nonCashSales.toLocaleString('id-ID')}</span>
            </div>
            {summary.totalCashOut > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 flex items-center gap-1">
                  <ArrowDown className="w-2.5 h-2.5 text-red-500" />
                  Kas Keluar
                </span>
                <span className="font-medium text-red-600 tabular-nums">-Rp{summary.totalCashOut.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="border-t border-neutral-200 pt-1 flex items-center justify-between font-medium">
              <span className="text-neutral-700">Total Penjualan</span>
              <span className="text-neutral-800 tabular-nums">Rp{summary.totalSales.toLocaleString('id-ID')}</span>
            </div>
            <div className="border-t border-dashed border-neutral-300 pt-1 flex items-center justify-between">
              <span className="text-neutral-700 font-medium">Uang Seharusnya</span>
              <span className="font-semibold text-neutral-800 tabular-nums">Rp{summary.expectedCash.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Input closing cash */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Uang Fisik di Tangan</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500 font-medium">Rp</span>
              <Input
                type="number"
                min="0"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0"
                className="h-8 pl-8 text-[12px] tabular-nums"
                autoFocus
              />
            </div>
          </div>

          {/* Discrepancy warning */}
          {closingCash !== '' && Number(closingCash) >= 0 && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-neutral-500">Selisih:</span>
              <span className={summary.discrepancy !== 0 ? 'text-red-600 font-semibold tabular-nums' : 'text-emerald-600 font-semibold tabular-nums'}>
                {summary.discrepancy >= 0 ? '+' : ''}Rp{summary.discrepancy.toLocaleString('id-ID')}
              </span>
              {Math.abs(summary.discrepancy) > 0 && (
                <Warning weight="fill" className="w-3 h-3 text-amber-500" />
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keterangan selisih..."
              rows={2}
              className="w-full rounded-lg border border-input px-2.5 py-1.5 text-[10px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
          {!showConfirm ? (
            <>
              <Button variant="outline" size="xs" onClick={handleCancel} className="h-7 px-3 text-[10px]">
                Batal
              </Button>
              <Button
                size="xs"
                onClick={() => setShowConfirm(true)}
                disabled={!isValid}
                className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-[10px] text-white"
              >
                Tutup Shift
              </Button>
            </>
          ) : (
            <>
              <span className="text-[10px] text-neutral-600 mr-auto">Yakin tutup shift?</span>
              <Button variant="outline" size="xs" onClick={() => setShowConfirm(false)} className="h-7 px-3 text-[10px]">
                Tidak
              </Button>
              <Button
                size="xs"
                onClick={handleClose}
                disabled={loading}
                className="h-7 px-3 bg-red-600 hover:bg-red-700 text-[10px] text-white"
              >
                {loading ? 'Menutup...' : 'Ya, Tutup'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
