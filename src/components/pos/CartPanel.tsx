import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash, Minus, Plus, CurrencyDollar, Percent, Receipt, ShoppingCart } from 'phosphor-react';
import { useEffect, useCallback } from 'react';

interface CartPanelProps {
  onPay?: () => void;
}

export default function CartPanel({ onPay }: CartPanelProps) {
  const {
    items, discount, tax, discountPercent, taxPercent, total,
    updateQuantity, updateItemDiscount, setDiscount, setTax,
    clearCart,
  } = useCartStore();

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);

  // ── Listen for focus-cart-item event (dispatched after Enter from ProductTable) ──
  const handleFocusCartItem = useCallback((e: Event) => {
    const { productId, unit } = (e as CustomEvent).detail || {};
    if (!productId) return;
    // Small delay to allow DOM to render
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-cart-item-product-id="${productId}"][data-cart-item-unit="${unit}"]`
      );
      el?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    window.addEventListener('pos:focus-cart-item', handleFocusCartItem);
    return () => window.removeEventListener('pos:focus-cart-item', handleFocusCartItem);
  }, [handleFocusCartItem]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-10 flex items-center justify-between px-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2">
          <ShoppingCart weight="fill" className="w-4 h-4 text-indigo-600" />
          <span className="text-[12px] font-semibold text-neutral-800">Keranjang</span>
          {items.length > 0 && (
            <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={clearCart}
            className="text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Kosongkan
          </Button>
        )}
      </div>

      {/* ── Cart Items ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-300 px-6">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-[13px] font-medium text-neutral-400">Keranjang kosong</p>
            <p className="text-[11px] text-neutral-400 mt-1 text-center">Klik produk di tabel atau scan barcode untuk menambahkan</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.unit}`}
                className="px-3 py-2.5 hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                data-cart-item-product-id={item.productId}
                data-cart-item-unit={item.unit}
                data-cart-item-qty={item.quantity}
                tabIndex={-1}
              >
                {/* Product name + price */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-neutral-800 truncate">{item.productName}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {item.quantity} {item.unit} × Rp{(item.price / 100).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="text-[12px] font-bold text-neutral-800 shrink-0 tabular-nums">
                    Rp{(item.total / 100).toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Qty controls + discount + delete */}
                <div className="flex items-center gap-2 mt-2">
                  {/* Qty buttons + input */}
                  <div className="flex items-center bg-neutral-100 rounded-md overflow-hidden">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => updateQuantity(item.productId, item.unit, Math.max(0, item.quantity - 1))}
                      className="text-neutral-600 hover:bg-neutral-200 shrink-0"
                    >
                      <Minus weight="bold" className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                          updateQuantity(item.productId, item.unit, val);
                        }
                      }}
                      className="w-14 h-7 text-center text-[12px] font-semibold tabular-nums border-0 rounded-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => updateQuantity(item.productId, item.unit, item.quantity + 1)}
                      className="text-neutral-600 hover:bg-neutral-200 shrink-0"
                    >
                      <Plus weight="bold" className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Item discount */}
                  <div className="relative flex-1 min-w-[60px]">
                    <Percent className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                    <Input
                      type="number"
                      value={item.discount / 100 || ''}
                      onChange={(e) => updateItemDiscount(item.productId, item.unit, Math.round((parseFloat(e.target.value) || 0) * 100))}
                      placeholder="0"
                      className="h-7 pl-7 text-[11px] py-0 pr-1"
                      min={0}
                    />
                  </div>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => updateQuantity(item.productId, item.unit, 0)}
                    className="text-neutral-400 hover:text-red-500 hover:bg-red-50"
                    title="Hapus item"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer: Discount + Tax + Total + Pay ───────────────────────────── */}
      {items.length > 0 && (
        <div className="shrink-0 border-t border-neutral-200 bg-white">
          {/* Cart-level discount */}
          <div className="px-3 pt-2.5 pb-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <Input
                type="number"
                value={discountPercent || ''}
                onChange={(e) => setDiscount(0, parseFloat(e.target.value) || 0)}
                placeholder="Diskon %"
                className="h-7 text-[11px] flex-1"
                min={0}
                max={100}
              />
              <Input
                type="number"
                value={(discount / 100) || ''}
                onChange={(e) => setDiscount(Math.round((parseFloat(e.target.value) || 0) * 100))}
                placeholder="Diskon Rp"
                className="h-7 text-[11px] w-28"
                min={0}
              />
            </div>

            {/* Tax */}
            <div className="flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <Input
                type="number"
                value={taxPercent || ''}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                placeholder="Pajak %"
                className="h-7 text-[11px] flex-1"
                min={0}
                max={100}
              />
              <span className="text-[10px] text-neutral-500 w-28 text-right tabular-nums">
                Rp{(tax / 100).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Totals */}
          <div className="px-3 pt-2 pb-1 border-t border-neutral-100 space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Subtotal</span>
              <span className="tabular-nums">Rp{(subtotal / 100).toLocaleString('id-ID')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[11px] text-red-500">
                <span>Diskon</span>
                <span className="tabular-nums">-Rp{(discount / 100).toLocaleString('id-ID')}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>Pajak ({taxPercent}%)</span>
                <span className="tabular-nums">Rp{(tax / 100).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-[15px] font-bold text-neutral-900 pt-1">
              <span>Total</span>
              <span className="tabular-nums">Rp{(total / 100).toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Pay button */}
          <div className="px-3 pb-3 pt-1.5">
            <Button
              onClick={onPay}
              className="w-full h-11 gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold shadow-sm"
            >
              <CurrencyDollar weight="fill" className="w-5 h-5" />
              Bayar
              <span className="text-[11px] font-semibold opacity-80 ml-1">
                (F4)
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}