'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, File as FileIcon, CheckCircle, XCircle, Spinner, Warning } from 'phosphor-react';
import type { CustomerImportRow } from '@/lib/api';

const MAX_PREVIEW_ROWS = 10;

type Step = 'idle' | 'preview' | 'importing' | 'result';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export default function BulkImportDialog({ open, onOpenChange, onImportComplete }: BulkImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [allRows, setAllRows] = useState<CustomerImportRow[]>([]); // full rows for commit
  const [previewRows, setPreviewRows] = useState<CustomerImportRow[]>([]); // first 10 for display
  const [totalRows, setTotalRows] = useState(0);
  const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [result, setResult] = useState<{ success: boolean; imported: number; totalRows: number; errors: Array<{ row: number; message: string }> } | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setStep('idle');
    setFileName('');
    setAllRows([]);
    setPreviewRows([]);
    setTotalRows(0);
    setErrors([]);
    setResult(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  // ── File Selection ─────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setStep('preview');

    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      const res: any = await window.api.customerImportPreview(uint8);
      if (res.ok && res.data) {
        const fullRows = res.data.rows ?? [];
        setAllRows(fullRows);
        setTotalRows(res.data.totalRows ?? 0);
        setErrors(res.data.errors ?? []);
        setPreviewRows(fullRows.slice(0, MAX_PREVIEW_ROWS));
      } else {
        setErrors([{ row: 0, message: res.error?.message || 'Gagal membaca file' }]);
        setAllRows([]);
        setPreviewRows([]);
        setTotalRows(0);
      }
    } catch (err: any) {
      setErrors([{ row: 0, message: err.message || 'Gagal membaca file' }]);
      setAllRows([]);
      setPreviewRows([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Commit Import ──────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    setStep('importing');
    setLoading(true);

    try {
      const res: any = await window.api.customerImportCommit(allRows);
      if (res.ok && res.data) {
        setResult({
          success: res.data.success,
          imported: res.data.imported,
          totalRows: res.data.totalRows,
          errors: res.data.errors ?? [],
        });
      } else {
        setResult({
          success: false,
          imported: 0,
          totalRows,
          errors: [{ row: 0, message: res.error?.message || 'Gagal mengimport' }],
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        imported: 0,
        totalRows,
        errors: [{ row: 0, message: err.message || 'Gagal mengimport' }],
      });
    } finally {
      setLoading(false);
      setStep('result');
    }
  }, [allRows, totalRows]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            Import Pelanggan
          </DialogTitle>
          <DialogDescription className="text-[12px] text-neutral-500 mt-1">
            Unggah file Excel (.xlsx) atau CSV untuk menambahkan pelanggan secara massal.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* ── Step: idle ────────────────────────────────────────────── */}
          {step === 'idle' && !loading && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-neutral-300 rounded-lg px-6 py-10 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-[13px] font-medium text-neutral-600">Klik untuk pilih file</p>
                <p className="text-[11px] text-neutral-400 mt-1">Format: .xlsx atau .csv</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* ── Step: preview ─────────────────────────────────────────── */}
          {step === 'preview' && !loading && (
            <div className="space-y-3">
              {/* File info */}
              <div className="flex items-center gap-2 text-[12px] text-neutral-600 bg-neutral-50 px-3 py-2 rounded-md border border-neutral-200">
                <FileIcon className="w-4 h-4 text-neutral-400" />
                {fileName}
                <span className="text-neutral-300 mx-1">|</span>
                {totalRows} baris ditemukan
              </div>

              {/* Validation errors */}
              {errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-amber-700 mb-1">
                    <Warning className="w-4 h-4" />
                    {errors.length} peringatan / error
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                    {errors.slice(0, 20).map((err, i) => (
                      <p key={i} className="text-[11px] text-amber-600">
                        {err.row > 0 ? `Baris ${err.row}: ` : ''}{err.message}
                      </p>
                    ))}
                    {errors.length > 20 && (
                      <p className="text-[11px] text-amber-500">…dan {errors.length - 20} lainnya</p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-neutral-500 mb-2">
                    Preview ({Math.min(previewRows.length, MAX_PREVIEW_ROWS)} dari {totalRows} baris):
                  </p>
                  <div className="overflow-x-auto border border-neutral-200 rounded-md">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-500">
                          <th className="text-left px-2 py-1.5 font-medium border-b border-neutral-200 w-10">#</th>
                          <th className="text-left px-2 py-1.5 font-medium border-b border-neutral-200">Nama</th>
                          <th className="text-left px-2 py-1.5 font-medium border-b border-neutral-200">Telepon</th>
                          <th className="text-left px-2 py-1.5 font-medium border-b border-neutral-200">Email</th>
                          <th className="text-right px-2 py-1.5 font-medium border-b border-neutral-200">Poin</th>
                          <th className="text-center px-2 py-1.5 font-medium border-b border-neutral-200">Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50">
                            <td className="px-2 py-1.5 text-neutral-400">{row.rowIndex}</td>
                            <td className="px-2 py-1.5 font-medium text-neutral-800">{row.name}</td>
                            <td className="px-2 py-1.5 text-neutral-600 font-mono">{row.phone || '-'}</td>
                            <td className="px-2 py-1.5 text-neutral-600">{row.email || '-'}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{row.points.toLocaleString('id-ID')}</td>
                            <td className="px-2 py-1.5 text-center">
                              <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                                {row.tier}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step: importing ───────────────────────────────────────── */}
          {step === 'importing' && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Spinner className="w-5 h-5 text-indigo-500 animate-spin" />
              <span className="text-[13px] text-neutral-600">Mengimport data…</span>
            </div>
          )}

          {/* ── Step: result ──────────────────────────────────────────── */}
          {step === 'result' && result && (
            <div className="space-y-3">
              {result.success ? (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
                  <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-medium text-emerald-700">Import berhasil!</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      {result.imported} dari {result.totalRows} pelanggan berhasil diimport.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                  <XCircle weight="fill" className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-medium text-red-700">Import gagal</p>
                    <p className="text-[11px] text-red-600 mt-0.5">
                      {result.imported} dari {result.totalRows} berhasil diimport.
                    </p>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="max-h-[160px] overflow-y-auto border border-neutral-200 rounded-md">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-500">
                        <th className="text-left px-2 py-1.5 font-medium border-b border-neutral-200 w-10">Baris</th>
                        <th className="text-left px-2 py-1.5 font-medium border-b border-neutral-200">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i} className="border-b border-neutral-100 last:border-b-0">
                          <td className="px-2 py-1.5 text-neutral-400">{err.row > 0 ? err.row : '-'}</td>
                          <td className="px-2 py-1.5 text-red-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Loading state ─────────────────────────────────────────── */}
          {loading && step === 'preview' && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Spinner className="w-5 h-5 text-indigo-500 animate-spin" />
              <span className="text-[13px] text-neutral-600">Membaca file…</span>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-neutral-200">
          {step === 'idle' && (
            <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-[12px]">
              Tutup
            </Button>
          )}

          {step === 'preview' && !loading && (
            <div className="flex items-center gap-2 w-full justify-end">
              <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-[12px]">
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-[12px]"
                variant="outline"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                Ganti File
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={totalRows === 0}
                className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {errors.length > 0 ? (
                  <>Import {totalRows} Data (abaikan error)</>
                ) : (
                  <><Upload className="w-3.5 h-3.5 mr-1" /> Import {totalRows} Data</>
                )}
              </Button>
            </div>
          )}

          {step === 'importing' && (
            <Button variant="outline" size="sm" disabled className="h-8 text-[12px]">
              <Spinner className="w-3.5 h-3.5 animate-spin mr-1" />
              Mengimport…
            </Button>
          )}

          {step === 'result' && (
            <div className="flex items-center gap-2 w-full justify-end">
              <Button
                size="sm"
                onClick={() => {
                  reset();
                  onImportComplete?.();
                  handleClose();
                }}
                className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Selesai
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
