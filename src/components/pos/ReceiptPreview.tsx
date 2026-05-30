import { useCartStore } from '@/stores/cartStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/button';
import { Receipt, Printer } from 'phosphor-react';
import { ReceiptCard } from '@/components/receipt/ReceiptCard';
import type { ReceiptCardData } from '@/components/receipt/ReceiptCard';

interface ReceiptPreviewProps {
  transaction?: {
    invoiceNumber: string;
    createdAt: number;
    cashierName?: string;
    customerName?: string;
    customerTier?: string;
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
}

export default function ReceiptPreview({ transaction, className, onPrint }: ReceiptPreviewProps) {
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
        customerTier: transaction.customerTier,
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
    <div className={`flex flex-col ${className ?? ''}`}>
      {/* toolbar */}
      <div className="shrink-0 h-9 flex items-center justify-between px-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2">
          <Receipt weight="fill" className="w-4 h-4 text-indigo-600" />
          <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">Preview Struk</span>
        </div>
        {onPrint && (
          <Button
            size="sm"
            onClick={onPrint}
            className="flex items-center gap-1.5 h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold"
          >
            <Printer weight="fill" className="w-3.5 h-3.5" />
            Print
          </Button>
        )}
      </div>

      {/* receipt */}
      <div className="flex-1 overflow-y-auto p-3 bg-neutral-100">
        <ReceiptCard data={receiptData} />
      </div>
    </div>
  );
}
