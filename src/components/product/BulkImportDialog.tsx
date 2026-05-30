'use client';

import { useState, useCallback, useRef } from 'react';
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
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Warning,
  FloppyDisk,
  X,
  Spinner,
} from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreviewRow {
  rowIndex: number;
  name: string;
  sku?: string;
  barcode?: string;
  priceSell: number;
  stock: number;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const { fetchProducts, fetchCategories } = useProductStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'idle' | 'preview' | 'result'>('idle');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; errors: Array<{ row: number; message: string }> } | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]); // holds ImportRow[] for commit

  const reset = useCallback(() => {
    setStep('idle');
    setFileName('');
    setPreview([]);
    setTotalRows(0);
    setImportResult(null);
    setPreviewRows([]);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  // ── Phase 1: Parse + Validate (preview) ────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    setLoading(true);
    setFileName(file.name);

    try {
      // Baca file sebagai ArrayBuffer di renderer
      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsArrayBuffer(file);
      });

      const uint8 = new Uint8Array(buffer);
      const result = await window.api.productImportPreview(uint8);

      if (result.ok && result.data) {
        const data = result.data;
        setTotalRows(data.totalRows);
        setPreviewRows(data.rows || []);
        setPreview(
          (data.rows || []).slice(0, 10).map((r: any) => ({
            rowIndex: r.rowIndex,
            name: r.name,
            sku: r.sku,
            barcode: r.barcode,
            priceSell: r.priceSell,
            stock: r.stock,
          }))
        );

        if (data.errors && data.errors.length > 0) {
          setImportResult({
            success: false,
            imported: 0,
            errors: data.errors,
          });
          setStep('result');
        } else {
          setStep('preview');
        }
      } else {
        setImportResult({ success: false, imported: 0, errors: [{ row: 0, message: 'Gagal membaca file' }] });
        setStep('result');
      }
    } catch (err: any) {
      setImportResult({ success: false, imported: 0, errors: [{ row: 0, message: err.message || 'Gagal membaca file' }] });
      setStep('result');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // ── Phase 2: Commit import ─────────────────────────────────────────────────

  const handleConfirmImport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.productImportCommit(previewRows);

      if (result.ok && result.data) {
        const data = result.data;
        setImportResult({
          success: data.success,
          imported: data.imported,
          errors: data.errors || [],
        });

        if (data.success) {
          await fetchProducts();
          await fetchCategories();
        }
      } else {
        setImportResult({ success: false, imported: 0, errors: [{ row: 0, message: 'Gagal mengimport' }] });
      }
    } catch (err: any) {
      setImportResult({ success: false, imported: 0, errors: [{ row: 0, message: err.message || 'Gagal mengimport' }] });
    } finally {
      setLoading(false);
      setStep('result');
    }
  }, [previewRows, fetchProducts, fetchCategories]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[640px] max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Produk Bulk
          </DialogTitle>
          <DialogDescription className="text-[12px] text-neutral-500 mt-1">
            Upload file Excel (.xlsx) atau CSV. Kolom: Nama (wajib), SKU, Barcode, Kategori, Harga Beli, Harga Jual, Stok, Satuan, Min Stok.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* ── Idle: file picker ──────────────────────────────────────────────── */}
          {step === 'idle' && (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
              <FileText className="w-10 h-10 text-neutral-300 mb-3" />
              <p className="text-[12px] text-neutral-600 mb-3">Pilih file Excel atau CSV untuk di-import</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Upload className="w-3.5 h-3.5" />
                Pilih File
              </Button>
              {fileName && <p className="text-[11px] text-neutral-500 mt-2">{fileName}</p>}
            </div>
          )}

          {/* ── Preview ────────────────────────────────────────────────────────── */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-neutral-600">
                  <strong>{totalRows}</strong> baris siap di-import. Menampilkan 10 baris pertama:
                </p>
                <Button variant="ghost" size="xs" onClick={() => setStep('idle')} className="text-[11px] text-neutral-400 hover:text-neutral-600">
                  Pilih file lain
                </Button>
              </div>

              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500">No</th>
                      <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500">Nama</th>
                      <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500">SKU</th>
                      <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 text-right">Harga Jual</th>
                      <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 text-center">Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr key={row.rowIndex} className="border-b border-neutral-100">
                        <td className="px-2 py-1.5 text-[11px] text-neutral-400 tabular-nums">{row.rowIndex}</td>
                        <td className="px-2 py-1.5 text-[11px] text-neutral-800">{row.name}</td>
                        <td className="px-2 py-1.5 text-[11px] text-neutral-500 font-mono">{row.sku || '—'}</td>
                        <td className="px-2 py-1.5 text-[11px] text-right tabular-nums">Rp{row.priceSell.toLocaleString('id-ID')}</td>
                        <td className="px-2 py-1.5 text-[11px] text-center tabular-nums">{row.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalRows > 10 && (
                <p className="text-[10px] text-neutral-400 text-center">Menampilkan 10 dari {totalRows} baris</p>
              )}
            </div>
          )}

          {/* ── Result ──────────────────────────────────────────────────────────── */}
          {step === 'result' && importResult && (
            <div className="space-y-3">
              {importResult.success ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-[12px] px-3 py-3 rounded-md border border-emerald-200">
                  <CheckCircle weight="fill" className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Import berhasil!</p>
                    <p>{importResult.imported} produk berhasil di-import dari {totalRows} baris</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 text-[12px] px-3 py-3 rounded-md border border-red-200">
                    <XCircle weight="fill" className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-semibold">{importResult.imported > 0 ? 'Import sebagian berhasil' : 'Import gagal'}</p>
                      <p>{importResult.errors.length} error, {importResult.imported} berhasil di-import</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-red-200 rounded-md bg-red-50/50">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="px-3 py-2 border-b border-red-100 last:border-b-0 flex items-start gap-2">
                          <Warning className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-red-700">Baris {err.row}: {err.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Loading ─────────────────────────────────────────────────────────── */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Spinner className="w-5 h-5 text-indigo-500 animate-spin" />
              <span className="text-[12px] text-neutral-500 ml-2">Memproses…</span>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-[10px] text-neutral-400">
            Kolom: Nama (wajib), SKU, Barcode, Kategori, Harga Beli, Harga Jual, Stok, Satuan, Min Stok
          </p>
          <div className="flex items-center gap-2">
            {step === 'preview' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setStep('idle')} className="h-8 text-[12px]">
                  <X className="w-3 h-3 mr-1" />
                  Batal
                </Button>
                <Button size="sm" onClick={handleConfirmImport} disabled={loading} className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white">
                  <FloppyDisk className="w-3 h-3 mr-1" />
                  Import {totalRows} Produk
                </Button>
              </>
            )}
            {(step === 'result' || step === 'idle') && (
              <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-[12px]">
                {step === 'result' && importResult?.success ? 'Selesai' : 'Tutup'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
