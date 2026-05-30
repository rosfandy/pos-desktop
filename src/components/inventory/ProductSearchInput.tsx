'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProductRow } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { MagnifyingGlass, X } from 'phosphor-react';
import { cn } from '@/lib/utils';

interface ProductSearchInputProps {
  value: string;           // selected productId
  productName: string;     // display name of selected product
  onSelect: (product: ProductRow) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

function unwrapPage(res: unknown): ProductRow[] {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as any;
    if (r.ok && r.data?.data) return r.data.data;
    if (r.ok && Array.isArray(r.data)) return r.data;
  }
  return [];
}

export default function ProductSearchInput({
  value,
  productName,
  onSelect,
  onClear,
  placeholder = 'Cari produk…',
  className,
}: ProductSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search products via API with debounce
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await window.api.productList({ search: q, limit: 20 });
      const data = unwrapPage(res);
      setResults(data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 250);
  };

  const handleSelect = (product: ProductRow) => {
    onSelect(product);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // If product already selected, show chip
  if (value) {
    return (
      <div className={cn('flex items-center gap-1.5 h-8 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-[11px]', className)}>
        <span className="flex-1 truncate text-neutral-800 font-medium">{productName}</span>
        <button
          type="button"
          onClick={handleClear}
          className="text-neutral-400 hover:text-red-500 shrink-0"
          title="Ganti produk"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="h-8 pl-7 text-[11px]!"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">…</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-neutral-200 rounded-md shadow-md max-h-48 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 text-[11px] border-b border-neutral-50 last:border-0"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
            >
              <span className="font-medium text-neutral-800">{p.name}</span>
              {p.sku && <span className="ml-2 text-neutral-400 font-mono">{p.sku}</span>}
              <span className="ml-2 text-neutral-400">stok: {p.stock}</span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.trim() && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-neutral-200 rounded-md shadow-md px-3 py-2 text-[11px] text-neutral-400">
          Produk tidak ditemukan
        </div>
      )}
    </div>
  );
}
