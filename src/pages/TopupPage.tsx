import { useRef, useState, useEffect } from 'react';
import { ArrowSquareOut, Warning, SidebarSimple } from 'phosphor-react';
import { PosPageColumn, PosToolbar, PosToolbarTitle, PosButton } from '@/components/ui/pos-ui';

const TOPUP_URL = 'https://klikmbc.biz/';

export default function TopupPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadError, setLoadError] = useState(false);

  // Detect iframe load failure
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      // Accessibility: try to detect if content is blocked
      try {
        // Accessing iframe content throws on cross-origin block
        const doc = iframe.contentDocument || (iframe.contentWindow as any)?.document;
        if (!doc || doc.body.innerHTML === '') {
          setLoadError(true);
        }
      } catch {
        // Cross-origin — loaded successfully but sandboxed
        setLoadError(false);
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  // Fallback: countdown before trying again
  const [countdown, setCountdown] = useState(0);
  const handleRetry = () => {
    setLoadError(false);
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Force iframe reload
          if (iframeRef.current) {
            iframeRef.current.src = TOPUP_URL;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOpenExternal = () => {
    window.api.openExternal(TOPUP_URL);
  };

  return (
    <PosPageColumn>
      <PosToolbar>
        <SidebarSimple weight="fill" className="w-3.5 h-3.5 text-indigo-600 mr-2" />
        <PosToolbarTitle>Topup & Digital</PosToolbarTitle>
        <div className="flex-1" />
        <button
          onClick={handleOpenExternal}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors border border-indigo-200"
        >
          <ArrowSquareOut className="w-3.5 h-3.5" />
          Buka di Browser
        </button>
      </PosToolbar>

      <div className="flex-1 relative bg-neutral-100">
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <Warning weight="fill" className="w-10 h-10 text-amber-400" />
            <h3 className="text-[13px] font-semibold text-neutral-700">Gagal Memuat Halaman</h3>
            <p className="text-[11px] text-neutral-500 max-w-md">
              Halaman {TOPUP_URL} tidak dapat dimuat di dalam aplikasi karena keterbatasan keamanan browser.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <PosButton variant="primary" onClick={handleRetry} disabled={countdown > 0}>
                {countdown > 0 ? `Coba lagi (${countdown})` : 'Coba Lagi'}
              </PosButton>
              <button
                onClick={handleOpenExternal}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <ArrowSquareOut className="w-3.5 h-3.5" />
                Buka di Browser
              </button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={TOPUP_URL}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            title="Topup & Digital"
            onError={() => setLoadError(true)}
          />
        )}
      </div>
    </PosPageColumn>
  );
}
