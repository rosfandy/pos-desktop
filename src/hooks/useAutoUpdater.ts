import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface UpdateInfo {
  version?: string;
  percent?: number;
  message?: string;
}

export function useAutoUpdater() {
  const [status, setStatus] = useState<UpdaterStatus>('idle');
  const [info, setInfo] = useState<UpdateInfo>({});

  useEffect(() => {
    if (!(window as any).api?.onUpdaterEvent) return;

    const cleanup = (window as any).api.onUpdaterEvent(
      (event: string, data: any) => {
        switch (event) {
          case 'updater:checking':
            setStatus('checking');
            break;

          case 'updater:available':
            setStatus('available');
            setInfo({ version: data?.version });
            toast({
              title: 'Update tersedia',
              description: `Versi ${data?.version} siap diunduh.`,
            });
            break;

          case 'updater:not-available':
            setStatus('not-available');
            break;

          case 'updater:progress':
            setStatus('downloading');
            setInfo({ percent: Math.round(data?.percent ?? 0) });
            break;

          case 'updater:downloaded':
            setStatus('downloaded');
            setInfo({ version: data?.version });
            toast({
              title: 'Update siap dipasang',
              description: `Versi ${data?.version} telah diunduh. Restart untuk memasang.`,
              duration: 0, // persistent
            });
            break;

          case 'updater:error':
            setStatus('error');
            setInfo({ message: data });
            break;
        }
      },
    );

    return cleanup;
  }, []);

  const checkUpdate = async () => {
    await (window as any).api?.updaterCheck?.();
  };

  const downloadUpdate = async () => {
    setStatus('downloading');
    await (window as any).api?.updaterDownload?.();
  };

  const installUpdate = () => {
    (window as any).api?.updaterInstall?.();
  };

  return { status, info, checkUpdate, downloadUpdate, installUpdate };
}
