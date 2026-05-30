'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileXls, FileCsv, Download, XCircle, CheckCircle, Spinner } from 'phosphor-react';

interface BulkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkExportDialog({ open, onOpenChange }: BulkExportDialogProps) {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; filePath?: string; error?: string } | null>(null);
  const [customerCount, setCustomerCount] = useState<number>(0);

  // Hitung jumlah customer yg akan di-export saat dialog terbuka
  useEffect(() => {
    if (open) {
      setResult(null);
      setLoading(true);
      window.api.customerList({}).then((res: any) => {
        if (res.ok && Array.isArray(res.data)) {
          setCustomerCount(res.data.length);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [open]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await window.api.customerExport({
        format,
      });

      if (res.ok) {
        setResult({ success: true, filePath: res.data.filePath });
      } else {
        setResult({ success: false, error: (res as any).error?.message || 'Gagal export' });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'Gagal export' });
    } finally {
      setLoading(false);
    }
  }, [format]);

  const handleClose = useCallback(() => {
    setResult(null);
    setLoading(false);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[420px] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            Export Pelanggan
          </DialogTitle>
          <DialogDescription className="text-[12px] text-neutral-500 mt-1">
            Pilih format, lalu export data pelanggan.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {result ? (
            result.success ? (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
                <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-emerald-700">Export berhasil!</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5 break-all">{result.filePath}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                <XCircle weight="fill" className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-red-700">Export gagal</p>
                  <p className="text-[11px] text-red-600 mt-0.5">{result.error}</p>
                </div>
              </div>
            )
          ) : (
            <>
              {/* ── Format ─────────────────────────────────────────────── */}
              <div>
                <label className="text-[11px] font-medium text-neutral-600 mb-2 block">Format file</label>
                <div className="flex gap-2">
                  <Button
                    variant={format === 'xlsx' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormat('xlsx')}
                    className={`h-8 text-[12px] ${format === 'xlsx' ? 'bg-emerald-600' : ''}`}
                  >
                    <FileXls className="w-3.5 h-3.5 mr-1" />
                    Excel (.xlsx)
                  </Button>
                  <Button
                    variant={format === 'csv' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormat('csv')}
                    className={`h-8 text-[12px] ${format === 'csv' ? 'bg-emerald-600' : ''}`}
                  >
                    <FileCsv className="w-3.5 h-3.5 mr-1" />
                    CSV (.csv)
                  </Button>
                </div>
              </div>

              {/* ── Count ─────────────────────────────────────────────── */}
              {loading ? (
                <div className="flex items-center gap-2 text-[12px] text-neutral-400">
                  <Spinner className="w-3.5 h-3.5 animate-spin" />
                  Menghitung data…
                </div>
              ) : (
                <p className="text-[12px] text-neutral-500">
                  {customerCount} pelanggan akan di-export.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-neutral-200">
          {result ? (
            <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-[12px]">
              Tutup
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full justify-end">
              <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-[12px]">
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={loading || customerCount === 0}
                className="h-8 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  <><Spinner className="w-3.5 h-3.5 animate-spin mr-1" /> Export…</>
                ) : (
                  <><Download className="w-3.5 h-3.5 mr-1" /> Export</>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
