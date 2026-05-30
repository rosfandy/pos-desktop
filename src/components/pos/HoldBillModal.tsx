import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCartStore } from '@/stores/cartStore';
import { Trash, Clock, CurrencyDollar } from 'phosphor-react';

interface HeldBill {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  total: number;
  itemCount: number;
  createdAt: number;
  notes?: string | null;
}

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onContinueToPayment?: (billId: string) => void;
}

export default function HoldBillModal({ open: openProp, onOpenChange, onContinueToPayment }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [bills, setBills] = useState<HeldBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<HeldBill | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { deleteHeldBill } = useCartStore();

  const selectAll = bills.length > 0 && selectedIds.size === bills.length;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bills.map((b) => b.id)));
    }
  }, [bills, selectAll]);

  // Pakai prop open jika disediakan, fallback ke internal state
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    }
  }, [open]);

  // Listen for F6 event — hanya jika parent tidak kontrol open
  useEffect(() => {
    if (openProp !== undefined) return;
    const handler = () => { setInternalOpen(true); loadBills(); };
    window.addEventListener('pos:open-held-bills', handler);
    return () => window.removeEventListener('pos:open-held-bills', handler);
  }, [openProp]);

  // Load bills setiap kali modal terbuka
  useEffect(() => {
    if (open) loadBills();
  }, [open]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res: any = await window.api.transactionListHeld();
      if (res.ok) {
        const data = res.data || [];
        setBills(data.map((tx: any) => ({
          id: tx.id,
          invoiceNumber: tx.invoiceNumber,
          subtotal: tx.subtotal,
          total: tx.total,
          itemCount: tx.items?.length || 0,
          createdAt: tx.createdAt,
          notes: tx.notes || null,
        })));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const loadBillToCart = async (bill: HeldBill) => {
    const res: any = await window.api.transactionUnhold(bill.id);
    if (res.ok) {
      const tx = res.data;
      if (tx?.items) {
        useCartStore.setState({ items: [] });
        for (const item of tx.items) {
          useCartStore.getState().addItem({
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
      }
      return true;
    }
    return false;
  };

  const handleLoad = async (bill: HeldBill) => {
    const ok = await loadBillToCart(bill);
    if (ok) setOpen(false);
  };

  const handleLoadAndPay = async (bill: HeldBill) => {
    const ok = await loadBillToCart(bill);
    if (ok) {
      setOpen(false);
      if (onContinueToPayment) {
        onContinueToPayment(bill.id);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await deleteHeldBill(deleteConfirm.id);
    setBills(bills.filter((b) => b.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteHeldBill(id);
    }
    setBills(bills.filter((b) => !selectedIds.has(b.id)));
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
  };

  const handleClose = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="w-[480px] max-h-[80vh] overflow-hidden flex flex-col p-0 gap-0 sm:max-w-[480px] shadow-2xl bg-white">
          {/* Header */}
          <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectAll}
                onCheckedChange={toggleSelectAll}
                className="size-5 border-2 border-neutral-700 bg-white data-[state=checked]:bg-indigo-700 data-[state=checked]:border-indigo-700"
                title="Pilih semua"
              />
              <Clock weight="fill" className="w-4 h-4 text-amber-500" />
              <span className="text-[12px] font-semibold text-neutral-700">Bill Ditahan</span>
              <span className="text-[11px] text-neutral-400">({bills.length})</span>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={handleClose} className="text-neutral-400 hover:text-neutral-600">
              <span className="sr-only">Tutup</span>
              ✕
            </Button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-neutral-400">
                <span className="text-[11px]">Memuat…</span>
              </div>
            ) : bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-300">
                <Clock className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-[11px]">Tidak ada bill yang ditahan</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-indigo-50 transition-colors group"
                  >
                    {/* Checkbox — klik hanya untuk seleksi */}
                    <Checkbox
                      checked={selectedIds.has(bill.id)}
                      onCheckedChange={() => toggleSelect(bill.id)}
                      className="size-5 border-2 border-neutral-700 bg-white data-[state=checked]:bg-indigo-700 data-[state=checked]:border-indigo-700 shrink-0"
                    />
                    {/* Ikon + info — klik untuk muat & lanjut bayar */}
                    <div
                      onClick={() => handleLoadAndPay(bill)}
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock weight="fill" className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-neutral-800">{bill.invoiceNumber}</p>
                        <p className="text-[10px] text-neutral-500">
                          {bill.itemCount} item · Rp{(bill.total / 100).toLocaleString('id-ID')}
                        </p>
                        {bill.notes && (
                          <p className="text-[10px] text-amber-600 truncate max-w-[200px] leading-tight mt-0.5">
                            {bill.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Aksi — klik hanya untuk aksi spesifik */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Hanya Muat (tanpa lanjut bayar) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleLoad(bill); }}
                        className="h-7 px-2.5 text-[10px] text-indigo-600 hover:bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Muat ke keranjang (tanpa bayar)"
                      >
                        Muat
                      </Button>
                      {/* Lanjutkan — primary action, selalu muncul */}
                      <span
                        onClick={() => handleLoadAndPay(bill)}
                        className="text-[10px] font-medium text-emerald-600 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        Lanjutkan
                        <CurrencyDollar className="w-3 h-3" />
                      </span>
                      {/* Hapus */}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(bill); }}
                        className="text-neutral-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus bill"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 h-10 flex items-center justify-end gap-2 px-4 border-t border-neutral-200 bg-neutral-50">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={() => setBulkDeleteConfirm(true)}
                className="h-7 px-3 text-[10px] bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash className="w-3 h-3 mr-1" />
                Hapus {selectedIds.size} Terpilih
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleClose} className="h-7 px-3 text-[10px]">
              Tutup
            </Button>
          </div>
          </DialogContent>

        {/* ── Delete confirmation ──────────────────────────────────────────── */}
        <Dialog open={deleteConfirm !== null} onOpenChange={(isOpen) => { if (!isOpen) setDeleteConfirm(null); }}>
          <DialogContent showCloseButton={false} className="w-[340px] p-0 gap-0 sm:max-w-[340px] shadow-2xl bg-white">
            <div className="px-4 pt-4 pb-3">
              <p className="text-[12px] font-semibold text-neutral-800 mb-1">Hapus Bill</p>
              <p className="text-[11px] text-neutral-600">
                Yakin ingin menghapus bill <span className="font-medium text-neutral-700">{deleteConfirm?.invoiceNumber}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} className="h-8 px-4 text-[11px]">
                Batal
              </Button>
              <Button size="sm" onClick={handleDeleteConfirm} className="h-8 px-4 bg-red-600 hover:bg-red-700 text-[11px] text-white">
                <Trash className="w-3.5 h-3.5 mr-1" />
                Hapus
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* ── Bulk delete confirmation ────────────────────────────────────── */}
        <Dialog open={bulkDeleteConfirm} onOpenChange={(isOpen) => { if (!isOpen) setBulkDeleteConfirm(false); }}>
          <DialogContent showCloseButton={false} className="w-[340px] p-0 gap-0 sm:max-w-[340px] shadow-2xl bg-white">
            <div className="px-4 pt-4 pb-3">
              <p className="text-[12px] font-semibold text-neutral-800 mb-1">Hapus {selectedIds.size} Bill</p>
              <p className="text-[11px] text-neutral-600">
                Yakin ingin menghapus {selectedIds.size} bill yang dipilih? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => setBulkDeleteConfirm(false)} className="h-8 px-4 text-[11px]">
                Batal
              </Button>
              <Button size="sm" onClick={handleBulkDelete} className="h-8 px-4 bg-red-600 hover:bg-red-700 text-[11px] text-white">
                <Trash className="w-3.5 h-3.5 mr-1" />
                Hapus {selectedIds.size} Bill
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Dialog>
  );
}
