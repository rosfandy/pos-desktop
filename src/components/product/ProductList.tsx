'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useProductStore } from '@/stores/productStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MagnifyingGlass,
  CaretUp,
  CaretDown,
  PencilSimple,
  Trash,
  Eye,
  XCircle,
  CheckCircle,
  Tag,
  Barcode,
  WarningCircle,
  Funnel,
  Spinner,
} from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ProductListProps {
  className?: string;
  onEdit?: (productId: string) => void;
  onView?: (productId: string) => void;
  showInactive?: boolean;
}

// ─── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'priceSell' | 'stock' | 'sku' | 'barcode';
type SortDir = 'asc' | 'desc';

// ─── Debounce ───────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ProductList({
  className,
  onEdit,
  onView,
  showInactive = false,
}: ProductListProps) {
  const { products, categories, isLoading, hasMore, fetchProducts, loadMoreProducts } = useProductStore();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const debouncedSearch = useDebounce(search, 300);

  // Initial load
  useEffect(() => {
    fetchProducts(showInactive ? undefined : { isActive: true });
  }, [fetchProducts, showInactive]);

  // When debounced search changes → query backend
  useEffect(() => {
    const filter: any = {};
    if (showInactive) {
      // no isActive filter = show all
    } else {
      filter.isActive = true;
    }
    if (debouncedSearch.trim()) {
      filter.search = debouncedSearch.trim();
    }
    if (categoryFilter !== 'all') {
      filter.categoryId = categoryFilter;
    }
    fetchProducts(Object.keys(filter).length > 0 ? filter : undefined);
  }, [fetchProducts, debouncedSearch, categoryFilter, showInactive]);

  // ── Infinite scroll via IntersectionObserver ───────────────────────────────

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          loadMoreProducts();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMoreProducts]);

  // ── Client-side sort (only sorts currently loaded items) ───────────────────

  const sorted = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'id');
          break;
        case 'priceSell':
          cmp = a.priceSell - b.priceSell;
          break;
        case 'stock':
          cmp = a.stock - b.stock;
          break;
        case 'sku':
          cmp = (a.sku || '').localeCompare(b.sku || '');
          break;
        case 'barcode':
          cmp = (a.barcode || '').localeCompare(b.barcode || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [products, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock && p.isActive).length,
    [products]
  );

  if (isLoading && products.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-neutral-400', className)}>
        <div className="text-[13px]">Memuat produk…</div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* ── Toolbar: Search + Category Filter ────────────────────────────────── */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-3 py-2 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, SKU, atau barcode…"
            className="h-8 pl-8 pr-3 text-[12px]"
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

        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
          <Funnel className="w-3.5 h-3.5" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 border border-neutral-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        <span className="ml-auto text-[10px] text-neutral-400">{products.length} produk</span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase w-12">No</th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase cursor-pointer hover:text-neutral-700 select-none" onClick={() => toggleSort('sku')}>
                <span className="flex items-center gap-0.5"><Barcode className="w-3 h-3" /> SKU{sortKey === 'sku' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}</span>
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase cursor-pointer hover:text-neutral-700 select-none" onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" /> Nama Produk{sortKey === 'name' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}</span>
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right cursor-pointer hover:text-neutral-700 select-none" onClick={() => toggleSort('priceSell')}>
                <span className="flex items-center justify-end gap-0.5">Harga Jual{sortKey === 'priceSell' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}</span>
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center cursor-pointer hover:text-neutral-700 select-none" onClick={() => toggleSort('stock')}>
                <span className="flex items-center justify-center gap-0.5">Stok{sortKey === 'stock' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}</span>
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center">Status</th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product, idx) => (
              <tr
                key={product.id}
                className={cn('border-b border-neutral-100 transition-colors', product.isActive ? 'hover:bg-neutral-50' : 'bg-neutral-50/50 opacity-60')}
              >
                <td className="px-3 py-2 text-[11px] text-neutral-400 tabular-nums">{idx + 1}</td>
                <td className="px-3 py-2 text-[11px] text-neutral-500 font-mono">{product.sku || '—'}</td>
                <td className="px-3 py-2">
                  <p className="text-[12px] font-medium text-neutral-800 truncate max-w-[220px]">{product.name}</p>
                  <p className="text-[10px] text-neutral-400">{categories.find((c) => c.id === product.categoryId)?.name || product.categoryId || '—'}</p>
                </td>
                <td className="px-3 py-2 text-[12px] font-semibold text-indigo-600 text-right tabular-nums">Rp{(product.priceSell / 100).toLocaleString('id-ID')}</td>
                <td className={cn('px-3 py-2 text-[12px] text-center tabular-nums', product.stock <= product.minStock ? 'text-red-500 font-semibold' : product.stock <= 20 ? 'text-amber-500' : 'text-neutral-600')}>
                  {product.stock} {product.baseUnit}
                </td>
                <td className="px-3 py-2 text-center">
                  {product.isActive ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-300 mx-auto" />
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    {onView && (
                      <Button variant="ghost" size="icon-xs" onClick={() => onView(product.id)} className="text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50" title="Lihat detail">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="icon-xs" onClick={() => onEdit(product.id)} className="text-neutral-400 hover:text-amber-600 hover:bg-amber-50" title="Edit">
                        <PencilSimple className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-xs" className="text-neutral-400 hover:text-red-600 hover:bg-red-50" title="Hapus">
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Infinite scroll sentinel ───────────────────────────────────────── */}
        <div ref={sentinelRef} className="flex items-center justify-center py-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-[12px] text-neutral-400">
              <Spinner className="w-4 h-4 animate-spin" />
              Memuat lebih banyak…
            </div>
          )}
          {!hasMore && products.length > 0 && (
            <span className="text-[10px] text-neutral-300">Semua produk telah dimuat</span>
          )}
        </div>

        {sorted.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
            <MagnifyingGlass className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-[13px] font-medium">Produk tidak ditemukan</p>
            <p className="text-[11px] mt-1">Coba kata kunci lain atau ubah filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
