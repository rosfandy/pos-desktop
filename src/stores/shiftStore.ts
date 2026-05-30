import { create } from 'zustand';
import type { Shift } from '@/lib/api';

interface ShiftState {
  currentShift: Shift | null;
  shiftHistory: Shift[];
  loading: boolean;
  error: string | null;

  checkCurrentShift: (userId: string) => Promise<void>;
  openShift: (userId: string, openingCash: number) => Promise<{ ok: boolean; error?: string }>;
  closeShift: (shiftId: string, closingCash: number, notes?: string) => Promise<{ ok: boolean; error?: string }>;
  fetchHistory: (filters?: { userId?: string; status?: string; from?: number; to?: number }) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set) => ({
  currentShift: null,
  shiftHistory: [],
  loading: false,
  error: null,

  checkCurrentShift: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await window.api.shiftCurrent(userId);
      if (res.ok) {
        set({ currentShift: res.data, loading: false });
      } else {
        set({ currentShift: null, loading: false });
      }
    } catch {
      set({ currentShift: null, loading: false, error: 'Gagal memuat shift' });
    }
  },

  openShift: async (userId: string, openingCash: number) => {
    set({ loading: true, error: null });
    try {
      const res = await window.api.shiftOpen({ userId, openingCash });
      if (res.ok) {
        set({ currentShift: res.data, loading: false });
        return { ok: true };
      }
      set({ loading: false, error: res.error.message });
      return { ok: false, error: res.error.message };
    } catch {
      set({ loading: false, error: 'Gagal membuka shift' });
      return { ok: false, error: 'Gagal membuka shift' };
    }
  },

  closeShift: async (shiftId: string, closingCash: number, notes?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await window.api.shiftClose({ shiftId, closingCash, notes });
      if (res.ok) {
        set({ currentShift: null, loading: false });
        return { ok: true };
      }
      set({ loading: false, error: res.error.message });
      return { ok: false, error: res.error.message };
    } catch {
      set({ loading: false, error: 'Gagal menutup shift' });
      return { ok: false, error: 'Gagal menutup shift' };
    }
  },

  fetchHistory: async (filters) => {
    set({ loading: true, error: null });
    try {
      const res = await window.api.shiftList(filters);
      if (res.ok) {
        set({ shiftHistory: res.data ?? [], loading: false });
      } else {
        set({ shiftHistory: [], loading: false });
      }
    } catch {
      set({ shiftHistory: [], loading: false, error: 'Gagal memuat riwayat shift' });
    }
  },
}));
