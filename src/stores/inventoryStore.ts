import { create } from 'zustand';
import type { InventoryLogRow, StockInInput, StockOutInput, AdjustmentInput, TransferInput, LocationRow, StockMovementRow } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InventoryState {
  logs: InventoryLogRow[];
  locations: LocationRow[];
  movementRows: StockMovementRow[];
  movementLoading: boolean;
  movementError: string | null;
  loading: boolean;
  error: string | null;

  fetchLogs: (filter?: { productId?: string; type?: string; userId?: string; startDate?: number; endDate?: number; limit?: number; offset?: number }) => Promise<void>;
  fetchLocations: () => Promise<void>;
  fetchMovement: (filter?: { productId?: string; locationId?: string; startDate?: number; endDate?: number; type?: string }) => Promise<void>;
  stockIn: (data: StockInInput) => Promise<{ ok: boolean; error?: string }>;
  stockOut: (data: StockOutInput) => Promise<{ ok: boolean; error?: string }>;
  adjustStock: (data: AdjustmentInput) => Promise<{ ok: boolean; error?: string }>;
  transferStock: (data: TransferInput) => Promise<{ ok: boolean; error?: string }>;
  clearLogs: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T; error?: { code: string; message: string } };
    if (r.ok) return r.data as T;
  }
  return fallback ?? null;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useInventoryStore = create<InventoryState>((set, get) => ({
  logs: [],
  locations: [],
  movementRows: [],
  movementLoading: false,
  movementError: null,
  loading: false,
  error: null,

  fetchLogs: async (filter) => {
    set({ loading: true, error: null });
    try {
      const res = await window.api.inventoryLogs(filter);
      const data = unwrap<InventoryLogRow[]>(res, []);
      set({ logs: data ?? [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat log stok', loading: false });
    }
  },

  fetchLocations: async () => {
    try {
      const res = await window.api.inventoryLocations();
      const data = unwrap<LocationRow[]>(res);
      if (data && data.length > 0) {
        set({ locations: data });
      } else {
        // Fallback: default locations if DB empty or API failed
        set({ locations: [
          { id: 'loc_main', name: 'Toko Utama', type: 'store', address: null, isActive: true },
          { id: 'loc_warehouse', name: 'Gudang', type: 'warehouse', address: null, isActive: true },
          { id: 'loc_backroom', name: 'Back Room', type: 'backroom', address: null, isActive: true },
        ]});
      }
    } catch {
      set({ locations: [
        { id: 'loc_main', name: 'Toko Utama', type: 'store', address: null, isActive: true },
        { id: 'loc_warehouse', name: 'Gudang', type: 'warehouse', address: null, isActive: true },
        { id: 'loc_backroom', name: 'Back Room', type: 'backroom', address: null, isActive: true },
      ]});
    }
  },

  fetchMovement: async (filter) => {
    set({ movementLoading: true, movementError: null });
    try {
      const res = await window.api.inventoryMovement(filter);
      const data = unwrap<StockMovementRow[]>(res, []);
      set({ movementRows: data ?? [], movementLoading: false });
    } catch (err: any) {
      set({ movementError: err.message || 'Gagal memuat laporan pergerakan', movementLoading: false });
    }
  },

  stockIn: async (data) => {
    const res = await window.api.inventoryStockIn(data);
    if (!res.ok) {
      return { ok: false, error: (res as any).error?.message || 'Gagal stok masuk' };
    }
    await get().fetchLogs({ limit: 500 });
    return { ok: true };
  },

  stockOut: async (data) => {
    const res = await window.api.inventoryStockOut(data);
    if (!res.ok) {
      return { ok: false, error: (res as any).error?.message || 'Gagal stok keluar' };
    }
    await get().fetchLogs({ limit: 500 });
    return { ok: true };
  },

  adjustStock: async (data) => {
    const res = await window.api.inventoryAdjust(data);
    if (!res.ok) {
      return { ok: false, error: (res as any).error?.message || 'Gagal penyesuaian stok' };
    }
    await get().fetchLogs({ limit: 500 });
    return { ok: true };
  },

  transferStock: async (data) => {
    const res = await window.api.inventoryTransfer(data);
    if (!res.ok) {
      return { ok: false, error: (res as any).error?.message || 'Gagal transfer stok' };
    }
    await get().fetchLogs({ limit: 500 });
    return { ok: true };
  },

  clearLogs: () => set({ logs: [] }),
}));
