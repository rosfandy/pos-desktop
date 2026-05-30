'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ProductRow, ProductWithUnits } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectPositioner, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Trash, Package } from 'phosphor-react';
import ProductSearchInput from './ProductSearchInput';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StockInLine {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  conversionFactor: number;
  quantity: number;
  reason: string;
}

interface StockInFormProps {
  onSubmit: (data: StockInLine[]) => Promise<void>;
  onDone?: () => void;
  initialProductId?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function emptyLine(): StockInLine {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    productId: '',
    productName: '',
    unit: 'pcs',
    conversionFactor: 1,
    quantity: 0,
    reason: '',
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function StockInForm({ onSubmit, onDone, initialProductId }: StockInFormProps) {
  const [lines, setLines] = useState<StockInLine[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  // Auto-select product dari initialProductId
  useEffect(() => {
    if (!initialProductId) return;
    const firstLine = lines[0];
    if (firstLine && !firstLine.productId) {
      window.api.productGet(initialProductId).then((res: any) => {
        if (res?.ok && res.data) {
          const p = res.data as ProductWithUnits;
          const units = p.units || [];
          const firstUnit = units.length > 0 ? units[0] : null;
          const unitName = firstUnit ? firstUnit.unitName : (p.baseUnit || 'pcs');
          updateLine(firstLine.id, {
            productId: p.id,
            productName: p.name,
            unit: unitName,
            conversionFactor: firstUnit ? firstUnit.conversionFactor : 1,
          });
        }
      }).catch(() => {});
    }
  }, [initialProductId]); // sekali di mount
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

  const updateLine = (lineId: string, patch: Partial<StockInLine>) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const getProductWithUnits = useCallback((productId: string): ProductWithUnits | undefined => {
    return productCache[productId];
  }, [productCache]);

  const handleProductSelect = async (line: StockInLine, product: ProductRow) => {
    const full = await fetchProductWithUnits(product.id);
    const p = full || product;
    updateLine(line.id, {
      productId: p.id,
      productName: p.name,
      unit: p.baseUnit || 'pcs',
      conversionFactor: 1,
    });
  };

  const handleUnitChange = (line: StockInLine, unitName: string) => {
    const product = getProductWithUnits(line.productId);
    const unitDef = product?.units?.find((u) => u.unitName === unitName);
    updateLine(line.id, {
      unit: unitName,
      conversionFactor: unitDef?.conversionFactor || 1,
    });
  };

  const baseQty = (line: StockInLine) => line.quantity * line.conversionFactor;

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
    (l) => l.productId && l.quantity > 0 && l.reason.trim()
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package weight="fill" className="w-4 h-4 text-emerald-600" />
        <h3 className="text-[12px] font-semibold text-neutral-800">Stok Masuk</h3>
      </div>

      {/* Lines */}
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const product = getProductWithUnits(line.productId);
          const currentStock = product?.stock ?? 0;

          return (
            <div
              key={line.id}
              className="border border-neutral-200 rounded-lg p-3 space-y-2.5 bg-white"
            >
              {/* Row header: product search + remove */}
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
                  {/* Product info */}
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 ml-7">
                    <span>Stok saat ini: <b className="text-neutral-700">{currentStock}</b></span>
                    <span className="text-neutral-300">|</span>
                    <span>Satuan dasar: {product?.baseUnit || 'pcs'}</span>
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
                        placeholder="Jumlah"
                        className="h-8 text-[11px] pr-16"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
                        = {baseQty(line)} {product?.baseUnit || 'pcs'}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="ml-7">
                    <Input
                      value={line.reason}
                      onChange={(e) => updateLine(line.id, { reason: e.target.value })}
                      placeholder="Alasan / keterangan"
                      className="h-8 text-[11px]"
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
        <Plus className="w-3.5 h-3.5" />
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
          className="h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700"
        >
          {submitting ? 'Menyimpan…' : 'Simpan Stok Masuk'}
        </Button>
      </div>
    </div>
  );
}
