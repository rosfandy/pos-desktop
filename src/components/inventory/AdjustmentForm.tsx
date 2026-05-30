'use client';

import { useState, useCallback } from 'react';
import type { ProductRow, ProductWithUnits } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectPositioner, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowClockwise, Package, Trash } from 'phosphor-react';
import ProductSearchInput from './ProductSearchInput';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdjustmentLine {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  conversionFactor: number;
  newQuantity: number;   // absolute new stock (in base unit)
  reason: string;
  notes: string;
}

interface AdjustmentFormProps {
  onSubmit: (data: AdjustmentLine[]) => Promise<void>;
  onDone?: () => void;
}

const REASONS = [
  { value: 'damage', label: 'Rusak' },
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'count_error', label: 'Kesalahan Hitung' },
  { value: 'other', label: 'Lainnya' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function emptyLine(): AdjustmentLine {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    productId: '',
    productName: '',
    unit: 'pcs',
    conversionFactor: 1,
    newQuantity: 0,
    reason: '',
    notes: '',
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function AdjustmentForm({ onSubmit, onDone }: AdjustmentFormProps) {
  const [lines, setLines] = useState<AdjustmentLine[]>([emptyLine()]);
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

  const updateLine = (lineId: string, patch: Partial<AdjustmentLine>) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const getProductWithUnits = useCallback((productId: string): ProductWithUnits | undefined => {
    return productCache[productId];
  }, [productCache]);

  const handleProductSelect = async (line: AdjustmentLine, product: ProductRow) => {
    const full = await fetchProductWithUnits(product.id);
    const p = full || product;
    updateLine(line.id, {
      productId: p.id,
      productName: p.name,
      unit: p.baseUnit || 'pcs',
      conversionFactor: 1,
      newQuantity: p.stock,
    });
  };

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
    (l) => l.productId && l.newQuantity >= 0 && l.reason && l.notes.trim()
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ArrowClockwise weight="fill" className="w-4 h-4 text-blue-600" />
        <h3 className="text-[12px] font-semibold text-neutral-800">Penyesuaian Stok</h3>
      </div>

      {/* Lines */}
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const product = getProductWithUnits(line.productId);
          const currentStock = product?.stock ?? 0;
          const delta = line.newQuantity - currentStock;
          const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;

          return (
            <div
              key={line.id}
              className="border border-neutral-200 rounded-lg p-3 space-y-2.5 bg-white"
            >
              {/* Row header */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-neutral-400 w-5">{idx + 1}.</span>
                <div className="flex-1">
                  <ProductSearchInput
                    value={line.productId}
                    productName={line.productName}
                    onSelect={(p) => handleProductSelect(line, p)}
                    onClear={() => updateLine(line.id, { productId: '', productName: '', unit: 'pcs', conversionFactor: 1, newQuantity: 0 })}
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
                  {/* Current stock */}
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 ml-7">
                    <Package className="w-3 h-3" />
                    <span>Stok saat ini: <b className="text-neutral-700">{currentStock}</b> {product?.baseUnit || 'pcs'}</span>
                    <span className="text-neutral-300">→</span>
                    <span className={cn(
                      'font-medium',
                      delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-neutral-500'
                    )}>
                      {line.newQuantity} {product?.baseUnit || 'pcs'} ({deltaStr})
                    </span>
                  </div>

                  {/* New quantity */}
                  <div className="ml-7">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.newQuantity || ''}
                      onChange={(e) => updateLine(line.id, { newQuantity: parseFloat(e.target.value) || 0 })}
                      placeholder="Stok baru (jumlah mutlak)"
                      className="h-8 text-[11px]"
                    />
                  </div>

                  {/* Reason + Notes */}
                  <div className="flex items-start gap-2 ml-7">
                    <Select
                      value={line.reason}
                      onValueChange={(val: string | null) => { if (!val) return; updateLine(line.id, { reason: val }); }}
                    >
                      <SelectTrigger className="w-36 h-8 text-[11px]">
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
                    <div className="flex-1 relative">
                      <Input
                        value={line.notes}
                        onChange={(e) => updateLine(line.id, { notes: e.target.value })}
                        placeholder="Catatan (wajib untuk audit trail)"
                        className="h-8 text-[11px]"
                      />
                      {!line.notes.trim() && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-red-400">*</span>
                      )}
                    </div>
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
        <ArrowClockwise className="w-3.5 h-3.5" />
        Tambah baris
      </Button>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
        <div className="text-[10px] text-neutral-500">
          * Catatan wajib diisi untuk audit trail
        </div>
        <div className="flex items-center gap-2">
          {onDone && (
            <Button variant="outline" size="sm" onClick={onDone} className="h-8 text-[11px]">
              Batal
            </Button>
          )}
          <Button
            size="sm"
            disabled={!isValid || submitting}
            onClick={handleSubmit}
            className="h-8 text-[11px] bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? 'Menyimpan…' : 'Simpan Penyesuaian'}
          </Button>
        </div>
      </div>
    </div>
  );
}
