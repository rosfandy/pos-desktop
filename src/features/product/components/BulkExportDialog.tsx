'use client';

import { useState, useCallback, useEffect } from 'react';
import { useProductStore } from '@/stores/productStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Download, FileText, CheckCircle } from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BulkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function BulkExportDialog({ open, onOpenChange }: BulkExportDialogProps) {
  const { products, categories, fetchProducts, fetchCategories } = useProductStore();

  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; filePath?: string; error?: string } | null>(null);

  const activeCategories = categories.filter((c) => c.isActive);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [includeInactive, setIncludeInactive] = useState(false);

  // Fetch products & categories saat dialog dibuka
  useEffect(() => {
    if (!open) return;
    fetchProducts();
    fetchCategories();
  }, [open, fetchProducts, fetchCategories]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await window.api.productExport({
        filter: {
          categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        },
        format,
      });

      if (res.ok && res.data?.success) {
        setResult({ success: true, filePath: res.data.filePath });
      } else if (!res.ok) {
        setResult({ success: false, error: res.error.message });
      } else {
        setResult({ success: false, error: 'Gagal export' });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'Gagal export' });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, includeInactive, format]);

  const handleClose = useCallback(() => {
    setResult(null);
    setFormat('xlsx');
    setCategoryFilter('all');
    setIncludeInactive(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const filteredCount = products.filter((p) => {
    if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false;
    return true;
  }).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Produk
          </DialogTitle>
          <DialogDescription className="text-[12px] text-neutral-500 mt-1">
            Export daftar produk ke file {format === 'xlsx' ? 'Excel (.xlsx)' : 'CSV'}.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* ── Format selection ─────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-neutral-600">Format File</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={format === 'xlsx' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('xlsx')}
                className={cn(
                  'flex-1 gap-1.5',
                  format === 'xlsx' && 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                )}
              >
                <Download className="w-4 h-4" />
                Excel (.xlsx)
              </Button>
              <Button
                type="button"
                variant={format === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('csv')}
                className={cn(
                  'flex-1 gap-1.5',
                  format === 'csv' && 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                )}
              >
                <FileText className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* ── Category filter ─────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-neutral-600">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-9 text-[12px] border border-neutral-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* ── Include inactive ────────────────────────────────────────────────── */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={includeInactive}
              onCheckedChange={(checked) => setIncludeInactive(checked as boolean)}
            />
            <span className="text-[12px] text-neutral-600">Sertakan produk non-aktif</span>
          </label>

          {/* ── Count info ───────────────────────────────────────────────────────── */}
          <p className="text-[11px] text-neutral-400">
            {filteredCount} produk akan di-export
          </p>

          {/* ── Result ───────────────────────────────────────────────────────────── */}
          {result && (
            <div className={cn(
              'flex items-center gap-2 text-[12px] px-3 py-2.5 rounded-md border',
              result.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              {result.success ? (
                <>
                  <CheckCircle weight="fill" className="w-4 h-4 shrink-0" />
                  <span>Export berhasil! File: <strong>{result.filePath?.split('/').pop()}</strong></span>
                </>
              ) : (
                <span>Error: {result.error}</span>
              )}
            </div>
          )}

          {/* ── Loading ──────────────────────────────────────────────────────────── */}
          {loading && (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Mengekspor…
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-[12px]">
            Tutup
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={loading || filteredCount === 0}
            className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            <Download className="w-3 h-3 mr-1" />
            Export {filteredCount} Produk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
