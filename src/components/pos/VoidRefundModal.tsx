import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { LockKey, Warning, CheckCircle, X, Clock } from 'phosphor-react';
import type { Transaction, TransactionItem } from '@/lib/api';

interface VoidRefundModalProps {
  open: boolean;
  onClose: () => void;
  onVoid?: (tx: Transaction, reason: string) => void;
  onRefund?: (tx: Transaction, items: TransactionItem[]) => void;
}

export default function VoidRefundModal({ open, onClose, onVoid, onRefund }: VoidRefundModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [pin, setPin] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [refundItems, setRefundItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'void' | 'refund'>('refund');
  const addItem = useCartStore((s) => s.addItem);

  // Reset state every time modal opens
  useEffect(() => {
    if (open) {
      setSelectedTx(null);
      setPin('');
      setAuthorized(false);
      setRefundItems({});
      setTransactions([]);
      setMode('refund');
    }
  }, [open]);

  // Load transactions when modal opens
  useEffect(() => {
    if (!open) return;
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const res: any = await window.api.transactionList({ status: 'completed' });
        if (res.ok) {
          const data = (res.data || []) as Transaction[];
          setTransactions(data.slice(0, 50));
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    loadTransactions();
  }, [open]);

  // Handle PIN verification
  const handleVerifyPin = useCallback(async () => {
    if (!pin || pin.length < 4) return;
    setLoading(true);
    try {
      const res = await window.api.authVerifyPin(pin);
      if (res.ok && res.data?.ok) {
        setAuthorized(true);
      } else {
        setPin('');
        alert('PIN salah atau tidak memiliki izin (admin/manager)');
      }
    } catch {
      setPin('');
      alert('Gagal memverifikasi PIN');
    } finally {
      setLoading(false);
    }
  }, [pin]);

  // Handle refund item qty change
  const setRefundQty = useCallback((item: TransactionItem, qty: number) => {
    if (qty < 0 || qty > item.quantity) return;
    setRefundItems((prev) => ({
      ...prev,
      [item.productId + item.unit]: qty,
    }));
  }, []);

  // Submit void
  const handleVoid = useCallback(async () => {
    if (!selectedTx || !authorized) return;
    try {
      const res: any = await window.api.transactionVoid(selectedTx.id, 'Void oleh admin');
      if (res.ok) {
        onVoid?.(selectedTx, 'Void');
        onClose();
      } else {
        alert(res.error?.message || 'Gagal void transaksi');
      }
    } catch {
      alert('Gagal void transaksi');
    }
  }, [selectedTx, authorized, onVoid, onClose]);

  // Submit refund
  const handleRefund = useCallback(async () => {
    if (!selectedTx || !authorized) return;

    const items: TransactionItem[] = selectedTx.items
      .filter((i) => {
        const qty = refundItems[i.productId + i.unit] || 0;
        return qty > 0;
      })
      .map((i) => ({
        ...i,
        quantity: refundItems[i.productId + i.unit] || 0,
        total: (refundItems[i.productId + i.unit] || 0) * i.price - i.discount,
      }));

    if (items.length === 0) {
      alert('Pilih minimal 1 item untuk diretur');
      return;
    }

    try {
      const res: any = await window.api.transactionRefund(selectedTx.id, items);
      if (res.ok) {
        for (const item of items) {
          addItem({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            unitConversion: 1,
            price: item.price,
            discount: item.discount,
            total: item.total,
          });
        }
        onRefund?.(selectedTx, items);
        onClose();
      }
    } catch {
      alert('Gagal proses refund');
    }
  }, [selectedTx, authorized, refundItems, addItem, onRefund, onClose]);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      completed: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700' },
      held: { label: 'Ditahan', color: 'bg-amber-100 text-amber-700' },
      voided: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
      refunded: { label: 'Diretur', color: 'bg-purple-100 text-purple-700' },
    };
    const s = map[status] || { label: status, color: 'bg-neutral-100 text-neutral-700' };
    return <Badge className={`${s.color} text-[10px] h-5`}>{s.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }} modal>
      <DialogContent showCloseButton={false} className="w-[640px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 sm:max-w-[640px] shadow-2xl bg-white">
          {/* Header */}
          <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Warning weight="fill" className="w-4 h-4 text-amber-500" />
              <span className="text-[12px] font-semibold text-neutral-700">Void / Refund</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant={mode === 'refund' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMode('refund'); setAuthorized(false); setPin(''); }}
                className="h-7 px-2.5 text-[10px]"
              >
                Refund
              </Button>
              <Button
                variant={mode === 'void' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => { setMode('void'); setAuthorized(false); setPin(''); }}
                className="h-7 px-2.5 text-[10px]"
              >
                Void
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedTx ? (
              /* Transaction List */
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-neutral-400">
                    <span className="text-[11px]">Memuat…</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-neutral-300">
                    <Clock className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-[11px]">Tidak ada transaksi</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <Button
                      key={tx.id}
                      variant="ghost"
                      onClick={() => { setSelectedTx(tx); setAuthorized(false); setPin(''); }}
                      className="w-full p-3 rounded-lg border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50 justify-start text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-neutral-800">{tx.invoiceNumber}</span>
                        {statusBadge(tx.status)}
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        {new Date(tx.createdAt).toLocaleString('id-ID')} · {tx.paymentMethod.toUpperCase()}
                      </p>
                      <p className="text-[13px] font-bold text-indigo-600 mt-1">
                        Rp{(tx.total / 100).toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-neutral-400">{tx.items?.length || 0} item</p>
                    </Button>
                  ))
                )}
              </div>
            ) : !authorized ? (
              /* PIN Authorization */
              <div className="max-w-sm mx-auto py-8 space-y-4">
                <div className="text-center mb-6">
                  <p className="text-[12px] text-neutral-500 mb-1">Transaksi: {selectedTx.invoiceNumber}</p>
                  <p className="text-[16px] font-bold text-neutral-800">
                    Rp{(selectedTx.total / 100).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-amber-600 mt-2">
                    PIN admin/manager diperlukan untuk {mode === 'void' ? 'membatalkan' : 'mengembalikan'} transaksi
                  </p>
                </div>

                <div className="relative">
                  <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Masukkan PIN (6 digit)"
                    className="h-12 pl-10 text-[16px] text-center tracking-[0.5em] font-mono"
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
                  />
                </div>

                <Button onClick={handleVerifyPin} className="w-full h-10" disabled={pin.length < 4}>
                  Verifikasi PIN
                </Button>
              </div>
            ) : mode === 'refund' ? (
              /* Refund Items Selection */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-neutral-700">Pilih Item untuk Diretur</p>
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px] h-5">PIN Terverifikasi</Badge>
                </div>

                {selectedTx.items.map((item) => {
                  const refundQty = refundItems[item.productId + item.unit] || 0;
                  return (
                    <div key={item.productId + item.unit} className="p-3 rounded-lg border border-neutral-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[12px] font-medium text-neutral-800">{item.productName}</p>
                          <p className="text-[10px] text-neutral-500">
                            {item.quantity} {item.unit} × Rp{(item.price / 100).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <p className="text-[12px] font-bold text-neutral-800">
                          Rp{(item.total / 100).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500 w-12">Retur:</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRefundQty(item, refundQty - 1)}
                            className="w-7 h-7 p-0"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-[12px] font-semibold">{refundQty}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRefundQty(item, refundQty + 1)}
                            className="w-7 h-7 p-0"
                          >
                            +
                          </Button>
                        </div>
                        <span className="text-[10px] text-neutral-400">/ {item.quantity} {item.unit}</span>
                      </div>
                    </div>
                  );
                })}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setSelectedTx(null)} className="flex-1 h-9 text-[11px]">
                    Batal
                  </Button>
                  <Button
                    onClick={handleRefund}
                    className="flex-1 h-9 bg-amber-600 hover:bg-amber-700 text-[11px]"
                    disabled={Object.values(refundItems).filter((q) => q > 0).length === 0}
                  >
                    <CheckCircle weight="fill" className="w-3.5 h-3.5 mr-1.5" />
                    Proses Refund
                  </Button>
                </div>
              </div>
            ) : (
              /* Void Confirmation */
              <div className="max-w-sm mx-auto py-8 space-y-4 text-center">
                <Warning weight="fill" className="w-12 h-12 text-red-500 mx-auto" />
                <p className="text-[12px] text-neutral-600">
                  Yakin ingin membatalkan transaksi <span className="font-bold">{selectedTx.invoiceNumber}</span>?
                </p>
                <p className="text-[11px] text-red-600">Tindakan ini tidak dapat dibatalkan</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedTx(null)} className="flex-1 h-9 text-[11px]">
                    Batal
                  </Button>
                  <Button variant="destructive" onClick={handleVoid} className="flex-1 h-9 text-[11px]">
                    Ya, Batalkan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
  );
}
