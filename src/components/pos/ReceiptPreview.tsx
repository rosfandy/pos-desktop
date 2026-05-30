import { useCartStore } from '@/stores/cartStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/button';
import { Printer } from 'phosphor-react';
import { ReceiptCard } from '@/components/receipt/ReceiptCard';
import type { ReceiptCardData } from '@/components/receipt/ReceiptCard';
import { cn } from '@/lib/utils';

interface ReceiptPreviewProps {
  transaction?: {
    invoiceNumber: string;
    createdAt: number;
    cashierName?: string;
    customerName?: string;
    customerPoints?: number;
    pointsEarned?: number;
    items: Array<{
      productName: string;
      quantity: number;
      unit: string;
      price?: number;
      total: number;
      discount?: number;
    }>;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    amountPaid: number;
    change: number;
    paymentMethod: string;
    status?: 'completed' | 'voided' | 'refunded' | 'held';
  } | null;
  className?: string;
  onPrint?: () => void;
  onSkip?: () => void;
  printing?: boolean;
}

export default function ReceiptPreview({ transaction, className, onPrint, onSkip, printing }: ReceiptPreviewProps) {
  const settings = useSettingsStore();
  const cart = useCartStore();

  // Build ReceiptCardData — transaction takes priority over cart
  const receiptData: ReceiptCardData = transaction
    ? {
        storeName: settings.storeName || 'Toko Saya',
        storeAddress: settings.storeAddress,
        storePhone: settings.storePhone,
        receiptHeader: settings.receiptHeader,
        receiptFooter: settings.receiptFooter,
        receiptShowQr: settings.receiptShowQr,
        receiptShowTaxBreakdown: settings.receiptShowTaxBreakdown,
        invoiceNumber: transaction.invoiceNumber,
        createdAt: transaction.createdAt,
        cashierName: transaction.cashierName,
        customerName: transaction.customerName,
        customerPoints: transaction.customerPoints,
        pointsEarned: transaction.pointsEarned,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        items: transaction.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          price: i.price ?? 0,
          total: i.total,
          discount: i.discount,
        })),
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        tax: transaction.tax,
        total: transaction.total,
        amountPaid: transaction.amountPaid,
        change: transaction.change,
      }
    : {
        storeName: settings.storeName || 'Toko Saya',
        storeAddress: settings.storeAddress,
        storePhone: settings.storePhone,
        receiptHeader: settings.receiptHeader,
        receiptFooter: settings.receiptFooter,
        receiptShowQr: settings.receiptShowQr,
        receiptShowTaxBreakdown: settings.receiptShowTaxBreakdown,
        invoiceNumber: '',
        createdAt: Date.now(),
        paymentMethod: cart.paymentMethod || 'cash',
        items: cart.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          price: i.price,
          total: i.total,
          discount: i.discount,
        })),
        subtotal: cart.subtotal,
        discount: cart.discount,
        tax: cart.tax,
        total: cart.total,
        amountPaid: cart.amountPaid,
        change: cart.change,
      };

  return (
    <div className={cn('flex flex-col bg-white', className)}>
      {/* receipt area — full height minus bottom bar */}
      <div className="flex-1 overflow-y-auto bg-neutral-100 p-3">
        <ReceiptCard data={receiptData} />
      </div>

      {/* bottom action bar */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t border-neutral-200 bg-white">
        {/* Skip button */}
        {onSkip && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSkip}
            disabled={printing}
            className="h-9 px-4 text-[11px] font-semibold text-neutral-600"
          >
            Lewati
          </Button>
        )}

        <div className="flex-1" />

        {/* Print button */}
        {onPrint && (
          <Button
            size="sm"
            onClick={onPrint}
            disabled={printing}
            className="flex items-center gap-1.5 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold disabled:opacity-60"
          >
            {printing ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mencetak...
              </>
            ) : (
              <>
                <Printer weight="fill" className="w-3.5 h-3.5" />
                Cetak Struk
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
