'use client';

import { useState, useEffect, useCallback } from 'react';
import InlineProductTable from '@/features/product/components/InlineProductTable';
import InlineCategoryTable from '@/features/product/components/InlineCategoryTable';
import BulkImportDialog from '@/features/product/components/BulkImportDialog';
import BulkExportDialog from '@/features/product/components/BulkExportDialog';
import { cn } from '@/lib/utils';
import type { ProductCounts, CategoryRow } from '@/lib/api';
import {
  Package,
  Tag,
  Upload,
  Download,
  List,
} from 'phosphor-react';
import {
  PosPage, PosToolbar, PosToolbarTitle,
  PosSideMenu, PosSideMenuHeader, PosSideMenuNav, PosSideMenuItem,
  PosPanel, PosButton,
} from '@/components/ui/pos-ui';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T; error?: { code: string; message: string } };
    if (r.ok && r.data !== undefined) return r.data as T;
  }
  return (fallback ?? null) as T | null;
}

type ActiveTab = 'products' | 'categories';

const TABS: { id: ActiveTab; label: string; icon: React.ElementType; tone: 'indigo' | 'amber' }[] = [
  { id: 'products',   label: 'Produk',   icon: Package, tone: 'indigo' },
  { id: 'categories', label: 'Kategori', icon: Tag,     tone: 'amber' },
];

const TAB_TITLES: Record<ActiveTab, string> = {
  products:   'Manajemen Produk',
  categories: 'Manajemen Kategori',
};

export default function ProductPage() {
  const [counts, setCounts] = useState<ProductCounts>({ total: 0, active: 0, lowStock: 0 });
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [productRefreshKey, setProductRefreshKey] = useState(0);

  const loadCounts = useCallback(async () => {
    try {
      const res: any = await window.api.productCount();
      const data = unwrap<ProductCounts>(res, { total: 0, active: 0, lowStock: 0 });
      if (data) setCounts(data);
    } catch { /* ignore */ }
  }, []);

  const handleImportOpenChange = useCallback((open: boolean) => {
    setShowImportDialog(open);
    if (!open) {
      loadCounts();
      setProductRefreshKey((k) => k + 1);
    }
  }, [loadCounts]);

  const loadCategories = useCallback(async () => {
    try {
      const res: any = await window.api.categoryList();
      const data = unwrap<CategoryRow[]>(res, []);
      setCategories(data ?? []);
    } catch { setCategories([]); }
  }, []);

  useEffect(() => {
    loadCounts();
    loadCategories();
  }, [loadCounts, loadCategories]);

  const renderContent = () => {
    switch (activeTab) {
      case 'products':   return <InlineProductTable refreshKey={productRefreshKey} />;
      case 'categories': return <InlineCategoryTable />;
    }
  };

  return (
    <PosPage>
      {/* ── Side menu ───────────────────────────────────────────────────── */}
      <PosSideMenu className="w-40">
        <PosSideMenuHeader>
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Master</span>
        </PosSideMenuHeader>
        <PosSideMenuNav>
          {TABS.map(({ id, label, icon: Icon, tone }) => {
            const active = activeTab === id;
            const count = id === 'products' ? counts.total : categories.length;
            return (
              <PosSideMenuItem
                key={id}
                active={active}
                onClick={() => setActiveTab(id)}
                className={cn(
                  active && (tone === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200')
                )}
              >
                <Icon weight={active ? 'fill' : 'regular'} className={cn('w-3.5 h-3.5 shrink-0', tone === 'amber' ? 'text-amber-500' : 'text-indigo-500')} />
                {label}
                <span className={cn(
                  'ml-auto text-[10px] px-1.5 py-0.5 tabular-nums font-semibold',
                  tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                )}>
                  {count}
                </span>
              </PosSideMenuItem>
            );
          })}
        </PosSideMenuNav>

        {/* ── Stats footer ─────────────────────────────────────────────── */}
        <div className="mt-auto px-3 py-2 border-t border-neutral-200 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <List className="w-3 h-3 text-neutral-500" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Ringkasan</span>
          </div>
          {activeTab === 'products' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-500">Total kategori</span>
                <span className="text-neutral-800 font-medium tabular-nums">{categories.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-500">Aktif</span>
                <span className="text-emerald-600 font-medium tabular-nums">{categories.filter((c) => c.isActive).length}</span>
              </div>
            </>
          )}
        </div>
      </PosSideMenu>

      {/* ── Content panel ──────────────────────────────────────────────── */}
      <PosPanel className="m-2">
        {/* Panel header */}
        <PosToolbar>
          {activeTab === 'products' ? (
            <Package weight="fill" className="w-3.5 h-3.5 text-indigo-600 mr-2" />
          ) : (
            <Tag weight="fill" className="w-3.5 h-3.5 text-amber-600 mr-2" />
          )}
          <PosToolbarTitle>{TAB_TITLES[activeTab]}</PosToolbarTitle>

          <div className="flex-1" />

          {activeTab === 'products' && (
            <div className="flex items-center gap-1.5">
              <PosButton variant="secondary" onClick={() => setShowExportDialog(true)}>
                <Download className="w-3 h-3" />
                Export
              </PosButton>
              <PosButton variant="secondary" onClick={() => setShowImportDialog(true)}>
                <Upload className="w-3 h-3" />
                Import
              </PosButton>
            </div>
          )}
        </PosToolbar>

        {/* Panel body */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderContent()}
        </div>
      </PosPanel>

      {/* Dialogs */}
      <BulkImportDialog open={showImportDialog} onOpenChange={handleImportOpenChange} />
      <BulkExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
    </PosPage>
  );
}
