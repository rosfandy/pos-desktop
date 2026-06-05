import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCartStore } from '@/stores/cartStore';
import { Trash, Clock, CurrencyDollar, User } from 'phosphor-react';
import {
  PosButton,
  PosEmptyState,
  PosEmptyTitle,
} from '@/components/ui/pos-ui';

interface HeldBill {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  total: number;
  itemCount: number;
  createdAt: number;
  notes?: string | null;
  customerId?: string | null;
  customerName?: string | null;
}

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onContinueToPayment?: (billId: string) => void;
}

const formatRupiah = (cents: number) =>
  `Rp${(cents / 100).toLocaleString('id-ID')}`;

const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function HoldBillModal({ open: openProp, onOpenChange, onContinueToPayment }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [bills, setBills] = useState<HeldBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<HeldBill | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { deleteHeldBill, bulkDeleteHeldBills } = useCartStore();

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

  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    }
  }, [open]);

  useEffect(() => {
    if (openProp !== undefined) return;
    const handler = () => { setInternalOpen(true); loadBills(); };
    window.addEventListener('pos:open-held-bills', handler);
    return () => window.removeEventListener('pos:open-held-bills', handler);
  }, [openProp]);

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
          customerId: tx.customerId || null,
          customerName: tx.customerName || null,
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
        if (tx.customerId) {
          useCartStore.getState().setCustomer(tx.customerId, 0);
        } else {
          useCartStore.setState({ customerId: null, loyaltyDiscountPercent: 0 });
        }
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
      onContinueToPayment?.(bill.id);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await deleteHeldBill(deleteConfirm.id);
    setBills(bills.filter((b) => b.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await bulkDeleteHeldBills(Array.from(selectedIds));
      setBills(bills.filter((b) => !selectedIds.has(b.id)));
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="w-[480px] max-h-[80vh] overflow-hidden flex flex-col p-0 gap-0 sm:max-w-[480px]  bg-card text-card-foreground">
        {/* Toolbar */}
        <div className="pos-toolbar h-9 shrink-0 px-3 border-b border-neutral-300">
          <Checkbox
            checked={selectAll}
            onCheckedChange={toggleSelectAll}
            className="size-4 border-2 border-neutral-700 bg-white data-[state=checked]:bg-indigo-700 data-[state=checked]:border-indigo-700"
            title="Pilih semua"
          />
          <Clock weight="fill" className="w-3.5 h-3.5 text-amber-500" />
          <span className="pos-toolbar-title">Bill Ditahan</span>
          <span className="text-[10px] text-neutral-500 tabular-nums">({bills.length})</span>
          <div className="flex-1" />
          <PosButton variant="ghost" onClick={handleClose} className="h-7 w-7 px-0 text-[10px]" title="Tutup">
            ✕
          </PosButton>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-neutral-400">
              <span className="text-[10px]">Memuat…</span>
            </div>
          ) : bills.length === 0 ? (
            <PosEmptyState className="h-40">
              <Clock className="w-8 h-8 opacity-20" />
              <PosEmptyTitle>Tidak ada bill yang ditahan</PosEmptyTitle>
            </PosEmptyState>
          ) : (
            <div className="divide-y divide-neutral-100">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-indigo-50/50 transition-colors group"
                >
                  <Checkbox
                    checked={selectedIds.has(bill.id)}
                    onCheckedChange={() => toggleSelect(bill.id)}
                    className="size-4 border-2 border-neutral-700 bg-white data-[state=checked]:bg-indigo-700 data-[state=checked]:border-indigo-700 shrink-0"
                  />
                  <div
                    onClick={() => handleLoadAndPay(bill)}
                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Clock weight="fill" className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono font-semibold text-neutral-800 tabular-nums">{bill.invoiceNumber}</p>
                      <p className="text-[10px] text-neutral-500 tabular-nums">
                        {bill.itemCount} item · {formatRupiah(bill.total)} · {formatDate(bill.createdAt)}
                      </p>
                      {bill.customerName && (
                        <p className="text-[10px] text-indigo-600 truncate max-w-[200px] flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {bill.customerName}
                        </p>
                      )}
                      {bill.notes && (
                        <p className="text-[10px] text-amber-600 truncate max-w-[200px]">{bill.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleLoad(bill); }}
                      className="h-6 px-1.5 text-[10px] text-indigo-600 hover:bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Muat ke keranjang (tanpa bayar)"
                    >
                      Muat
                    </Button>
                    <span
                      onClick={() => handleLoadAndPay(bill)}
                      className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      Lanjutkan
                      <CurrencyDollar className="w-3 h-3" />
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(bill); }}
                      className="text-neutral-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus bill"
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pos-form-row h-10 shrink-0 justify-end px-3 border-t border-neutral-300">
          {selectedIds.size > 0 && (
            <PosButton
              variant="danger"
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={deleting}
              className="h-7 px-2.5 text-[10px]"
            >
              <Trash className="w-3 h-3" />
              Hapus {selectedIds.size} Terpilih
            </PosButton>
          )}
          <PosButton variant="secondary" onClick={handleClose} className="h-7 px-3 text-[10px]">
            Tutup
          </PosButton>
        </div>
      </DialogContent>

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(isOpen) => { if (!isOpen) setDeleteConfirm(null); }}>
        <DialogContent showCloseButton={false} className="w-[340px] p-0 gap-0 sm:max-w-[340px]  bg-card text-card-foreground">
          <div className="px-3 pt-3 pb-2">
            <p className="pos-form-section text-[11px] font-semibold text-neutral-800 mb-1">Hapus Bill</p>
            <p className="pos-hint text-neutral-600">
              Yakin ingin menghapus bill <span className="font-medium text-neutral-700 tabular-nums">{deleteConfirm?.invoiceNumber}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="pos-form-row h-9 justify-end px-3 border-t border-neutral-200">
            <PosButton variant="secondary" onClick={() => setDeleteConfirm(null)} className="h-7 px-3 text-[10px]">Batal</PosButton>
            <PosButton variant="danger" onClick={handleDeleteConfirm} className="h-7 px-3 text-[10px]">
              <Trash className="w-3 h-3" />
              Hapus
            </PosButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Bulk delete confirmation ────────────────────────────────────── */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={(isOpen) => { if (!isOpen) setBulkDeleteConfirm(false); }}>
        <DialogContent showCloseButton={false} className="w-[340px] p-0 gap-0 sm:max-w-[340px]  bg-card text-card-foreground">
          <div className="px-3 pt-3 pb-2">
            <p className="pos-form-section text-[11px] font-semibold text-neutral-800 mb-1">Hapus {selectedIds.size} Bill</p>
            <p className="pos-hint text-neutral-600">
              Yakin ingin menghapus {selectedIds.size} bill yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="pos-form-row h-9 justify-end px-3 border-t border-neutral-200">
            <PosButton variant="secondary" onClick={() => setBulkDeleteConfirm(false)} className="h-7 px-3 text-[10px]">Batal</PosButton>
            <PosButton variant="danger" onClick={handleBulkDelete} disabled={deleting} className="h-7 px-3 text-[10px]">
              <Trash className="w-3 h-3" />
              {deleting ? 'Menghapus…' : `Hapus ${selectedIds.size} Bill`}
            </PosButton>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
