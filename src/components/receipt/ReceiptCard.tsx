/**
 * ReceiptCard — komponen struk reusable.
 *
 * Dipakai di:
 *  - ReceiptPreview.tsx   (preview struk setelah bayar di POS terminal)
 *  - TransactionDetailModal.tsx (detail transaksi di riwayat / laporan)
 */

import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unit: string;
  price: number;   // cents
  total: number;   // cents
  discount?: number; // cents, optional
}

export interface ReceiptCardData {
  // toko
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  // struk config
  receiptHeader?: string;
  receiptFooter?: string;
  receiptShowQr?: boolean;
  receiptShowTaxBreakdown?: boolean;
  // transaksi
  invoiceNumber: string;
  createdAt: number;   // timestamp ms
  cashierName?: string;
  customerName?: string;
  customerPoints?: number;
  pointsEarned?: number;
  paymentMethod: string;
  status?: 'completed' | 'voided' | 'refunded' | 'held';
  // items + totals
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  discountPercent?: number;
  tax: number;
  taxPercent?: number;
  total: number;
  amountPaid?: number;
  change?: number;
}

interface ReceiptCardProps {
  data: ReceiptCardData;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return `Rp\u00a0${(cents / 100).toLocaleString('id-ID')}`;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tunai',
  debit: 'Debit',
  qris: 'QRIS',
  transfer: 'Transfer',
  credit: 'Kredit',
};

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  voided:    'bg-red-100 text-red-700',
  refunded:  'bg-amber-100 text-amber-700',
  held:      'bg-neutral-100 text-neutral-600',
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'LUNAS',
  voided:    'BATAL',
  refunded:  'REFUND',
  held:      'DITAHAN',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ReceiptCard({ data, className }: ReceiptCardProps) {
  const dateStr = new Date(data.createdAt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={cn(
      'bg-card text-card-foreground rounded border border-border shadow-sm font-mono text-[11px]',
      className,
    )}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-2 text-center border-b border-dashed border-neutral-300">
        <p className="text-[15px] font-bold uppercase tracking-widest leading-tight">
          {data.storeName || 'Toko Saya'}
        </p>
        {data.storeAddress && (
          <p className="text-[10px] text-neutral-500 mt-0.5">{data.storeAddress}</p>
        )}
        {data.storePhone && (
          <p className="text-[10px] text-neutral-500">Telp: {data.storePhone}</p>
        )}
        {data.receiptHeader && (
          <p className="text-[10px] italic text-neutral-400 mt-1">{data.receiptHeader}</p>
        )}

        {/* invoice meta */}
        <div className="mt-2 text-left space-y-0.5">
          <MetaRow label="No. Invoice" value={data.invoiceNumber || 'PREVIEW'} />
          <MetaRow label="Tanggal"     value={dateStr} />
          {data.cashierName && <MetaRow label="Kasir" value={data.cashierName} />}
          {data.customerName && (
            <MetaRow
              label="Pembeli"
              value={
                data.customerName +
                (data.customerPoints !== undefined
                  ? ` (${data.customerPoints.toLocaleString('id-ID')})`
                  : '') +
                (data.pointsEarned !== undefined && data.pointsEarned > 0
                  ? ` +${data.pointsEarned.toLocaleString('id-ID')}`
                  : '')
              }
            />
          )}
          <div className="flex gap-1 items-center">
            <span className="w-28 shrink-0 text-neutral-400">Pembayaran</span>
            <span className="text-neutral-400">:</span>
            <span className="font-semibold">
              {PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod.toUpperCase()}
            </span>
            {data.status && (
              <span className={cn(
                'ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold',
                STATUS_STYLE[data.status] ?? 'bg-neutral-100 text-neutral-600',
              )}>
                {STATUS_LABEL[data.status] ?? data.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══ BODY: items table ═══════════════════════════════════════════════ */}
      <div className="px-4 py-2 border-b border-dashed border-neutral-300">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-300">
              <th className="py-1 text-left   text-[10px] font-bold uppercase tracking-wide text-neutral-500">Produk</th>
              <th className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-neutral-500">Qty</th>
              <th className="py-1 text-right  text-[10px] font-bold uppercase tracking-wide text-neutral-500">Harga</th>
              <th className="py-1 text-right  text-[10px] font-bold uppercase tracking-wide text-neutral-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className="border-b border-dashed border-neutral-100 last:border-0">
                <td className="py-1 pr-2 font-medium text-neutral-800 leading-tight">
                  {item.productName}
                  {(item.discount ?? 0) > 0 && (
                    <span className="block text-[9px] text-red-400">
                      diskon -{fmt(item.discount!)}
                    </span>
                  )}
                </td>
                <td className="py-1 text-center tabular-nums text-neutral-500 whitespace-nowrap">
                  {item.quantity}&nbsp;{item.unit}
                </td>
                <td className="py-1 px-2 text-right tabular-nums text-neutral-500 whitespace-nowrap">
                  {fmt(item.price)}
                </td>
                <td className="py-1 text-right tabular-nums font-semibold text-neutral-800 whitespace-nowrap">
                  {fmt(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Ringkasan item ───────────────────────────────────────────── */}
        <div className="flex justify-between items-center pt-1 mt-1 border-t border-dashed border-neutral-200 text-[10px] text-neutral-500">
          <span>Total</span>
          <span className="font-semibold text-neutral-700 tabular-nums">
            {data.items.length} item · {data.items.reduce((s, i) => s + i.quantity, 0)} pcs
          </span>
        </div>
      </div>

      {/* ══ FOOTER: summary + thank-you ═════════════════════════════════════ */}
      <div className="px-4 pt-2 pb-4">
        {/* summary rows */}
        <div className="space-y-1">
          <SumRow label="Subtotal" value={fmt(data.subtotal)} />
          {data.discount > 0 && (
            <SumRow
              label={`Diskon${data.discountPercent ? ` (${data.discountPercent}%)` : ''}`}
              value={`- ${fmt(data.discount)}`}
              valueClass="text-red-500"
            />
          )}
          {data.tax > 0 && data.receiptShowTaxBreakdown && (
            <SumRow
              label={`Pajak${data.taxPercent ? ` (${data.taxPercent}%)` : ''}`}
              value={fmt(data.tax)}
            />
          )}
        </div>

        {/* TOTAL */}
        <div className="flex justify-between items-baseline mt-1.5 pt-1.5 border-t border-neutral-300">
          <span className="text-[13px] font-bold tracking-wide">TOTAL</span>
          <span className="text-[13px] font-bold tabular-nums text-indigo-600">{fmt(data.total)}</span>
        </div>

        {/* bayar / kembali */}
        {(data.amountPaid ?? 0) > 0 && (
          <div className="mt-1 space-y-0.5">
            <SumRow label="Bayar"   value={fmt(data.amountPaid!)} />
            <SumRow label="Kembali" value={fmt(data.change ?? 0)} valueClass="text-emerald-600 font-semibold" />
          </div>
        )}

        {/* thank-you */}
        <div className="mt-2 pt-2 border-t border-dashed border-neutral-300 text-center space-y-0.5">
          <p className="text-[12px] font-bold tracking-widest uppercase">
            {data.receiptFooter || 'Terima Kasih'}
          </p>
          {data.receiptShowQr && (
            <div className="mt-2 text-[9px] text-neutral-300">[QR Code]</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="w-28 shrink-0 text-neutral-400">{label}</span>
      <span className="text-neutral-400">:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function SumRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={cn('tabular-nums', valueClass ?? 'text-neutral-700')}>{value}</span>
    </div>
  );
}
