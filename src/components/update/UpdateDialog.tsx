'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowDown, CheckCircle, Spinner, XCircle } from 'phosphor-react';

export interface UpdateInfo {
  version?: string;
  percent?: number;
  message?: string;
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

interface UpdateDialogProps {
  open: boolean;
  status: UpdateStatus;
  info: UpdateInfo;
  onClose: () => void;
  onDownload: () => void;
  onInstall: () => void;
}

export default function UpdateDialog({ open, status, info, onClose, onDownload, onInstall }: UpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[420px] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-indigo-600" />
            Update Aplikasi
          </DialogTitle>
          <DialogDescription className="text-[12px] text-neutral-500 mt-1">
            {status === 'checking' && 'Memeriksa pembaruan…'}
            {status === 'available' && `Versi ${info.version} tersedia`}
            {status === 'not-available' && 'Aplikasi sudah versi terbaru'}
            {status === 'downloading' && 'Mengunduh pembaruan…'}
            {status === 'downloaded' && 'Pembaruan siap dipasang'}
            {status === 'error' && 'Gagal memeriksa pembaruan'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {status === 'checking' && (
            <div className="flex items-center gap-3 py-4">
              <Spinner className="w-5 h-5 text-indigo-500 animate-spin" />
              <p className="text-[12px] text-neutral-600">Memeriksa pembaruan…</p>
            </div>
          )}

          {status === 'available' && (
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-md px-4 py-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <ArrowDown weight="fill" className="w-5 h-5" />
                  <span className="text-[13px] font-semibold">Update tersedia!</span>
                </div>
                <p className="text-[11px] text-indigo-600 mt-1">
                  Versi <strong>{info.version}</strong> siap diunduh.
                </p>
              </div>
            </div>
          )}

          {status === 'not-available' && (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500" />
              <p className="text-[12px] text-neutral-600">Aplikasi sudah menggunakan versi terbaru.</p>
            </div>
          )}

          {status === 'downloading' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Spinner className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-[12px] text-neutral-600">Mengunduh pembaruan…</span>
              </div>
              {info.percent !== undefined && (
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${info.percent}%` }}
                  />
                </div>
              )}
              {info.percent !== undefined && (
                <p className="text-[10px] text-neutral-400 text-right tabular-nums">{info.percent}%</p>
              )}
            </div>
          )}

          {status === 'downloaded' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle weight="fill" className="w-5 h-5" />
                <span className="text-[13px] font-semibold">Siap dipasang!</span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">
                Versi {info.version} telah diunduh. Restart untuk memasang.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-3 py-4">
              <XCircle weight="fill" className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-[12px] text-red-600 font-medium">Gagal memeriksa pembaruan</p>
                {info.message && <p className="text-[11px] text-red-500 mt-0.5">{info.message}</p>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-2">
          {status === 'available' && (
            <>
              <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-[12px]">
                Skip
              </Button>
              <Button size="sm" onClick={onDownload} className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white">
                <ArrowDown className="w-3 h-3 mr-1" />
                Update Sekarang
              </Button>
            </>
          )}

          {status === 'downloaded' && (
            <Button size="sm" onClick={onInstall} className="h-8 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Restart & Pasang
            </Button>
          )}

          {(status === 'checking' || status === 'downloading') && (
            <Button variant="outline" size="sm" disabled className="h-8 text-[12px]">
              {status === 'checking' ? 'Memeriksa…' : 'Mengunduh…'}
            </Button>
          )}

          {(status === 'not-available' || status === 'error') && (
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-[12px]">
              Tutup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
