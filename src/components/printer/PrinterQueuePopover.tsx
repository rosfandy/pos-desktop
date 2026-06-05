import { useEffect, useState, useRef } from 'react';
import { Printer, XCircle, Spinner, Warning } from 'phosphor-react';
import { cn, unwrap } from '@/lib/utils';
import type { PrintJobInfo } from '@/lib/api';

interface PrinterQueuePopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('error') || s.includes('stuck')) return 'bg-red-100 text-red-700';
  if (s.includes('pause') || s.includes('hold'))  return 'bg-amber-100 text-amber-700';
  if (s.includes('print') || s.includes('spool'))  return 'bg-blue-100 text-blue-700';
  if (s.includes('delet') || s.includes('offline')) return 'bg-neutral-100 text-neutral-500';
  return 'bg-neutral-100 text-neutral-600';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(submittedAt: string | null): string {
  if (!submittedAt) return '-';
  try {
    const d = new Date(submittedAt);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return submittedAt;
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PrinterQueuePopover({ open, onClose, anchorRef }: PrinterQueuePopoverProps) {
  const [jobs, setJobs] = useState<PrintJobInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch queue
  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.api.printerQueueList();
      const data = unwrap<PrintJobInfo[]>(res);
      setJobs(data ?? []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat antrian printer');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchQueue();
      // Auto-refresh every 3 seconds while open
      const id = setInterval(fetchQueue, 3000);
      return () => clearInterval(id);
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, anchorRef]);

  // Cancel a job
  const handleCancel = async (jobId: string) => {
    setCancellingId(jobId);
    try {
      await window.api.printerQueueCancel(jobId);
      await fetchQueue();
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-8 right-0 w-96 bg-card text-card-foreground border border-border shadow-lg z-50 max-h-80 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Printer weight="fill" className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
            Antrian Printer
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchQueue}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 hover:bg-muted transition-colors"
            title="Muat ulang"
          >
            ↻
          </button>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground px-1"
            title="Tutup"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && jobs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Spinner className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="text-[11px] text-muted-foreground">Memuat antrian…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <Warning weight="fill" className="w-6 h-6 text-amber-400" />
            <p className="text-[11px] text-muted-foreground">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Printer className="w-6 h-6 text-muted-foreground/40" />
            <p className="text-[11px] text-muted-foreground">Tidak ada antrian cetak</p>
            <p className="text-[10px] text-muted-foreground/60">Antrian printer kosong</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((job) => (
              <div key={job.id} className="px-3 py-2 hover:bg-muted/30 transition-colors group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate" title={job.documentName}>
                      {job.documentName || '(tanpa nama)'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-[10px] px-1 py-0.5 rounded font-medium', statusBadgeClass(job.status))}>
                        {job.status || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {job.pages} hlm
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {formatSize(job.sizeBytes)}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                      {formatTime(job.submittedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancel(job.id)}
                    disabled={cancellingId === job.id}
                    className={cn(
                      'shrink-0 p-1 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100',
                      cancellingId === job.id && 'opacity-100 animate-pulse'
                    )}
                    title="Batalkan antrian"
                  >
                    {cancellingId === job.id ? (
                      <Spinner className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
