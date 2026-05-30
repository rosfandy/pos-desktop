'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProductStore } from '@/stores/productStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  X,
  Plus,
  Trash,
  Barcode,
  Package,
  CurrencyCircleDollar,
  Tag,
  FloppyDisk,
  XCircle,
} from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string | null; // if set → edit mode
}

export interface UnitRow {
  id: string;
  unitName: string;
  conversionFactor: number;
  priceSell: number | '';
  isDefault: boolean;
}

// Auto-suggest conversion factor
const UNIT_SUGGESTIONS: Record<string, number> = {
  kg: 1000,
  gram: 1,
  g: 1,
  lusin: 12,
  lsn: 12,
  dus: 1,
  box: 1,
  botol: 1,
  pcs: 1,
  piece: 1,
  ml: 1,
  liter: 1000,
  l: 1000,
};

function suggestFactor(unitName: string): number | null {
  const normalized = unitName.toLowerCase().trim();
  return UNIT_SUGGESTIONS[normalized] ?? null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function createUnitRow(): UnitRow {
  return {
    id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    unitName: '',
    conversionFactor: 1,
    priceSell: '',
    isDefault: false,
  };
}

function emptyForm() {
  return {
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    priceBuy: '',
    priceSell: '',
    stock: '',
    baseUnit: 'pcs',
    minStock: '',
    imagePath: '',
    units: [createUnitRow()],
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ProductForm({ open, onOpenChange, productId }: ProductFormProps) {
  const { fetchCategories, fetchProductById, createProduct, updateProduct } = useProductStore();

  const isEdit = Boolean(productId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyForm());
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load categories on open
  useEffect(() => {
    if (open) fetchCategories();
  }, [open, fetchCategories]);

  // Load existing product in edit mode
  useEffect(() => {
    if (open && productId) {
      setLoading(true);
      fetchProductById(productId).then(() => {
        setLoading(false);
      });
    }
  }, [open, productId, fetchProductById]);

  // Sync selectedProduct → form
  const { selectedProduct, clearSelected } = useProductStore();
  useEffect(() => {
      if (selectedProduct && productId === selectedProduct.id) {
        setForm({
          name: selectedProduct.name,
          sku: selectedProduct.sku || '',
          barcode: selectedProduct.barcode || '',
          categoryId: selectedProduct.categoryId || '',
          priceBuy: String(selectedProduct.priceBuy / 100),
          priceSell: String(selectedProduct.priceSell / 100),
          stock: String(selectedProduct.stock),
          baseUnit: selectedProduct.baseUnit || 'pcs',
          minStock: String(selectedProduct.minStock),
          imagePath: selectedProduct.imagePath || '',
          units: (selectedProduct.units || []).map((u) => ({
            id: u.id,
            unitName: u.unitName,
            conversionFactor: u.conversionFactor,
            priceSell: u.priceSell != null ? String(u.priceSell / 100) : '',
            isDefault: u.isDefault,
          })) as UnitRow[],
        });
    }
  }, [selectedProduct, productId]);

  // Reset on close
  const handleClose = useCallback(() => {
    setForm(emptyForm());
    setTouched({});
    setError(null);
    clearSelected();
    onOpenChange(false);
  }, [clearSelected, onOpenChange]);

  const updateField = useCallback((field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const updateUnit = useCallback((rowId: string, field: keyof UnitRow, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      units: prev.units.map((u) => (u.id === rowId ? { ...u, [field]: value } : u)),
    }));
  }, []);

  const addUnitRow = useCallback(() => {
    setForm((prev) => ({ ...prev, units: [...prev.units, createUnitRow()] }));
  }, []);

  const removeUnitRow = useCallback((rowId: string) => {
    setForm((prev) => ({
      ...prev,
      units: prev.units.filter((u) => u.id !== rowId),
    }));
  }, []);

  const handleUnitNameBlur = useCallback((rowId: string, unitName: string) => {
    const suggested = suggestFactor(unitName);
    if (suggested !== null) {
      updateUnit(rowId, 'conversionFactor', suggested);
    }
  }, [updateUnit]);

  // Validation
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nama produk wajib diisi';
    if (form.sku && !/^[A-Za-z0-9\-]+$/.test(form.sku)) e.sku = 'SKU hanya boleh huruf, angka, dan dash';
    if (form.barcode && !/^[A-Za-z0-9]+$/.test(form.barcode)) e.barcode = 'Barcode hanya boleh huruf dan angka';
    if (!form.priceBuy || Number(form.priceBuy) <= 0) e.priceBuy = 'Harga beli harus > 0';
    if (!form.priceSell || Number(form.priceSell) <= 0) e.priceSell = 'Harga jual harus > 0';
    if (form.stock === '' || Number(form.stock) < 0) e.stock = 'Stok tidak boleh negatif';
    if (form.minStock === '' || Number(form.minStock) < 0) e.minStock = 'Min. stok tidak boleh negatif';

    // Units validation
    const unitNames = form.units.map((u) => u.unitName.toLowerCase().trim()).filter(Boolean);
    const hasDuplicate = unitNames.length !== new Set(unitNames).size;
    if (hasDuplicate) e.units = 'Nama unit tidak boleh duplikat';
    for (const u of form.units) {
      if (!u.unitName.trim()) { e.units = 'Semua unit harus punya nama'; break; }
      if (u.conversionFactor <= 0) { e.units = 'Conversion factor harus > 0'; break; }
    }

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = useCallback(async () => {
    // Touch all fields
    setTouched({
      name: true, sku: true, barcode: true, categoryId: true,
      priceBuy: true, priceSell: true, stock: true, baseUnit: true, minStock: true, units: true,
    });
    if (hasErrors) return;

    setLoading(true);
    setError(null);

    try {
      const priceBuyCents = Math.round(Number(form.priceBuy) * 100);
      const priceSellCents = Math.round(Number(form.priceSell) * 100);
      const units = form.units.map((u) => ({
        id: u.id,
        unitName: u.unitName.trim(),
        conversionFactor: Number(u.conversionFactor),
        priceSell: u.priceSell !== '' ? Math.round(Number(u.priceSell) * 100) : undefined,
        isDefault: u.isDefault,
      }));

      let result;
      if (isEdit && productId) {
        if (!productId) {
          setError('ID produk tidak valid');
          setLoading(false);
          return;
        }
        result = await updateProduct(productId, {
          name: form.name.trim(),
          sku: form.sku || null,
          barcode: form.barcode || null,
          categoryId: form.categoryId || null,
          priceBuy: priceBuyCents,
          priceSell: priceSellCents,
          stock: Number(form.stock),
          baseUnit: form.baseUnit,
          minStock: Number(form.minStock),
          imagePath: form.imagePath || null,
          units,
        });
      } else {
        result = await createProduct({
          name: form.name.trim(),
          sku: form.sku || undefined,
          barcode: form.barcode || undefined,
          categoryId: form.categoryId || undefined,
          priceBuy: priceBuyCents,
          priceSell: priceSellCents,
          stock: Number(form.stock),
          baseUnit: form.baseUnit,
          minStock: Number(form.minStock),
          imagePath: form.imagePath || undefined,
          units,
        });
      }

      if (result && !('error' in result)) {
        handleClose();
      } else {
        setError((result as { error?: string })?.error || 'Gagal menyimpan produk');
      }
    } catch (err) {
      setError((err as Error)?.message || 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  }, [form, hasErrors, isEdit, productId, createProduct, updateProduct, handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[720px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          {/* ── Error Banner ─────────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-[12px] px-3 py-2 rounded-md border border-red-200">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Section: Informasi Dasar ──────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Informasi Dasar</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Nama */}
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Nama Produk *</label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Nama produk"
                  className={cn('h-8 text-[12px]', touched.name && errors.name ? 'border-red-400 focus:ring-red-400' : '')}
                />
                {touched.name && errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
              </div>

              {/* SKU */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">SKU</label>
                <Input
                  value={form.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  placeholder="SKU-001"
                  className={cn('h-8 text-[12px] font-mono', touched.sku && errors.sku ? 'border-red-400' : '')}
                />
                {touched.sku && errors.sku && <p className="text-[10px] text-red-500">{errors.sku}</p>}
              </div>

              {/* Barcode */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Barcode</label>
                <div className="relative">
                  <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                  <Input
                    value={form.barcode}
                    onChange={(e) => updateField('barcode', e.target.value)}
                    placeholder="Scan atau ketik"
                    className={cn('h-8 text-[12px] pl-7 font-mono', touched.barcode && errors.barcode ? 'border-red-400' : '')}
                  />
                </div>
                {touched.barcode && errors.barcode && <p className="text-[10px] text-red-500">{errors.barcode}</p>}
              </div>

              {/* Kategori */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Kategori</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  className="w-full h-8 text-[12px] border border-neutral-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Pilih Kategori —</option>
                  {/* Categories loaded from store */}
                </select>
              </div>

              {/* Base Unit */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Satuan Dasar</label>
                <Input
                  value={form.baseUnit}
                  onChange={(e) => updateField('baseUnit', e.target.value)}
                  placeholder="pcs"
                  className="h-8 text-[12px]"
                />
              </div>
            </div>
          </div>

          {/* ── Section: Harga & Stok ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <CurrencyCircleDollar className="w-3 h-3" />
              Harga &amp; Stok
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Harga Beli (Rp) *</label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={form.priceBuy}
                  onChange={(e) => updateField('priceBuy', e.target.value)}
                  placeholder="0"
                  className={cn('h-8 text-[12px]', touched.priceBuy && errors.priceBuy ? 'border-red-400' : '')}
                />
                {touched.priceBuy && errors.priceBuy && <p className="text-[10px] text-red-500">{errors.priceBuy}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Harga Jual (Rp) *</label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={form.priceSell}
                  onChange={(e) => updateField('priceSell', e.target.value)}
                  placeholder="0"
                  className={cn('h-8 text-[12px]', touched.priceSell && errors.priceSell ? 'border-red-400' : '')}
                />
                {touched.priceSell && errors.priceSell && <p className="text-[10px] text-red-500">{errors.priceSell}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Stok Awal *</label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => updateField('stock', e.target.value)}
                  placeholder="0"
                  className={cn('h-8 text-[12px]', touched.stock && errors.stock ? 'border-red-400' : '')}
                />
                {touched.stock && errors.stock && <p className="text-[10px] text-red-500">{errors.stock}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Min. Stok</label>
                <Input
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) => updateField('minStock', e.target.value)}
                  placeholder="0"
                  className={cn('h-8 text-[12px]', touched.minStock && errors.minStock ? 'border-red-400' : '')}
                />
                {touched.minStock && errors.minStock && <p className="text-[10px] text-red-500">{errors.minStock}</p>}
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] font-medium text-neutral-600">Path Gambar (opsional)</label>
                <Input
                  value={form.imagePath}
                  onChange={(e) => updateField('imagePath', e.target.value)}
                  placeholder="/assets/products/xxx.jpg"
                  className="h-8 text-[12px]"
                />
                {form.imagePath && (
                  <p className="text-[10px] text-neutral-400 truncate">{form.imagePath}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Section: Multi-Unit ──────────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Satuan Penjualan
            </h3>
            <div className="space-y-2">
              {form.units.map((unit, idx) => (
                <div key={unit.id} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-md border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 w-4">{idx + 1}</span>

                  {/* Unit name */}
                  <div className="flex-1 space-y-0.5">
                    <Input
                      type="text"
                      value={unit.unitName}
                      onChange={(e) => updateUnit(unit.id, 'unitName', e.target.value)}
                      onBlur={() => handleUnitNameBlur(unit.id, unit.unitName)}
                      placeholder="Nama satuan"
                      className="h-7 text-[11px]"
                    />
                    {suggestFactor(unit.unitName) !== null && unit.conversionFactor === suggestFactor(unit.unitName) && (
                      <p className="text-[9px] text-indigo-500">✔ Saran terdeteksi</p>
                    )}
                  </div>

                  {/* Conversion factor */}
                  <div className="w-20 space-y-0.5">
                    <Input
                      type="number"
                      min={1}
                      value={unit.conversionFactor}
                      onChange={(e) => updateUnit(unit.id, 'conversionFactor', Number(e.target.value))}
                      placeholder="Faktor"
                      className="w-full h-7 text-[11px]"
                    />
                    <p className="text-[9px] text-neutral-400 text-center">× base</p>
                  </div>

                  {/* Override price */}
                  <div className="w-28 space-y-0.5">
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={unit.priceSell}
                      onChange={(e) => updateUnit(unit.id, 'priceSell', e.target.value)}
                      placeholder="Harga (Rp)"
                      className="w-full h-7 text-[11px]"
                    />
                    <p className="text-[9px] text-neutral-400 text-center">override</p>
                  </div>

                  {/* Default checkbox */}
                  <label className="flex items-center gap-1 text-[10px] text-neutral-500 whitespace-nowrap cursor-pointer">
                    <Checkbox
                      defaultChecked={unit.isDefault}
                      onCheckedChange={(checked) => updateUnit(unit.id, 'isDefault', checked)}
                    />
                    Default
                  </label>

                  {/* Remove button */}
                  {form.units.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeUnitRow(unit.id)}
                      title="Hapus satuan"
                      className="text-neutral-400 hover:text-red-500"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.units && <p className="text-[10px] text-red-500">{errors.units}</p>}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUnitRow}
              className="text-[11px] h-7"
            >
              <Plus className="w-3 h-3 mr-1" />
              Tambah Satuan
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="h-8 text-[12px]"
              >
                <X className="w-3 h-3 mr-1" />
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={loading || hasErrors}
                className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                <FloppyDisk className="w-3 h-3 mr-1" />
                {loading ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
