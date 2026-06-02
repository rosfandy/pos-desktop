import { useState, useEffect, useCallback } from 'react';
import { useShiftStore } from '@/stores/shiftStore';
import { useAuthStore } from '@/stores/authStore';
import ShiftSummary from '@/components/shift/ShiftSummary';
import ShiftHistory from '@/components/shift/ShiftHistory';
import OpenShiftModal from '@/components/shift/OpenShiftModal';
import CloseShiftModal from '@/components/shift/CloseShiftModal';
import { Clock, Circle } from 'phosphor-react';
import { cn } from '@/lib/utils';

export default function ShiftPage() {
  const { currentShift, shiftHistory, loading, checkCurrentShift, fetchHistory } = useShiftStore();
  const { user } = useAuthStore();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [liveTotalSales, setLiveTotalSales] = useState<number | undefined>(undefined);

  // Load current shift + history on mount
  useEffect(() => {
    if (user?.id) {
      checkCurrentShift(user.id);
      fetchHistory({ userId: user.id });
    }
  }, [user?.id, checkCurrentShift, fetchHistory]);

  // Fetch live summary for active shift (totalSales from transactions, not DB column)
  useEffect(() => {
    if (!currentShift?.id) { setLiveTotalSales(undefined); return; }
    let cancelled = false;
    window.api.shiftSummary(currentShift.id).then((res: any) => {
      if (cancelled || !res?.ok) return;
      setLiveTotalSales(res.data?.totalSales ?? 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentShift?.id]);

  const handleOpenSuccess = useCallback(() => {
    console.log("user",user)
    if (user?.id) {
      checkCurrentShift(user.id);
      fetchHistory({ userId: user.id });
    }
  }, [user?.id, checkCurrentShift, fetchHistory]);

  const handleCloseSuccess = useCallback(() => {
    if (user?.id) {
      checkCurrentShift(user.id);
      fetchHistory({ userId: user.id });
    }
  }, [user?.id, checkCurrentShift, fetchHistory]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-9 flex items-center justify-between px-3 border-b border-border bg-card text-card-foreground">
        <div className="flex items-center gap-1.5">
          <Clock weight="fill" className="w-4 h-4 text-indigo-500" />
          <h1 className="text-[13px] font-semibold text-neutral-800">Manajemen Shift</h1>
        </div>

        <div className="flex items-center gap-2">
          {currentShift && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <Circle weight="fill" className="w-2 h-2" />
              Shift Aktif
            </span>
          )}
          {!currentShift && (
            <button
              onClick={() => setShowOpenModal(true)}
              className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium underline"
            >
              Buka Shift Baru
            </button>
          )}
        </div>
      </div>

      {/* ── Current shift status bar ────────────────────────────────────── */}
      <div className={cn(
        'shrink-0 h-8 flex items-center px-3 border-b',
        currentShift ? 'bg-emerald-50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'
      )}>
        <ShiftSummary
          shift={currentShift}
          liveTotalSales={currentShift ? liveTotalSales : undefined}
          onOpenShift={() => setShowOpenModal(true)}
          onCloseShift={() => setShowCloseModal(true)}
        />
      </div>

      {/* ── History ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 bg-background text-foreground">
        <ShiftHistory shifts={shiftHistory} loading={loading} />
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <OpenShiftModal
        open={showOpenModal}
        onOpenChange={setShowOpenModal}
        onSuccess={handleOpenSuccess}
      />

      {currentShift && (
        <CloseShiftModal
          open={showCloseModal}
          onOpenChange={setShowCloseModal}
          shift={currentShift}
          onSuccess={handleCloseSuccess}
        />
      )}
    </div>
  );
}
