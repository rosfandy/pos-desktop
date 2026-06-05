'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WarningCircle, CaretDown, CaretUp, Spinner } from 'phosphor-react';
import { useSettingsStore } from '@/stores/settingsStore';

export interface LowStockWidgetProps {
  className?: string;
}

export default function LowStockWidget({ className }: LowStockWidgetProps) {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Array<{ id: string; name: string; stock: number; minStock: number; baseUnit: string }>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // ── Fetch total count (cheap, untuk badge) ─────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const { minStockThreshold } = useSettingsStore.getState();
      const threshold = minStockThreshold > 0 ? minStockThreshold : undefined;
      const res = await window.api.productLowStock(threshold);
      if (res?.ok && Array.isArray(res.data)) {
        setCount(res.data.length);
      } else {
        setCount(0);
      }
    } catch {
      setCount(0);
    }
  }, []);

  // ── Fetch paginated low-stock items via productList ────────────────────────
  const fetchItems = useCallback(async (cursor?: string) => {
    try {
      const { minStockThreshold } = useSettingsStore.getState();
      const threshold = minStockThreshold > 0 ? minStockThreshold : undefined;
      const filter: Record<string, any> = { lowStock: true, limit: 10 };
      if (threshold) filter.lowStockThreshold = threshold;
      if (cursor) filter.cursor = cursor;

      const res = await window.api.productList(filter);
      if (res?.ok && res.data) {
        const newItems = res.data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          baseUnit: p.baseUnit,
        }));
        return { items: newItems, nextCursor: res.data.nextCursor, hasMore: res.data.hasMore };
      }
    } catch {
      // ignore
    }
    return { items: [], nextCursor: null, hasMore: false };
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    await Promise.all([fetchCount(), fetchItems().then((r) => {
      setItems(r.items);
      setNextCursor(r.nextCursor);
      setHasMore(r.hasMore);
    })]);
    setInitialLoading(false);
  }, [fetchCount, fetchItems]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ── Load more (infinite scroll) ────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !nextCursor) return;
    setLoadingMore(true);
    const result = await fetchItems(nextCursor);
    setItems((prev) => [...prev, ...result.items]);
    setNextCursor(result.nextCursor);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }, [nextCursor, loadingMore, fetchItems]);

  // ── IntersectionObserver untuk sentinel ────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!expanded || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, hasMore, loadMore]);

  // ── Expose refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(false);
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    (window as any).__refreshLowStockWidget = refresh;
    return () => { delete (window as any).__refreshLowStockWidget; };
  }, [refresh]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (count === 0 && !expanded) return null;

  return (
    <div className={cn('relative inline-flex', className)}>
      {/* Trigger button */}
      <Button
        variant="outline"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium',
          count > 0
            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
        )}
      >
        <WarningCircle className={cn('w-3.5 h-3.5', count > 0 ? 'text-red-500' : 'text-neutral-400')} />
        {initialLoading ? '…' : `${count} stok rendah`}
        {count > 0 && (expanded ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
      </Button>

      {/* Expanded dropdown */}
      {expanded && (
        <div className="absolute left-0 top-full mt-1 w-80 bg-popover text-popover-foreground border border-border rounded-md shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-700">Produk Stok Rendah</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={refresh}
              disabled={initialLoading}
              className="text-[10px] text-indigo-600 hover:text-indigo-700"
            >
              {initialLoading ? '…' : 'Refresh'}
            </Button>
          </div>

          {/* Item list with infinite scroll */}
          <div className="max-h-64 overflow-y-auto">
            {items.length === 0 && !initialLoading && (
              <div className="px-3 py-4 text-center text-[11px] text-neutral-400">Semua stok aman</div>
            )}

            {items.length > 0 && (
              <div className="divide-y divide-neutral-50">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      navigate(`/inventory?tab=in&productId=${item.id}`);
                      setExpanded(false);
                    }}
                    className="px-3 py-2 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <p className="text-[12px] font-medium text-neutral-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-red-500 tabular-nums">
                      Stok: {item.stock} {item.baseUnit} &nbsp;·&nbsp; Min: {item.minStock} {item.baseUnit}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Loading indicator for more */}
            {loadingMore && (
              <div className="flex items-center justify-center py-2">
                <Spinner className="w-3 h-3 text-indigo-400 animate-spin" />
                <span className="ml-1.5 text-[10px] text-neutral-400">Memuat…</span>
              </div>
            )}

            {/* Sentinel untuk infinite scroll — hanya jika hasMore */}
            {hasMore && <div ref={sentinelRef} className="h-2" />}
          </div>
        </div>
      )}
    </div>
  );
}
