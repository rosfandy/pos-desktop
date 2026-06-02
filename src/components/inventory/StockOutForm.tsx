'use client';

import { useState, useCallback } from 'react';
import type { ProductRow, ProductWithUnits } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectPositioner, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Minus, Trash } from 'phosphor-react';
import ProductSearchInput from './ProductSearchInput';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StockOutLine {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  conversionFactor: number;
  quantity: number;
  reason: string;
  notes: string;
}

interface StockOutFormProps {
  onSubmit: (data: StockOutLine[]) => Promise<void>;
  onDone?: () => void;
}

const REASONS = [
  { value: 'sale', label: 'Penjualan' },
  { value: 'damage', label: 'Rusak' },
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'other', label: 'Lainnya' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function emptyLine(): StockOutLine {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    productId: '',
    productName: '',
    unit: 'pcs',
    conversionFactor: 1,
    quantity: 0,
    reason: '',
    notes: '',
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function StockOutForm({ onSubmit, onDone }: StockOutFormProps) {
  const [lines, setLines] = useState<StockOutLine[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [productCache, setProductCache] = useState<Record<string, ProductWithUnits>>({});

  // Fetch full product with units on demand
  const fetchProductWithUnits = useCallback(async (productId: string): Promise<ProductWithUnits | null> => {
    if (productCache[productId]) return productCache[productId];
    try {
      const res: any = await window.api.productGet(productId);
      if (res?.ok && res?.data) {
        setProductCache((prev) => ({ ...prev, [productId]: res.data }));
        return res.data;
      }
    } catch { /* ignore */ }
    return null;
  }, [productCache]);

  const updateLine = (lineId: string, patch: Partial<StockOutLine>) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const getProductWithUnits = useCallback((productId: string): ProductWithUnits | undefined => {
    return productCache[productId];
  }, [productCache]);

  const handleProductSelect = async (line: StockOutLine, product: ProductRow) => {
    const full = await fetchProductWithUnits(product.id);
    const p = full || product;
    updateLine(line.id, {
      productId: p.id,
      productName: p.name,
      unit: p.baseUnit || 'pcs',
      conversionFactor: 1,
    });
  };

  const handleUnitChange = (line: StockOutLine, unitName: string) => {
    const product = getProductWithUnits(line.productId);
    const unitDef = product?.units?.find((u) => u.unitName === unitName);
    updateLine(line.id, {
      unit: unitName,
      conversionFactor: unitDef?.conversionFactor || 1,
    });
  };

  const baseQty = (line: StockOutLine) => line.quantity * line.conversionFactor;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(lines);
      setLines([emptyLine()]);
      onDone?.();
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = lines.every(
    (l) => l.productId && l.quantity > 0 && l.reason
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Minus weight="fill" className="w-4 h-4 text-amber-600" />
        <h3 className="text-[12px] font-semibold text-neutral-800">Stok Keluar</h3>
      </div>

      {/* Lines */}
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const product = getProductWithUnits(line.productId);
          const currentStock = product?.stock ?? 0;
          const overStock = baseQty(line) > currentStock;

          return (
            <div
              key={line.id}
              className={cn(
                'border rounded-lg p-3 space-y-2.5 bg-card text-card-foreground',
                overStock ? 'border-red-300 bg-red-50/30' : 'border-neutral-200'
              )}
            >
              {/* Row header */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-neutral-400 w-5">{idx + 1}.</span>
                <div className="flex-1">
                  <ProductSearchInput
                    value={line.productId}
                    productName={line.productName}
                    onSelect={(p) => handleProductSelect(line, p)}
                    onClear={() => updateLine(line.id, { productId: '', productName: '', unit: 'pcs', conversionFactor: 1 })}
                    placeholder="Cari produk…"
                  />
                </div>
                {lines.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeLine(line.id)}
                    className="text-neutral-400 hover:text-red-500"
                    title="Hapus baris"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {line.productId && (
                <>
                  {/* Product info + stock check */}
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 ml-7">
                    <span>
                      Stok: <b className={cn(currentStock <= 0 ? 'text-red-600' : 'text-neutral-700')}>
                        {currentStock}
                      </b> {product?.baseUnit || 'pcs'}
                    </span>
                    {overStock && (
                      <span className="text-red-600 font-medium">
                        (Tersedia {currentStock}, diminta {baseQty(line)})
                      </span>
                    )}
                  </div>

                  {/* Unit + Qty */}
                  <div className="flex items-center gap-2 ml-7">
                    <Select
                      value={line.unit}
                      onValueChange={(val: string | null) => { if (!val) return; handleUnitChange(line, val); }}
                    >
                      <SelectTrigger className="w-24 h-8 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectPositioner>
                        <SelectContent>
                          {(product?.units && product.units.length > 0
                            ? product.units
                            : [{ unitName: product?.baseUnit || 'pcs', conversionFactor: 1, isDefault: true }]
                          ).map((u) => (
                            <SelectItem key={u.unitName} value={u.unitName}>
                              {u.unitName} {'isDefault' in u && u.isDefault ? '(def)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectPositioner>
                    </Select>

                    <div className="flex-1 relative">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.quantity || ''}
                        onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                        placeholder="Jumlah keluar"
                        className={cn('h-8 text-[11px]! pr-16', overStock ? 'border-red-300' : '')}
                      />
                      <span className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 text-[10px]',
                        overStock ? 'text-red-500' : 'text-neutral-400'
                      )}>
                        = {baseQty(line)} {product?.baseUnit || 'pcs'}
                      </span>
                    </div>
                  </div>

                  {/* Reason + Notes */}
                  <div className="flex items-center gap-2 ml-7">
                    <Select
                      value={line.reason}
                      onValueChange={(val: string | null) => { if (!val) return; updateLine(line.id, { reason: val }); }}
                    >
                      <SelectTrigger className="w-32 h-8 text-[11px]">
                        <SelectValue placeholder="Alasan…" />
                      </SelectTrigger>
                      <SelectPositioner>
                        <SelectContent>
                          {REASONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </SelectPositioner>
                    </Select>
                    <Input
                      value={line.notes}
                      onChange={(e) => updateLine(line.id, { notes: e.target.value })}
                      placeholder="Catatan (opsional)"
                      className="flex-1 h-8 text-[11px]"
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add line button */}
      <Button
        variant="ghost"
        size="xs"
        onClick={addLine}
        className="flex items-center gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <Minus className="w-3.5 h-3.5" />
        Tambah baris
      </Button>

      {/* Submit */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
        {onDone && (
          <Button variant="outline" size="sm" onClick={onDone} className="h-8 text-[11px]">
            Batal
          </Button>
        )}
        <Button
          size="sm"
          disabled={!isValid || submitting}
          onClick={handleSubmit}
          className="h-8 text-[11px] bg-amber-600 hover:bg-amber-700"
        >
          {submitting ? 'Menyimpan…' : 'Simpan Stok Keluar'}
        </Button>
      </div>
    </div>
  );
}
