import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductTable from '@/components/pos/ProductTable';
import type { Product } from '@/components/pos/ProductTable';
import CartPanel from '@/components/pos/CartPanel';
import PaymentModal from '@/components/pos/PaymentModal';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import HoldBillModal from '@/components/pos/HoldBillModal';
import VoidRefundModal from '@/components/pos/VoidRefundModal';
import CashOutModal from '@/components/pos/CashOutModal';
import CustomerSearch from '@/components/customer/CustomerSearch';
import useBarcode from '@/hooks/useBarcode';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import usePrinter, { type ReceiptData } from '@/hooks/usePrinter';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useShiftStore } from '@/stores/shiftStore';
import LowStockWidget from '@/components/product/LowStockWidget';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Storefront, Warning, ArrowCounterClockwise,
  X, Users, Clock, CurrencyDollar,
} from 'phosphor-react';
import type { Transaction } from '@/lib/api';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function POSTerminalPage() {
  // ── Modals state ────────────────────────────────────────────────────────────
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showVoidRefund, setShowVoidRefund] = useState(false);
  const [showHoldBills, setShowHoldBills] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [holdConfirmOpen, setHoldConfirmOpen] = useState(false);
  const [shiftRequiredOpen, setShiftRequiredOpen] = useState(false);
  const [holdNotes, setHoldNotes] = useState('');
  const [holdCustomerId, setHoldCustomerId] = useState<string | null>(null);
  const [holdCustomerName, setHoldCustomerName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [_paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [paymentCustomerName, setPaymentCustomerName] = useState<string | null>(null);
  const paymentCustomerRef = useRef<{ id: string; name: string } | null>(null);
  const [customerReceiptInfo, setCustomerReceiptInfo] = useState<{ name: string; points: number; earned: number } | null>(null);

  const navigate = useNavigate();

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { print, testPrint, openDrawer, lastError } = usePrinter();
  const settings = useSettingsStore();
  const { user } = useAuthStore();
  const cartStore = useCartStore();
  const customerStore = useCustomerStore();
  const { currentShift, loading: shiftLoading, checkCurrentShift } = useShiftStore();
  const { toast } = useToast();

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, variant: 'success' | 'error' | 'info' = 'info') => {
    const variantMap: Record<string, 'default' | 'success' | 'destructive' | 'info'> = {
      success: 'success',
      error: 'destructive',
      info: 'info',
      default: 'default',
    };
    toast({ title: message, variant: variantMap[variant] ?? 'default' });
  }, [toast]);

  // ── Customer selection ────────────────────────────────────────────────────────
  const handleCustomerSelect = useCallback((customer: { id: string; name: string; phone?: string | null; tier?: string; points?: number }) => {
    setPaymentCustomerId(customer.id);
    setPaymentCustomerName(customer.name);
    paymentCustomerRef.current = { id: customer.id, name: customer.name };
    setCustomerReceiptInfo(null); // reset data receipt sebelumnya
    showToast(`Pelanggan: ${customer.name}`, 'info');
  }, [showToast]);

  const handleCreateCustomer = useCallback(async (name: string) => {
    const result = await customerStore.createCustomer({ name });
    if (result && 'error' in result) {
      showToast(result.error, 'error');
      return;
    }
    if (result) {
      setPaymentCustomerId(result.id);
      setPaymentCustomerName(result.name);
      paymentCustomerRef.current = { id: result.id, name: result.name };
      showToast(`Pelanggan dibuat: ${result.name}`, 'success');
    }
  }, [customerStore, showToast]);

  const handleClearCustomer = useCallback(() => {
    setPaymentCustomerId(null);
    setPaymentCustomerName(null);
    paymentCustomerRef.current = null;
    cartStore.setCustomer(null, 0);
  }, [cartStore]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useKeyboardShortcuts();

  // ── Barcode scanner ─────────────────────────────────────────────────────────
  useBarcode({
    onScan: (barcode: string) => {
      setSearchQuery(barcode);
      showToast(`Barcode: ${barcode}`, 'info');
    },
  });

  // ── Fetch current shift on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (user?.id) {
      checkCurrentShift(user.id);
    }
  }, [user?.id, checkCurrentShift]);

  // ── Open payment modal on F4 ────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (cartStore.items.length === 0) {
        showToast('Keranjang kosong — tambah produk terlebih dahulu', 'error');
        return;
      }
      setPaymentOpen(true);
    };
    window.addEventListener('pos:open-payment', handler);
    return () => window.removeEventListener('pos:open-payment', handler);
  }, [cartStore.items.length, showToast]);

  // ── Hold bills modal on F6 ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setShowHoldBills(true);
    window.addEventListener('pos:open-held-bills', handler);
    return () => window.removeEventListener('pos:open-held-bills', handler);
  }, []);

  // ── Reprint last receipt ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = async () => {
      if (lastTransaction) {
        await printReceiptForTransaction(lastTransaction);
        showToast('Struk dicetak ulang', 'success');
      } else {
        await testPrint();
        showToast('Test print selesai', 'info');
      }
    };
    window.addEventListener('pos:reprint-last', handler);
    return () => window.removeEventListener('pos:reprint-last', handler);
  }, [lastTransaction, print, testPrint, showToast]);

  // ── Build receipt data ──────────────────────────────────────────────────────
  const buildReceiptData = useCallback((tx: Transaction, custInfo?: { name: string; points: number; earned: number } | null): ReceiptData => {
    const ci = custInfo ?? customerReceiptInfo;
    return {
      storeName: settings.storeName || 'Toko Saya',
      storeAddress: settings.storeAddress || '',
      storePhone: settings.storePhone || '',
      receiptHeader: settings.receiptHeader || '',
      receiptFooter: settings.receiptFooter || '',
      receiptShowLogo: settings.receiptShowLogo || false,
      receiptShowTaxBreakdown: settings.receiptShowTaxBreakdown || false,
      receiptShowQr: settings.receiptShowQr || false,
      invoiceNumber: tx.invoiceNumber,
      createdAt: new Date(tx.createdAt).getTime(),
      cashierName: tx.userName || user?.name || 'Kasir',
      paymentMethod: tx.paymentMethod,
      items: tx.items?.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.total,
      })) || [],
      subtotal: tx.subtotal,
      discount: tx.discount,
      tax: tx.tax,
      total: tx.total,
      amountPaid: tx.amountPaid,
      change: tx.change,
      customerName: ci?.name ?? tx.customerName ?? undefined,
      customerPoints: ci?.points,
      pointsEarned: ci?.earned,
    };
  }, [settings, user, customerReceiptInfo]);

  // ── Print receipt for transaction ───────────────────────────────────────────
  const printReceiptForTransaction = useCallback(async (tx: Transaction) => {
    const data = buildReceiptData(tx);
    const result = await print(data);
    if (result.ok) {
      await openDrawer();
    }
    return result;
  }, [buildReceiptData, print, openDrawer]);

  // ── Handle payment confirmation ─────────────────────────────────────────────
  const handlePaymentConfirm = useCallback(async (method: 'cash' | 'debit' | 'qris' | 'transfer', amount: number) => {
    if (!user?.id) {
      showToast('Sesi habis. Silakan login kembali.', 'error');
      return;
    }

    // Set payment method & amount in cart store
    cartStore.setPayment(method, amount);

    // Call pay API — pass shiftId dari shift yg sedang aktif, dan customerId langsung (bypass state sync issue)
    const shiftId = currentShift?.id || undefined;
    if (!shiftId) {
      if (!shiftLoading) {
        setShiftRequiredOpen(true);
      }
      return;
    }
    const result = await cartStore.pay(user.id, shiftId, paymentCustomerRef.current?.id);
    if (result.ok && result.data) {
      const tx = result.data as Transaction;
      setLastTransaction(tx);
      setReceiptOpen(true);
      cartStore.clearCart();
      // ── Earn loyalty points & update total_spent + tier ──────────────────
      const custNow = paymentCustomerRef.current;
      if (custNow) {
        try {
          const recordRes = await window.api.customerRecordTransaction(custNow.id, tx.total);
          if (recordRes.ok && recordRes.data) {
            const { customer, earnedPoints } = recordRes.data;
            setCustomerReceiptInfo({
              name: custNow.name,
              points: customer.points || 0,
              earned: earnedPoints,
            });
            if (earnedPoints > 0) {
              showToast(`+${earnedPoints.toLocaleString('id-ID')} poin untuk ${custNow.name}`, 'success');
            }
          }
        } catch {
          // silent fail
        }
      }

      // ── Catat cash flow per item (kas masuk — penjualan) ──────────────────
      if (shiftId && tx.items) {
        for (const item of tx.items) {
          window.api.cashFlowRecordIn({
            shiftId,
            amount: item.total,
            reason: `Penjualan: ${item.productName} (${tx.invoiceNumber})`,
            userId: user.id,
          }).catch(() => { /* silent */ });
        }
      }

      showToast(`Transaksi ${tx.invoiceNumber} berhasil`, 'success');
      // Refresh low stock alert after sale
      setTimeout(() => (window as any).__refreshLowStockWidget?.(), 2000);
    } else {
      showToast(result.error?.message || 'Pembayaran gagal', 'error');
    }

    setPaymentOpen(false);
    setPaymentCustomerId(null);
    setPaymentCustomerName(null);
    paymentCustomerRef.current = null;
    // customerReceiptInfo tetap ada sampai preview ditutup atau customer baru dipilih
  }, [cartStore, user, currentShift, shiftLoading, printReceiptForTransaction, showToast, setShiftRequiredOpen]);

  // ── Handle void/refund ──────────────────────────────────────────────────────
  const handleVoid = useCallback((tx: Transaction, _reason: string) => {
    showToast(`Transaksi ${tx.invoiceNumber} dibatalkan`, 'success');
    // Jika transaksi yang di-void adalah lastTransaction (sedang ditampilkan), tutup modal
    if (lastTransaction?.id === tx.id) {
      setReceiptOpen(false);
      setLastTransaction(null);
    }
  }, [showToast, lastTransaction]);

  const handleRefund = useCallback((tx: Transaction, items: any[]) => {
    showToast(`Retur ${items.length} item dari ${tx.invoiceNumber} — item ditambahkan ke keranjang`, 'success');
  }, [showToast]);

  // ── Handle hold bill ───────────────────────────────────────────────────────
  const handleHoldBill = useCallback(() => {
    if (cartStore.items.length === 0) {
      showToast('Keranjang kosong — tidak ada yang bisa ditahan', 'error');
      return;
    }
    setHoldNotes('');
    setHoldCustomerId(cartStore.customerId || null);
    setHoldCustomerName(null);
    setHoldConfirmOpen(true);
  }, [cartStore.items.length, cartStore.customerId, showToast]);

  const handleHoldConfirm = useCallback(async () => {
    setHoldConfirmOpen(false);
    const res = await cartStore.holdBill(holdNotes || undefined, holdCustomerId);
    if (res.ok) {
      showToast('Bill ditahan', 'success');
    } else {
      showToast(res.error?.message || 'Gagal menahan bill', 'error');
    }
  }, [cartStore, showToast, holdNotes, holdCustomerId]);

  // ── Lanjutkan bill tertahan ke payment ────────────────────────────────────
  const handleContinueHeldToPayment = useCallback((_billId: string) => {
    // Bill sudah dimuat ke keranjang oleh HoldBillModal
    // Langsung buka payment modal
    setPaymentOpen(true);
  }, []);

  // ── Handle product add from table ──────────────────────────────────────────
  const handleAddProduct = useCallback((product: Product) => {
    cartStore.addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unit: product.unit || 'pcs',
      unitConversion: product.unitConversion || 1,
      price: Math.round(product.price * 100),
      discount: 0,
      total: Math.round(product.price * 100),
    });
  }, [cartStore]);

  // ── Cash out success ──────────────────────────────────────────────────────
  const handleCashOutSuccess = useCallback(() => {
    showToast('Pengeluaran kas berhasil dicatat', 'success');
  }, [showToast]);

  // ── Cart total for payment modal ──────────────────────────────────────────
  const cartTotal = cartStore.total;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top toolbar ───────────────────────────────────────────────────── */}
      <div className="h-9 shrink-0 flex items-center gap-1.5 px-2 border-b border-neutral-200 bg-white">
        <Storefront weight="fill" className="w-3.5 h-3.5 text-indigo-600" />
        <span className="text-[11px] font-semibold text-neutral-800 mr-1">Kasir</span>

        {/* Customer selection */}
        <CustomerSearch
          onSelect={handleCustomerSelect}
          onCreateNew={handleCreateCustomer}
        />
        {paymentCustomerName && (
          <span className="group inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full max-w-[130px]">
            <Users className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{paymentCustomerName}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleClearCustomer}
              className="ml-0.5 text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded-full -mr-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Hapus pelanggan"
            >
              <X className="w-2 h-2" />
            </Button>
          </span>
        )}

        <div className="flex-1" />

        {/* Quick actions */}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setShowVoidRefund(true)}
          title="Void / Refund (F8)"
          className="h-7 px-2 text-[10px]"
        >
          <Warning weight="fill" className="w-3 h-3 text-amber-500" />
          Void/Refund
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleHoldBill}
          title="Tahan Bill (F5)"
          className="h-7 px-2 text-[10px]"
        >
          <ArrowCounterClockwise weight="fill" className="w-3 h-3" />
          Tahan Bill
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setShowHoldBills(true)}
          title="Bill Ditahan (F6)"
          className="h-7 px-2 text-[10px]"
        >
          <Clock weight="fill" className="w-3 h-3 text-amber-500" />
          Bill Ditahan
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setCashOutOpen(true)}
          title="Kas Keluar"
          className="h-7 px-2 text-[10px]"
        >
          <CurrencyDollar weight="fill" className="w-3 h-3 text-red-500" />
          Kas Keluar
        </Button>
      </div>

      {/* ── Error bar ──────────────────────────────────────────────────────── */}
      {lastError && (
        <div className="shrink-0 h-7 flex items-center gap-2 px-2 bg-red-50 border-b border-red-200">
          <Warning weight="fill" className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[10px] text-red-600">{lastError}</span>
          <Button variant="link" size="xs" onClick={() => window.location.reload()} className="ml-auto text-[10px]">
            Coba lagi
          </Button>
        </div>
      )}

      {/* ── Main content: 2-column layout ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Product table (takes ~60%) */}
        <div className="flex-1 min-w-0 flex flex-col border-r border-neutral-200 bg-neutral-50">
          <LowStockWidget className="shrink-0 mx-1 mt-1" />
          <ProductTable
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddToCart={handleAddProduct}
          />
        </div>

        {/* Right: Cart panel (fixed width ~40%) */}
        <aside className="w-[360px] shrink-0 flex flex-col bg-white">
          <CartPanel onPay={() => setPaymentOpen(true)} />
        </aside>
      </div>

      {/* ── Payment Modal ──────────────────────────────────────────────────── */}
      {paymentOpen && (
        <PaymentModal
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          total={cartTotal}
        />
      )}

      {/* ── Transaction Detail Modal (shown after successful payment) ──────── */}
      <TransactionDetailModal
        open={receiptOpen && !!lastTransaction}
        onClose={() => setReceiptOpen(false)}
        transactionId={lastTransaction?.id ?? null}
        receiptCustInfo={customerReceiptInfo}
      />

      {/* ── Hold Bills Modal ────────────────────────────────────────────────── */}
      <HoldBillModal
        open={showHoldBills}
        onOpenChange={setShowHoldBills}
        onContinueToPayment={handleContinueHeldToPayment}
      />

      {/* ── Void / Refund Modal ─────────────────────────────────────────────── */}
      <VoidRefundModal
        open={showVoidRefund}
        onClose={() => setShowVoidRefund(false)}
        onVoid={handleVoid}
        onRefund={handleRefund}
      />

      {/* ── Hold Confirmation Dialog ─────────────────────────────────────────── */}
      <Dialog open={holdConfirmOpen} onOpenChange={(isOpen) => { if (!isOpen) setHoldConfirmOpen(false); }}>
        <DialogContent showCloseButton={false} className="w-[360px] p-0 gap-0 sm:max-w-[360px] shadow-2xl bg-white">
          <DialogHeader className="px-3 pt-3 pb-1.5">
            <DialogTitle className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-800">
              <ArrowCounterClockwise weight="fill" className="w-3.5 h-3.5 text-amber-500" />
              Tahan Bill
            </DialogTitle>
            <DialogDescription className="pt-1.5 text-[10px] text-neutral-600 leading-relaxed">
              Bill saat ini akan ditahan dan dapat dilanjutkan kembali nanti.
            </DialogDescription>
          </DialogHeader>

          <div className="px-3 pb-1.5 space-y-1.5">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2 text-[10px] text-amber-800 space-y-0.5">
              <p className="font-medium">Yang akan terjadi:</p>
              <ul className="list-disc list-inside text-amber-700 space-y-0.5">
                <li>Item di keranjang akan disimpan sebagai bill tertahan</li>
                <li>Keranjang akan dikosongkan</li>
                <li>Bill dapat dimuat kembali melalui menu <span className="font-medium">Bill Ditahan</span> (F6)</li>
              </ul>
            </div>

            {/* Notes */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Catatan (opsional)</label>
              <textarea
                value={holdNotes}
                onChange={(e) => setHoldNotes(e.target.value)}
                placeholder="Contoh: Bill untuk pesanan paket A"
                rows={2}
                className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none placeholder:text-neutral-400"
              />
            </div>

            {/* ── Customer ──────────────────────────────────────────────── */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Pelanggan (opsional)</label>
              {holdCustomerId && holdCustomerName ? (
                <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-2 text-[10px] text-indigo-700">
                  <Users className="w-3 h-3 shrink-0" />
                  <span className="flex-1 truncate">{holdCustomerName}</span>
                  <button
                    onClick={() => { setHoldCustomerId(null); setHoldCustomerName(null); }}
                    className="text-indigo-400 hover:text-red-500 shrink-0"
                    title="Hapus pelanggan"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <CustomerSearch
                  onSelect={(c) => { setHoldCustomerId(c.id); setHoldCustomerName(c.name); }}
                  onCreateNew={async (name) => {
                    const result = await customerStore.createCustomer({ name });
                    if (result && 'error' in result) return;
                    if (result) {
                      setHoldCustomerId(result.id);
                      setHoldCustomerName(result.name);
                    }
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 border border-neutral-200 px-2.5 py-2 text-[10px] text-neutral-600">
              <span className="font-medium text-neutral-700 shrink-0">Total:</span>
              <span className="font-bold text-neutral-800">Rp{(cartStore.total / 100).toLocaleString('id-ID')}</span>
              <span className="text-neutral-400">·</span>
              <span>{cartStore.items.length} item</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setHoldConfirmOpen(false)}
              className="h-7 px-3 text-[10px]"
            >
              Batal
            </Button>
            <Button
              size="xs"
              onClick={handleHoldConfirm}
              className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-[10px] text-white"
            >
              <ArrowCounterClockwise weight="fill" className="w-3 h-3" />
              Ya, Tahan Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Cash Out Modal ──────────────────────────────────────────────────── */}
      {currentShift && user?.id && (
        <CashOutModal
          open={cashOutOpen}
          onOpenChange={setCashOutOpen}
          shiftId={currentShift.id}
          userId={user.id}
          onSuccess={handleCashOutSuccess}
        />
      )}

      {/* ── Shift Required Dialog ─────────────────────────────────────────────── */}
      <Dialog open={shiftRequiredOpen} onOpenChange={(isOpen) => { if (!isOpen) setShiftRequiredOpen(false); }}>
        <DialogContent showCloseButton={false} className="w-[360px] p-0 gap-0 sm:max-w-[360px] shadow-2xl bg-white">
          <DialogHeader className="px-3 pt-3 pb-1.5">
            <DialogTitle className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-800">
              <Clock weight="fill" className="w-3.5 h-3.5 text-amber-500" />
              Shift Belum Dibuka
            </DialogTitle>
            <DialogDescription className="pt-1.5 text-[10px] text-neutral-600 leading-relaxed">
              Anda harus membuka shift terlebih dahulu sebelum dapat memproses transaksi.
            </DialogDescription>
          </DialogHeader>

          <div className="px-3 pb-1.5 space-y-1.5">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2 text-[10px] text-amber-800 space-y-0.5">
              <p className="font-medium">Kenapa perlu buka shift?</p>
              <ul className="list-disc list-inside text-amber-700 space-y-0.5">
                <li>Setiap transaksi perlu dicatat ke shift tertentu</li>
                <li>Rekap kas harian dihitung berdasarkan shift</li>
                <li>Saldo awal kas diperlukan untuk menghitung selisih</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShiftRequiredOpen(false)}
              className="h-7 px-3 text-[10px]"
            >
              Batal
            </Button>
            <Button
              size="xs"
              onClick={() => {
                setShiftRequiredOpen(false);
                navigate('/shifts');
              }}
              className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-[10px] text-white"
            >
              <Clock weight="fill" className="w-3 h-3" />
              Buka Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}