import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ProductPageResult } from '@/lib/api';
import { MagnifyingGlass, CaretUp, CaretDown, Plus, Barcode, Tag, Spinner } from 'phosphor-react';
import { PosTable, PosTableHead } from '@/components/ui/table';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  barcode?: string;
  stock: number;
  unit?: string;
  unitConversion?: number;
}

export interface ProductTableProps {
  className?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onAddToCart?: (product: Product) => void;
}

type SortKey = 'name' | 'price' | 'stock' | 'barcode';
type SortDir = 'asc' | 'desc';

interface ProductRaw {
  id: string;
  name: string;
  priceSell: number;
  categoryName?: string;
  categoryId?: string;
  barcode?: string | null;
  stock: number;
  baseUnit: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T; error?: { code: string; message: string } };
    if (r.ok) return r.data as T;
  }
  return fallback ?? null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ProductTable({
  className,
  searchQuery: externalSearch,
  onSearchChange,
  onAddToCart,
}: ProductTableProps) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const addItem = useCartStore((s) => s.addItem);

  const search = externalSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const debouncedSearch = useDebounce(search, 300);

  // ── Search products on backend when debounced query changes ─────────────────
  useEffect(() => {
    setLoading(true);
    window.api.productList({ search: debouncedSearch.trim() || undefined, limit: 0 }).then((res: any) => {
      const page = unwrap<ProductPageResult>(res, { data: [], nextCursor: null, hasMore: false });
      if (page && page.data) {
        const raw: ProductRaw[] = page.data.map((p) => ({
          id: p.id,
          name: p.name,
          priceSell: p.priceSell,
          categoryName: p.categoryName ?? undefined,
          categoryId: p.categoryId ?? undefined,
          barcode: p.barcode,
          stock: p.stock,
          baseUnit: p.baseUnit,
        }));
        setProducts(raw);
      } else {
        setProducts([]);
      }
      setLoading(false);
    }).catch(() => {
      setProducts([]);
      setLoading(false);
    });
  }, [debouncedSearch]);

  // ── Auto-focus search on mount ───────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // ── Reset highlight when search changes ─────────────────────────────────────
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  // ── Scroll highlighted row into view ─────────────────────────────────────────
  useEffect(() => {
    if (highlightedIndex >= 0) {
      const rows = tableRef.current?.querySelectorAll('tbody tr');
      rows?.[highlightedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex]);

  // ── Map raw → POS Product shape ──────────────────────────────────────────────
  const mappedProducts = useMemo<Product[]>(() => {
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.priceSell / 100,
      category: p.categoryName || p.categoryId || '',
      barcode: p.barcode || undefined,
      stock: p.stock,
      unit: p.baseUnit,
      unitConversion: 1,
    }));
  }, [products]);

  // ── Filtering & Sorting (client-side sort only, no in-memory filter) ──────
  const filtered = useMemo(() => {
    let list = mappedProducts;

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'id');
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'stock':
          cmp = a.stock - b.stock;
          break;
        case 'barcode':
          cmp = (a.barcode || '').localeCompare(b.barcode || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [mappedProducts, sortKey, sortDir]);

  // ── Add to cart ─────────────────────────────────────────────────────────────
  const handleAdd = useCallback((product: Product) => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.unit || 'pcs',
        unitConversion: product.unitConversion || 1,
        price: Math.round(product.price * 100),
        discount: 0,
        total: Math.round(product.price * 100),
      });
    }

    setAddedId(product.id);
    setHighlightedIndex(-1);
    setTimeout(() => setAddedId(null), 400);

    // Setelah item masuk keranjang, tetap arahkan operator ke input search
    // agar workflow kasir bisa langsung scan/ketik item berikutnya.
    setTimeout(() => {
      searchRef.current?.focus({ preventScroll: true });
      searchRef.current?.select();
    }, 0);
  }, [addItem, onAddToCart]);

  // ── Sort toggle ─────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  };

  // ── Row class helper ─────────────────────────────────────────────────────────
  const getRowClass = (isHighlighted: boolean, isAdded: boolean) => {
    if (isHighlighted) return 'bg-indigo-100 ring-2 ring-indigo-500 ring-inset';
    if (isAdded) return 'bg-emerald-50';
    return 'hover:bg-neutral-50';
  };

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    const isFromSearch = e.target === searchRef.current;
    const maxIdx = filtered.length - 1;

    if (isFromSearch) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) => (i < 0 ? 0 : Math.min(i + 1, maxIdx)));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? Math.max(i - 1, 0) : maxIdx));
        return;
      }
      if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        handleAdd(filtered[highlightedIndex]);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => (i < 0 ? 0 : Math.min(i + 1, maxIdx)));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? Math.max(i - 1, 0) : maxIdx));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleAdd(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        setHighlightedIndex(-1);
        searchRef.current?.focus();
        break;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col h-full', className)} onKeyDown={handleTableKeyDown}>
      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border bg-card text-card-foreground">
        <div className="relative px-3 py-2">
          <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau scan barcode…"
            data-focus-search="product"
            className="h-8 pl-9 pr-3 text-[12px]!"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-[11px]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Product table ───────────────────────────────────────────────────── */}
      <div ref={tableRef} className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8 text-neutral-400">
            <Spinner className="w-5 h-5 animate-spin mr-2" />
            <span className="text-[13px]">Mencari…</span>
          </div>
        )}

        {!loading && products.length === 0 && !search.trim() && (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
            <MagnifyingGlass className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-[13px] font-medium">Cari produk</p>
            <p className="text-[11px] mt-1">Ketik nama produk atau scan barcode untuk memulai</p>
          </div>
        )}

        {!loading && products.length === 0 && search.trim() && (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
            <MagnifyingGlass className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-[13px] font-medium">Produk tidak ditemukan</p>
            <p className="text-[11px] mt-1">Coba kata kunci lain</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            <PosTable>
              <PosTableHead>
                <tr className="bg-neutral-50 border-b-2 border-neutral-300">
                  <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-10 border-r border-neutral-200">No</th>
                  <th
                    className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none border-r border-neutral-200"
                    onClick={() => toggleSort('barcode')}
                  >
                    <span className="flex items-center gap-0.5">
                      <Barcode className="w-3 h-3" />
                      Kode
                      {sortKey === 'barcode' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none border-r border-neutral-200"
                    onClick={() => toggleSort('name')}
                  >
                    <span className="flex items-center gap-0.5">
                      <Tag className="w-3 h-3" />
                      Nama Produk
                      {sortKey === 'name' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-right cursor-pointer hover:text-neutral-700 select-none border-r border-neutral-200"
                    onClick={() => toggleSort('price')}
                  >
                    <span className="flex items-center justify-end gap-0.5">
                      Harga
                      {sortKey === 'price' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-center cursor-pointer hover:text-neutral-700 select-none border-r border-neutral-200"
                    onClick={() => toggleSort('stock')}
                  >
                    <span className="flex items-center justify-center gap-0.5">
                      Stok
                      {sortKey === 'stock' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                    </span>
                  </th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-center w-20">Aksi</th>
                </tr>
              </PosTableHead>

              <tbody>
                {filtered.map((product, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  const isAdded = addedId === product.id;
                  const rowClass = getRowClass(isHighlighted, isAdded);

                  return (
                    <tr
                      key={product.id}
                      onClick={() => handleAdd(product)}
                      className={cn('border-b border-neutral-200 cursor-pointer transition-colors', rowClass)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onMouseLeave={() => setHighlightedIndex(-1)}
                    >
                      <td className="px-3 py-1 text-[11px] text-neutral-400 tabular-nums border-r border-neutral-200">{idx + 1}</td>
                      <td className="px-3 py-1 text-[11px] text-neutral-500 font-mono border-r border-neutral-200">
                        {product.barcode || <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-3 py-1 border-r border-neutral-200">
                        <p className="text-[12px] font-medium text-neutral-800 truncate max-w-[240px]">{product.name}</p>
                        <p className="text-[10px] text-neutral-400">{product.category}</p>
                      </td>
                      <td className="px-3 py-1 text-[12px] font-semibold text-indigo-600 text-right tabular-nums border-r border-neutral-200">
                        Rp{product.price.toLocaleString('id-ID')}
                      </td>
                      <td className={cn(
                        'px-3 py-1 text-[12px] text-center tabular-nums border-r border-neutral-200',
                        product.stock <= 5 ? 'text-red-500 font-semibold' : product.stock <= 20 ? 'text-amber-500' : 'text-neutral-600'
                      )}>
                        {product.stock}
                      </td>
                      <td className="px-3 py-1 text-center">
                        <Button
                          size="icon-xs"
                          onClick={(e) => { e.stopPropagation(); handleAdd(product); }}
                          className={cn(
                            'rounded-md',
                            isAdded ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                          )}
                          title="Tambah ke keranjang"
                        >
                          <Plus weight="bold" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </PosTable>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="shrink-0 h-7 flex items-center justify-between px-3 border-t border-border bg-card text-[10px] text-muted-foreground">
              <span>{filtered.length} produk ditemukan</span>
              <span className="flex items-center gap-3">
                <span>↑↓ navigasi</span>
                <span>Enter tambah ke keranjang</span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
