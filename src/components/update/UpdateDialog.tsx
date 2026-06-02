'use client';

import { ArrowDown, CheckCircle, Spinner, DownloadSimple, ArrowCounterClockwise, X, CloudCheck, CloudSlash } from 'phosphor-react';
import { cn } from '@/lib/utils';

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

const STATUS_META: Record<UpdateStatus, { icon: typeof ArrowDown; color: string; title: string; subtitle: string }> = {
  'idle':           { icon: CloudCheck,    color: 'text-neutral-400', title: 'Update Aplikasi',     subtitle: 'Siap memeriksa pembaruan' },
  'checking':       { icon: Spinner,       color: 'text-indigo-500',  title: 'Memeriksa…',          subtitle: 'Menghubungi server pembaruan' },
  'available':      { icon: ArrowDown,     color: 'text-indigo-600',  title: 'Update Tersedia',     subtitle: 'Versi baru siap diunduh' },
  'not-available':  { icon: CloudCheck,    color: 'text-emerald-600', title: 'Versi Terbaru',       subtitle: 'Aplikasi sudah versi terbaru' },
  'downloading':    { icon: DownloadSimple,color: 'text-indigo-600',  title: 'Mengunduh…',          subtitle: 'Sedang mengunduh pembaruan' },
  'downloaded':     { icon: CheckCircle,   color: 'text-emerald-600', title: 'Siap Dipasang',       subtitle: 'Pembaruan telah diunduh' },
  'error':          { icon: CloudSlash,    color: 'text-red-600',     title: 'Gagal Memperbarui',   subtitle: 'Tidak dapat memeriksa pembaruan' },
};

export default function UpdateDialog({ open, status, info, onClose, onDownload, onInstall }: UpdateDialogProps) {
  if (!open) return null;

  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const isSpinning = status === 'checking' || status === 'downloading';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-[1px]">
      <div className="w-[400px] bg-card text-card-foreground border border-border flex flex-col">

        {/* Toolbar */}
        <div className="h-9 flex items-center justify-between px-3 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <Icon weight="bold" className={cn('w-4 h-4', meta.color, isSpinning && 'animate-spin')} />
            <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">
              {meta.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3">

          {/* Status row */}
          <div className="flex items-start gap-3 px-3 py-2.5 bg-neutral-50 border border-neutral-200">
            <Icon weight="fill" className={cn('w-5 h-5 mt-0.5 shrink-0', meta.color, isSpinning && 'animate-spin')} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-neutral-900 leading-tight">{meta.subtitle}</p>
              {status === 'available' && info.version && (
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Versi <span className="font-mono font-semibold text-indigo-700">{info.version}</span> siap diunduh.
                </p>
              )}
              {status === 'downloaded' && info.version && (
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Versi <span className="font-mono font-semibold text-emerald-700">{info.version}</span> telah diunduh.
                </p>
              )}
              {status === 'error' && info.message && (
                <p className="text-[11px] text-red-600 mt-0.5 leading-snug">{info.message}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {status === 'downloading' && info.percent !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500">Progress</span>
                <span className="text-[10px] font-mono font-semibold text-indigo-700 tabular-nums">{info.percent}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-sm h-1.5 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${info.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Changelog / extra info for available */}
          {status === 'available' && (
            <div className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-700">
              <span className="font-semibold">Disarankan:</span> backup data sebelum update.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 flex items-center justify-end gap-2 px-3 border-t border-neutral-200 bg-neutral-50">
          {status === 'available' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-7 px-3 rounded text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                Nanti
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="h-7 px-3 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <DownloadSimple className="w-3.5 h-3.5" weight="bold" />
                Unduh Sekarang
              </button>
            </>
          )}

          {status === 'downloaded' && (
            <button
              type="button"
              onClick={onInstall}
              className="h-7 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowCounterClockwise className="w-3.5 h-3.5" weight="bold" />
              Restart & Pasang
            </button>
          )}

          {(status === 'checking' || status === 'downloading') && (
            <button
              type="button"
              disabled
              className="h-7 px-3 rounded bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-400 cursor-not-allowed flex items-center gap-1.5"
            >
              <Spinner className="w-3.5 h-3.5 animate-spin" />
              {status === 'checking' ? 'Memeriksa…' : 'Mengunduh…'}
            </button>
          )}

          {(status === 'not-available' || status === 'error' || status === 'idle') && (
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 rounded bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
