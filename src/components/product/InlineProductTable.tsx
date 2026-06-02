'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProductRow, CategoryRow, ProductPageResult } from '@/lib/api';
import {
  MagnifyingGlass,
  Plus,
  FloppyDisk,
  XCircle,
  PencilSimple,
  Trash,
  WarningCircle,
  Funnel,
} from 'phosphor-react';
import { PosTable, PosTableHead } from '@/components/ui/table';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EditingRow {
  id: string; // existing product id or 'new-<timestamp>' for new rows
  isNew: boolean;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  priceBuy: string;
  priceSell: string;
  stock: string;
  baseUnit: string;
  minStock: string;
}

const EMPTY_NEW_ROW = (): Omit<EditingRow, 'id' | 'isNew'> => ({
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  priceBuy: '0',
  priceSell: '0',
  stock: '0',
  baseUnit: 'pcs',
  minStock: '0',
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T; error?: { code: string; message: string } };
    if (r.ok && r.data !== undefined) return r.data as T;
  }
  return (fallback ?? null) as T | null;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function InlineProductTable({ refreshKey }: { refreshKey?: number }) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingRows, setEditingRows] = useState<Map<string, EditingRow>>(new Map());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Debounce search — 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load products from DB (pass search & categoryId to server) ──────────────
  const loadProducts = useCallback(async (searchTerm?: string, catFilter?: string) => {
    setLoading(true);
    setNextCursor(null);
    setHasMore(false);
    try {
      const res = await window.api.productList({
        cursor: undefined,
        limit: 10,
        search: searchTerm || undefined,
        categoryId: catFilter && catFilter !== 'all' ? catFilter : undefined,
      });
      const page = unwrap<ProductPageResult>(res, { data: [], nextCursor: null, hasMore: false });
      if (page) {
        setProducts(page.data ?? []);
        setNextCursor(page.nextCursor ?? null);
        setHasMore(page.hasMore);
      } else {
        setProducts([]);
        setNextCursor(null);
        setHasMore(false);
      }
    } catch {
      setProducts([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load more (cursor-based pagination) ──────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await window.api.productList(
        { cursor: nextCursor, limit: 10, search: debouncedSearch || undefined, categoryId: categoryFilter !== 'all' ? categoryFilter : undefined }
      );
      const page = unwrap<ProductPageResult>(res, { data: [], nextCursor: null, hasMore: false });
      if (page && page.data) {
        setProducts((prev) => [...prev, ...page.data!]);
        setNextCursor(page.nextCursor ?? null);
        setHasMore(page.hasMore);
      }
    } catch {
      // ignore load-more errors
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, debouncedSearch, categoryFilter]);

  // ── Load categories (direct API, no store) ───────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      const res = await window.api.categoryList();
      const data = unwrap<CategoryRow[]>(res, []);
      setCategories(data ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadProducts(debouncedSearch, categoryFilter);
  }, [loadProducts, refreshKey, debouncedSearch, categoryFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ── Infinite scroll: auto loadMore when sentinel enters viewport ─────────────
  useEffect(() => {
    const sentinel = loadMoreTriggerRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const activeCategories = useMemo(() => categories, [categories]);
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products]
  );

  // ── Inline edit handlers ────────────────────────────────────────────────────

  const startEdit = useCallback((product: ProductRow) => {
    setEditingRows((prev) => {
      const next = new Map(prev);
      next.set(product.id, {
        id: product.id,
        isNew: false,
        name: product.name,
        sku: product.sku || '',
        barcode: product.barcode || '',
        categoryId: product.categoryId || '',
        priceBuy: String(product.priceBuy / 100),
        priceSell: String(product.priceSell / 100),
        stock: String(product.stock),
        baseUnit: product.baseUnit,
        minStock: String(product.minStock),
      });
      return next;
    });
  }, []);

  const addNewRow = useCallback(() => {
    const tempId = `new-${Date.now()}`;
    setEditingRows((prev) => {
      const next = new Map(prev);
      next.set(tempId, { id: tempId, isNew: true, ...EMPTY_NEW_ROW() });
      return next;
    });
  }, []);

  // ── Bulk save ─────────────────────────────────────────────────────────────────
  const handleBulkSave = useCallback(async () => {
    const allRows = Array.from(editingRows.values()).filter((row) => row.name.trim());
    if (allRows.length === 0) {
      alert('Tidak ada data untuk disimpan.');
      return;
    }
    if (!confirm(`Simpan ${allRows.length} produk sekaligus?`)) return;

    const rowsPayload = allRows.map((row) => {
      const priceBuyCents = Math.round(Number(row.priceBuy) * 100);
      const priceSellCents = Math.round(Number(row.priceSell) * 100);
      return {
        id: row.isNew ? undefined : row.id,
        name: row.name.trim(),
        sku: row.sku.trim() || undefined,
        barcode: row.barcode.trim() || undefined,
        categoryId: row.categoryId || undefined,
        priceBuy: priceBuyCents,
        priceSell: priceSellCents,
        stock: Number(row.stock) || 0,
        baseUnit: row.baseUnit.trim() || 'pcs',
        minStock: Number(row.minStock) || 0,
      };
    });

    const result = await window.api.productBulkSave(rowsPayload);
    if (result.ok && result.data) {
      const { success, errors } = result.data;
      if (success > 0) {
        setEditingRows(new Map()); // clear all editing rows
        await loadProducts(); // refresh from DB
        if (errors.length > 0) {
          alert(`${success} produk disimpan. ${errors.length} gagal:\n${errors.map((e: { row: number; message: string }) => `Baris ${e.row}: ${e.message}`).join('\n')}`);
        }
      } else {
        alert(`Gagal menyimpan: ${errors.map((e: { row: number; message: string }) => `Baris ${e.row}: ${e.message}`).join('\n')}`);
      }
     } else {
       alert((result as any).error?.message || 'Gagal menyimpan produk');
     }
  }, [editingRows, loadProducts]);

  const cancelEdit = useCallback((id: string) => {
    setEditingRows((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateField = useCallback((id: string, field: keyof EditingRow, value: string | boolean) => {
    setEditingRows((prev) => {
      const next = new Map(prev);
      const row = prev.get(id);
      if (row) next.set(id, { ...row, [field]: value });
      return next;
    });
  }, []);

  const saveRow = useCallback(
    async (id: string) => {
      if (!id) {
        alert('Error: ID produk tidak valid. Silakan refresh halaman.');
        return;
      }
      const row = editingRows.get(id);
      if (!row || !row.name.trim()) return;

      const priceBuyCents = Math.round(Number(row.priceBuy) * 100);
      const priceSellCents = Math.round(Number(row.priceSell) * 100);

      setSavingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      try {
        if (row.isNew) {
          const res = await window.api.productCreate({
            name: row.name.trim(),
            sku: row.sku.trim() || undefined,
            barcode: row.barcode.trim() || undefined,
            categoryId: row.categoryId || undefined,
            priceBuy: priceBuyCents,
            priceSell: priceSellCents,
            stock: Number(row.stock) || 0,
            baseUnit: row.baseUnit.trim() || 'pcs',
            minStock: Number(row.minStock) || 0,
            units: [{ unitName: row.baseUnit.trim() || 'pcs', conversionFactor: 1, priceSell: priceSellCents, isDefault: true }],
          });
          if (res && typeof res === 'object' && 'ok' in res && !res.ok) {
            alert((res as any).error?.message || 'Gagal membuat produk');
            return;
          }
        } else {
          const res = await window.api.productUpdate(id, {
            name: row.name.trim(),
            sku: row.sku.trim() || null,
            barcode: row.barcode.trim() || null,
            categoryId: row.categoryId || null,
            priceBuy: priceBuyCents,
            priceSell: priceSellCents,
            stock: Number(row.stock) || 0,
            baseUnit: row.baseUnit.trim(),
            minStock: Number(row.minStock) || 0,
          });
          if (res && typeof res === 'object' && 'ok' in res && !res.ok) {
            alert((res as any).error?.message || 'Gagal memperbarui produk');
            return;
          }
        }
        cancelEdit(id);
        await loadProducts(); // refresh from DB
      } catch {
        alert('Gagal menyimpan produk');
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [editingRows, cancelEdit, loadProducts]
  );

  const handleDelete = useCallback(
    async (productId: string) => {
      if (!confirm('Hapus produk ini?')) return;
      const res = await window.api.productDelete(productId);
      if (res && typeof res === 'object' && 'ok' in res && res.ok) {
        await loadProducts();
      } else {
        alert((res as any)?.error?.message || 'Gagal menghapus produk');
      }
    },
    [loadProducts]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveRow(id);
      } else if (e.key === 'Escape') {
        cancelEdit(id);
      }
    },
    [saveRow, cancelEdit]
  );

   // ── Render ──────────────────────────────────────────────────────────────────

  // Tombol "Tambah Baris" hilang HANYA jika ada baris existing yang sedang diedit.
  // Jika hanya ada baris baru (atau tidak ada yang diedit), tombol tetap muncul
  // agar pengguna bisa menambah lebih dari 1 baris sekaligus.
  const hasExistingEdit = useMemo(
    () => [...editingRows.values()].some((row) => !row.isNew),
    [editingRows]
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        <div className="text-[13px]">Memuat produk…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-neutral-200 bg-white">
        {/* Baris 1: Pencarian & aksi utama */}
          <div className="px-3 py-2 flex items-center gap-2 flex-wrap border-b border-neutral-100">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, SKU, barcode…"
              className="h-8 pl-8 pr-3 text-[12px]!"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <span className="ml-auto text-[10px] text-neutral-400 tabular-nums">{products.length} produk</span>

          {!hasExistingEdit && (
            <Button
              onClick={addNewRow}
              variant="default"
              size="sm"
              className="flex items-center gap-1.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris
            </Button>
          )}
          {editingRows.size > 0 && (
            <Button
              onClick={handleBulkSave}
              variant="default"
              size="sm"
              className="flex items-center gap-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FloppyDisk className="w-3.5 h-3.5" />
              Simpan Semua ({editingRows.size})
            </Button>
          )}
        </div>

        {/* Baris 2: Filtering */}
        <div className="px-3 py-1.5 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Funnel className="w-3.5 h-3.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-7 border border-neutral-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {lowStockCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
              <WarningCircle className="w-3.5 h-3.5" />
              {lowStockCount} stok rendah
            </span>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400">
        <PosTable className="min-w-[1100px] [&_td]:border-r [&_th]:border-r [&_td]:border-neutral-200 [&_th]:border-neutral-200">
          <PosTableHead>
            <tr className="bg-neutral-50 border-b-2 border-neutral-300">
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase w-8">No</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase w-[100px]">SKU</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase w-[120px]">Barcode</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase w-[200px]">Nama Produk</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase w-[120px]">Kategori</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-right w-[130px]">Harga Beli</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-right w-[130px]">Harga Jual</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-center w-[80px]">Stok</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-center w-[72px]">Satuan</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-center w-[60px]">Min</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-center w-24 sticky right-0 bg-neutral-50 z-20 border-l border-neutral-200">Aksi</th>
            </tr>
          </PosTableHead>
          <tbody>
            {/* ── New rows (editing) ──── */}
            {[...editingRows.entries()]
              .filter(([, row]) => row.isNew)
              .map(([id, row]) => (
                <tr key={id} className="bg-indigo-50/40 border-b border-indigo-200">
                  <td className="px-3 py-1.5 text-[11px] text-indigo-500 font-medium">✚ new</td>
                  <td className="px-1.5 py-1.5">
                    <Input value={row.sku} onChange={(e) => updateField(id, 'sku', e.target.value)} onKeyDown={(e) => handleKeyDown(e, id)} placeholder="SKU" className="h-7 text-[11px] font-mono" />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <Input value={row.barcode} onChange={(e) => updateField(id, 'barcode', e.target.value)} onKeyDown={(e) => handleKeyDown(e, id)} placeholder="Barcode" className="h-7 text-[11px] font-mono" />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <Input value={row.name} onChange={(e) => updateField(id, 'name', e.target.value)} onKeyDown={(e) => handleKeyDown(e, id)} placeholder="Nama produk *" className={cn('h-7 text-[11px] w-full', !row.name.trim() ? 'border-red-300 focus:ring-red-300' : '')} autoFocus />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <select value={row.categoryId} onChange={(e) => updateField(id, 'categoryId', e.target.value)} className="w-full h-7 text-[11px] border border-neutral-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="">—</option>
                      {activeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-1.5 py-1.5">
                    <Input type="number" min="0" step="100" value={row.priceBuy} onChange={(e) => updateField(id, 'priceBuy', e.target.value)} onKeyDown={(e) => handleKeyDown(e, id)} className="h-7 text-[11px] text-right tabular-nums w-full" />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <Input type="number" min="0" step="100" value={row.priceSell} onChange={(e) => updateField(id, 'priceSell', e.target.value)} onKeyDown={(e) => handleKeyDown(e, id)} className="h-7 text-[11px] text-right tabular-nums w-full" />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <Input type="number" min="0" value={row.stock} onChange={(e) => updateField(id, 'stock', e.target.value)} onKeyDown={(e) => handleKeyDown(e, id)} className="h-7 text-[11px] text-center tabular-nums w-full" />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <Input value={row.baseUnit} onChange={(e) => updateField(id, 'baseUnit', e.target.value)} onKeyDown={(e) => handleKeyDown(e, id)} placeholder="pcs" className="w-16 h-7 text-[11px] text-center" />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <Input type="number" min="0" value={row.minStock} onChange={(e) => updateField(id, 'minStock', e.target.value)} onKeyDown={(e) => handleKeyDown(e, id)} className="w-16 h-7 text-[11px] text-center tabular-nums" />
                  </td>
                  <td className="px-1.5 py-1.5 sticky right-0 z-10 bg-indigo-50 border-l border-indigo-100">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => saveRow(id)} disabled={savingIds.has(id) || !row.name.trim()} 
                      className="bg-green-200 text-green-600 hover:bg-green-300" title="Simpan (Enter)">
                        <FloppyDisk className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => cancelEdit(id)}
                       className="bg-red-200 text-red-800 hover:bg-red-300!" title="Batal (Esc)">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

            {/* ── Existing rows ──── */}
            {products.map((product, idx) => {
              const editing = editingRows.get(product.id);
              const isEditing = !!editing;
              const isSaving = savingIds.has(product.id);

              if (isEditing && editing) {
                return (
                  <tr key={product.id} className="bg-amber-50/50 border-b border-amber-100">
                    <td className="px-3 py-1.5 text-[11px] text-amber-600 font-medium tabular-nums">✏ {idx + 1}</td>
                    <td className="px-1.5 py-1.5">
                      <Input value={editing.sku} onChange={(e) => updateField(product.id, 'sku', e.target.value)} onKeyDown={(e) => handleKeyDown(e, product.id)} className="h-7 text-[11px] font-mono" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <Input value={editing.barcode} onChange={(e) => updateField(product.id, 'barcode', e.target.value)} onKeyDown={(e) => handleKeyDown(e, product.id)} placeholder="Barcode" className="h-7 text-[11px] font-mono" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <Input value={editing.name} onChange={(e) => updateField(product.id, 'name', e.target.value)} onKeyDown={(e) => handleKeyDown(e, product.id)} className={cn('h-7 text-[11px] w-full', !editing.name.trim() ? 'border-red-300 focus:ring-red-300' : '')} autoFocus />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <select value={editing.categoryId} onChange={(e) => updateField(product.id, 'categoryId', e.target.value)} className="w-full h-7 text-[11px] border border-neutral-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="">—</option>
                        {activeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td className="px-1.5 py-1.5">
                      <Input type="number" min="0" step="100" value={editing.priceBuy} onChange={(e) => updateField(product.id, 'priceBuy', e.target.value)} onKeyDown={(e) => handleKeyDown(e, product.id)} className="h-7 text-[11px] text-right tabular-nums w-full" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <Input type="number" min="0" step="100" value={editing.priceSell} onChange={(e) => updateField(product.id, 'priceSell', e.target.value)} onKeyDown={(e) => handleKeyDown(e, product.id)} className="h-7 text-[11px] text-right tabular-nums w-full" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <Input type="number" min="0" value={editing.stock} onChange={(e) => updateField(product.id, 'stock', e.target.value)} onKeyDown={(e) => handleKeyDown(e, product.id)} className="h-7 text-[11px] text-center tabular-nums w-full" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <Input value={editing.baseUnit} onChange={(e) => updateField(product.id, 'baseUnit', e.target.value)} onKeyDown={(e) => handleKeyDown(e, product.id)} className="w-16 h-7 text-[11px] text-center" />
                    </td>
                    <td className="px-1.5 py-1.5">
                    <Input type="number" min="0" value={editing.minStock} onChange={(e) => updateField(product.id, 'minStock', e.target.value)} onKeyDown={(e) => handleKeyDown(e, product.id)} className="w-16 h-7 text-[11px] text-center tabular-nums" />
                    </td>
                    <td className="px-1.5 py-1.5 sticky right-0 z-10 bg-amber-50 border-l border-amber-100">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => saveRow(product.id)} disabled={isSaving || !editing.name.trim()} 
                        className="bg-green-200 text-green-800 hover:bg-green-300" title="Simpan (Enter)">
                          <FloppyDisk className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => cancelEdit(product.id)} 
                        className="bg-red-200 text-red-800 hover:bg-red-300!" title="Batal (Esc)">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }

              // ── Read mode row ────
              return (
                <tr
                  key={product.id}
                  className="border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                >
                  <td className="px-2 py-1.5 text-[11px] text-neutral-400 tabular-nums">{idx + 1}</td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-500 font-mono">{product.sku || '—'}</td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-500 font-mono">{product.barcode || '—'}</td>
                  <td className="px-2 py-1.5">
                    <p className="text-[12px] font-medium text-neutral-800 truncate max-w-[180px]">{product.name}</p>
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-500">
                    {categories.find((c) => c.id === product.categoryId)?.name || '—'}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-500 text-right tabular-nums">
                    Rp{(product.priceBuy / 100).toLocaleString('id-ID')}
                  </td>
                  <td className="px-2 py-1.5 text-[12px] font-semibold text-indigo-600 text-right tabular-nums">
                    Rp{(product.priceSell / 100).toLocaleString('id-ID')}
                  </td>
                  <td className={cn('px-2 py-1.5 text-[12px] text-center tabular-nums', product.stock <= product.minStock ? 'text-red-500 font-semibold' : product.stock <= 20 ? 'text-amber-500' : 'text-neutral-600')}>
                    {product.stock}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-500 text-center">{product.baseUnit}</td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-400 text-center tabular-nums">{product.minStock}</td>
                  <td className="px-2 py-1.5 sticky right-0 z-10 border-l border-neutral-200 bg-white">
                    {editingRows.size === 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => startEdit(product)}
                          className="text-neutral-800 hover:text-amber-600 hover:bg-amber-50"
                          title="Edit"
                        >
                          <PencilSimple className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}

            {products.length === 0 && editingRows.size === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center">
                  <div className="flex flex-col items-center text-neutral-400">
                    <MagnifyingGlass className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[13px] font-medium">Tidak ada produk</p>
                    <p className="text-[11px] mt-1">Klik "Tambah Baris" untuk menambah produk baru</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {/* Infinite-scroll sentinel + load-more indicator — must be inside overflow-auto */}
          <tfoot>
            <tr>
              <td colSpan={12}>
                {/* Sentinel: IntersectionObserver watches this to auto-trigger loadMore */}
                <div ref={loadMoreTriggerRef} className="h-1 w-full" aria-hidden="true" />

                {/* Loading skeleton rows while fetching next page */}
                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 py-4 border-t border-neutral-100">
                    <svg
                      className="animate-spin h-4 w-4 text-indigo-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-[11px] text-neutral-400">Memuat lebih banyak…</span>
                  </div>
                )}

                {/* End-of-list indicator */}
                {!hasMore && !loadingMore && products.length > 0 && (
                  <div className="flex items-center justify-center py-3 border-t border-neutral-100">
                    <span className="text-[10px] text-neutral-300">— {products.length} produk dimuat —</span>
                  </div>
                )}
              </td>
            </tr>
          </tfoot>
        </PosTable>
      </div>
    </div>
  );
}
