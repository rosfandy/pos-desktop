'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner, Printer, X, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/api';
import type { ReceiptData } from '@/hooks/usePrinter';
import { useSettingsStore } from '@/stores/settingsStore';

interface TransactionDetailModalProps {
  open: boolean;
  onClose: () => void;
  transactionId: string | null;
}

function formatRupiah(cents: number) {
  return `Rp ${(cents / 100).toLocaleString('id-ID')}`;
}

function formatDateTime(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TransactionDetailModal({ open, onClose, transactionId }: TransactionDetailModalProps) {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const settings = useSettingsStore();
  const { storeName, storeAddress, storePhone, receiptHeader, receiptFooter, receiptShowLogo, receiptShowTaxBreakdown, receiptShowQr, isLoading: settingsLoading, loadSettings } = settings;

  // Load settings once when modal opens (if not already loaded)
  useEffect(() => {
    if (open && !settingsLoading && !storeName) {
      loadSettings();
    }
  }, [open, settingsLoading, storeName, loadSettings]);

  useEffect(() => {
    if (!open || !transactionId) return;
    setLoading(true);
    setTx(null);
    setPrintStatus('idle');
    window.api.transactionGet(transactionId)
      .then((res: any) => {
        if (res?.ok && res.data) {
          setTx(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, transactionId]);

  const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Tunai',
    debit: 'Debit',
    qris: 'QRIS',
    transfer: 'Transfer',
    credit: 'Kredit',
  };

  const handlePrint = async () => {
    if (!tx) return;
    setPrintLoading(true);
    setPrintStatus('idle');

    try {
      // Fetch customer info (points, tier) if available
      let custInfo: { name: string; tier: string; points: number; earned: number } | null = null;
      if (tx.customerId) {
        const custRes = await window.api.customerGet(tx.customerId);
        if (custRes.ok && custRes.data) {
          const c = custRes.data;
          custInfo = {
            name: c.name,
            tier: c.tier || 'Bronze',
            points: c.points || 0,
            earned: 0, // tidak diketahui untuk cetak ulang
          };
        }
      }

      const receiptData: ReceiptData = {
        storeName: storeName || 'Toko Saya',
        storeAddress: storeAddress || '',
        storePhone: storePhone || '',
        receiptHeader: receiptHeader || '',
        receiptFooter: receiptFooter || '',
        receiptShowLogo: receiptShowLogo || false,
        receiptShowTaxBreakdown: receiptShowTaxBreakdown || false,
        receiptShowQr: receiptShowQr || false,
        invoiceNumber: tx.invoiceNumber,
        createdAt: new Date(tx.createdAt).getTime(),
        cashierName: tx.userName || 'Kasir',
        paymentMethod: tx.paymentMethod,
        items: (tx.items || []).map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.total,
        })),
        subtotal: tx.subtotal,
        discount: tx.discount,
        tax: tx.tax,
        total: tx.total,
        amountPaid: tx.amountPaid,
        change: tx.change,
        customerName: custInfo?.name ?? tx.customerName ?? undefined,
        customerTier: custInfo?.tier,
        customerPoints: custInfo?.points,
        pointsEarned: custInfo?.earned,
      };

      const result = await window.api.printerPrint(receiptData);
      if (result.ok) {
        setPrintStatus('success');
      } else {
        setPrintStatus('error');
        console.error('[print]', result.error?.message);
      }
    } catch (err: any) {
      setPrintStatus('error');
      console.error('[print]', err.message || 'Print gagal');
    } finally {
      setPrintLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-[12px] font-semibold text-neutral-800">
              Detail Transaksi
            </DialogTitle>
            {printStatus === 'success' && (
              <span className="text-[10px] text-emerald-600 font-medium">✓ Struk tercetak</span>
            )}
            {printStatus === 'error' && (
              <span className="text-[10px] text-red-500 font-medium">Print gagal — cek printer</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={handlePrint} disabled={!tx || printLoading} title="Cetak Struk">
              {printLoading ? (
                <Spinner className="w-3.5 h-3.5 animate-spin" />
              ) : printStatus === 'success' ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onClose} title="Tutup">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-neutral-100 p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="ml-2 text-[11px] text-neutral-500">Memuat…</span>
            </div>
          )}

          {!loading && !tx && (
            <div className="flex items-center justify-center py-12 text-[11px] text-neutral-400">
              Transaksi tidak ditemukan
            </div>
          )}

          {!loading && tx && (
            /* ── Receipt card ─────────────────────────────────────────────── */
            <div className="mx-auto max-w-sm bg-white shadow-sm rounded border border-neutral-200 font-mono text-[11px] text-neutral-800">

              {/* ── HEADER ── */}
              <div className="px-5 pt-5 pb-3 text-center border-b border-dashed border-neutral-300">
                <p className="text-[15px] font-bold uppercase tracking-widest leading-tight">
                  {storeName || 'Toko Saya'}
                </p>
                {storeAddress && (
                  <p className="text-[10px] text-neutral-500 mt-0.5">{storeAddress}</p>
                )}
                {storePhone && (
                  <p className="text-[10px] text-neutral-500">Telp: {storePhone}</p>
                )}
                {receiptHeader && (
                  <p className="text-[10px] italic text-neutral-400 mt-1">{receiptHeader}</p>
                )}

                {/* invoice meta */}
                <div className="mt-3 text-left space-y-0.5">
                  <div className="flex gap-1">
                    <span className="w-28 text-neutral-400">No. Invoice</span>
                    <span className="text-neutral-400">:</span>
                    <span className="font-semibold">{tx.invoiceNumber}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-28 text-neutral-400">Tanggal</span>
                    <span className="text-neutral-400">:</span>
                    <span className="font-semibold">{formatDateTime(tx.createdAt)}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-28 text-neutral-400">Kasir</span>
                    <span className="text-neutral-400">:</span>
                    <span className="font-semibold">{tx.userName || '-'}</span>
                  </div>
                  {tx.customerName && (
                    <div className="flex gap-1">
                      <span className="w-28 text-neutral-400">Pembeli</span>
                      <span className="text-neutral-400">:</span>
                      <span className="font-semibold">{tx.customerName}</span>
                    </div>
                  )}
                  <div className="flex gap-1 items-center">
                    <span className="w-28 text-neutral-400">Pembayaran</span>
                    <span className="text-neutral-400">:</span>
                    <span className="font-semibold">{PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod}</span>
                    <span className={cn(
                      'ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold',
                      tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      tx.status === 'voided'    ? 'bg-red-100 text-red-700' :
                      tx.status === 'refunded'  ? 'bg-amber-100 text-amber-700' :
                      'bg-neutral-100 text-neutral-600'
                    )}>
                      {tx.status === 'completed' ? 'LUNAS' :
                       tx.status === 'voided'    ? 'BATAL' :
                       tx.status === 'refunded'  ? 'REFUND' : 'DITAHAN'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── BODY: items table ── */}
              <div className="px-5 py-3 border-b border-dashed border-neutral-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-300">
                      <th className="py-1 text-left text-[10px] font-bold uppercase tracking-wide text-neutral-500">Produk</th>
                      <th className="py-1 text-right text-[10px] font-bold uppercase tracking-wide text-neutral-500">Qty</th>
                      <th className="py-1 text-right text-[10px] font-bold uppercase tracking-wide text-neutral-500">Harga</th>
                      <th className="py-1 text-right text-[10px] font-bold uppercase tracking-wide text-neutral-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tx.items || []).map((item, i) => (
                      <tr key={i} className="border-b border-dashed border-neutral-100 last:border-0">
                        <td className="py-1.5 pr-2 font-medium text-neutral-800 leading-tight">
                          {item.productName}
                          {item.discount > 0 && (
                            <span className="block text-[9px] text-red-400">-{formatRupiah(item.discount)}</span>
                          )}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-neutral-500 whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-neutral-500 whitespace-nowrap">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums font-semibold text-neutral-800 whitespace-nowrap">
                          {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── FOOTER: totals + thank you ── */}
              <div className="px-5 pt-3 pb-5">
                {/* summary rows */}
                <div className="space-y-1">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatRupiah(tx.subtotal)}</span>
                  </div>
                  {tx.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">
                        Diskon{tx.discountPercent > 0 ? ` (${tx.discountPercent}%)` : ''}
                      </span>
                      <span className="tabular-nums text-red-500 font-medium">- {formatRupiah(tx.discount)}</span>
                    </div>
                  )}
                  {tx.tax > 0 && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Pajak{tx.taxPercent > 0 ? ` (${tx.taxPercent}%)` : ''}</span>
                      <span className="tabular-nums">{formatRupiah(tx.tax)}</span>
                    </div>
                  )}
                </div>

                {/* TOTAL */}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-300">
                  <span className="text-[13px] font-bold tracking-wide">TOTAL</span>
                  <span className="text-[13px] font-bold tabular-nums text-indigo-600">{formatRupiah(tx.total)}</span>
                </div>

                {/* bayar / kembali */}
                {tx.amountPaid > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex justify-between text-neutral-500">
                      <span>Bayar</span>
                      <span className="tabular-nums font-medium text-neutral-700">{formatRupiah(tx.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Kembali</span>
                      <span className="tabular-nums font-semibold text-emerald-600">{formatRupiah(tx.change)}</span>
                    </div>
                  </div>
                )}

                {/* thank you */}
                <div className="mt-4 pt-3 border-t border-dashed border-neutral-300 text-center space-y-0.5">
                  <p className="text-[12px] font-bold tracking-widest uppercase">
                    {receiptFooter || 'Terima Kasih'}
                  </p>
                  <p className="text-[9px] text-neutral-400">
                    Barang yang sudah dibeli tidak dapat dikembalikan
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-200 bg-neutral-50 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[11px]">
            Tutup
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={!tx || printLoading} className="text-[11px] gap-1.5">
            {printLoading ? (
              <Spinner className="w-3.5 h-3.5 animate-spin" />
            ) : printStatus === 'success' ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <Printer className="w-3.5 h-3.5" />
            )}
            {printLoading ? 'Mencetak…' : printStatus === 'success' ? 'Tercetak' : printStatus === 'error' ? 'Cetak Ulang' : 'Cetak Struk'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
