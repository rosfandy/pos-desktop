import { useEffect, useState, useCallback } from 'react';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

export interface UpdateInfo {
  version?: string;
  percent?: number;
  message?: string;
}

export function useAutoUpdater() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [info, setInfo] = useState<UpdateInfo>({});
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!(window as any).api?.onUpdaterEvent) return;

    const cleanup = (window as any).api.onUpdaterEvent(
      (event: string, data: any) => {
        switch (event) {
          case 'updater:checking':
            setStatus('checking');
            setShowDialog(true);
            break;

          case 'updater:available':
            setStatus('available');
            setInfo({ version: data?.version });
            setShowDialog(true);
            break;

          case 'updater:not-available':
            setStatus('not-available');
            setShowDialog(true);
            // Auto-close after 2 detik
            setTimeout(() => setShowDialog(false), 2000);
            break;

          case 'updater:progress':
            setStatus('downloading');
            setInfo({ percent: Math.round(data?.percent ?? 0) });
            break;

          case 'updater:downloaded':
            setStatus('downloaded');
            setInfo({ version: data?.version });
            break;

          case 'updater:error':
            setStatus('error');
            setInfo({ message: data });
            setShowDialog(true);
            break;
        }
      },
    );

    return cleanup;
  }, []);

  const checkUpdate = useCallback(async () => {
    await (window as any).api?.updaterCheck?.();
  }, []);

  const downloadUpdate = useCallback(async () => {
    setStatus('downloading');
    await (window as any).api?.updaterDownload?.();
  }, []);

  const installUpdate = useCallback(() => {
    (window as any).api?.updaterInstall?.();
  }, []);

  const skipUpdate = useCallback(() => {
    setShowDialog(false);
    setStatus('idle');
  }, []);

  return { status, info, showDialog, checkUpdate, downloadUpdate, installUpdate, skipUpdate };
}
