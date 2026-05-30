'use client';

import { useState, useEffect, useCallback } from 'react';
import InlineProductTable from '@/components/product/InlineProductTable';
import InlineCategoryTable from '@/components/product/InlineCategoryTable';
import BulkImportDialog from '@/components/product/BulkImportDialog';
import BulkExportDialog from '@/components/product/BulkExportDialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ProductCounts, CategoryRow } from '@/lib/api';
import {
  Package,
  Tag,
  Upload,
  Download,
} from 'phosphor-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T; error?: { code: string; message: string } };
    if (r.ok && r.data !== undefined) return r.data as T;
  }
  return (fallback ?? null) as T | null;
}

type ActiveTab = 'products' | 'categories';

export default function ProductPage() {
  const [counts, setCounts] = useState<ProductCounts>({ total: 0, active: 0, lowStock: 0 });
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Load product counts (total, active, lowStock) — 1 cheap query, no rows loaded
  const loadCounts = useCallback(async () => {
    try {
      const res: any = await window.api.productCount();
      const data = unwrap<ProductCounts>(res, { total: 0, active: 0, lowStock: 0 });
      if (data) setCounts(data);
    } catch {
      // ignore
    }
  }, []);

  // Load categories for stats + InlineCategoryTable
  const loadCategories = useCallback(async () => {
    try {
      const res: any = await window.api.categoryList();
      const data = unwrap<CategoryRow[]>(res, []);
      setCategories(data ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadCounts();
    loadCategories();
  }, [loadCounts, loadCategories]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="shrink-0 h-9 flex items-center justify-between px-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-1.5">
          {activeTab === 'products' ? (
            <Package weight="fill" className="w-4 h-4 text-indigo-500" />
          ) : (
            <Tag weight="fill" className="w-4 h-4 text-amber-500" />
          )}
          <h1 className="text-[13px] font-semibold text-neutral-800">
            {activeTab === 'products' ? 'Manajemen Produk' : 'Manajemen Kategori'}
          </h1>
        </div>

        {activeTab === 'products' && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowExportDialog(true)}
              className="h-7 px-2 text-[10px]"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowImportDialog(true)}
              className="h-7 px-2 text-[10px]"
            >
              <Upload className="w-3 h-3" />
              Import
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── Content: sidebar + table ─────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-40 shrink-0 bg-white border-r border-neutral-200 flex flex-col">
          <nav className="flex flex-col">
            <Button
              onClick={() => setActiveTab('products')}
              variant="ghost"
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors border-l-[3px] justify-start rounded-none',
                activeTab === 'products'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-600'
                  : 'text-neutral-600 hover:bg-neutral-50 border-transparent'
              )}
            >
              <Package className="w-3.5 h-3.5" />
              Produk
              <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full tabular-nums">
                {counts.total}
              </span>
            </Button>
            <Button
              onClick={() => setActiveTab('categories')}
              variant="ghost"
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors border-l-[3px] justify-start rounded-none',
                activeTab === 'categories'
                  ? 'bg-amber-50 text-amber-700 border-amber-600'
                  : 'text-neutral-600 hover:bg-neutral-50 border-transparent'
              )}
            >
              <Tag className="w-3.5 h-3.5" />
              Kategori
              <span className="ml-auto text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full tabular-nums">
                {categories.length}
              </span>
            </Button>
          </nav>

          {/* ── Sidebar stats ──────────────────────────────────────── */}
          <div className="mt-auto px-3 py-2 border-t border-neutral-100">
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1.5">Ringkasan</p>
            {activeTab === 'products' ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-500">Total produk</span>
                  <span className="text-neutral-800 font-medium tabular-nums">{counts.total}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-500">Aktif</span>
                  <span className="text-emerald-600 font-medium tabular-nums">{counts.active}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-500">Stok rendah</span>
                  <span className="text-red-500 font-medium tabular-nums">{counts.lowStock}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-500">Total kategori</span>
                  <span className="text-neutral-800 font-medium tabular-nums">{categories.length}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-500">Aktif</span>
                  <span className="text-emerald-600 font-medium tabular-nums">{categories.filter((c) => c.isActive).length}</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 bg-white">
          {activeTab === 'products' ? (
            <InlineProductTable />
          ) : (
            <InlineCategoryTable />
          )}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── Dialogs ─────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <BulkImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
      <BulkExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
    </div>
  );
}