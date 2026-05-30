import { create } from 'zustand';
import type { ProductRow } from '@/lib/api';
import { unwrap } from '@/lib/utils';
import { useSettingsStore } from './settingsStore';

export interface DashboardState {
  lowStockCount: number;
  lowStockProducts: ProductRow[];
  totalProducts: number;
  totalCategories: number;
  isLoading: boolean;

  fetchDashboardData: () => Promise<void>;
  fetchLowStock: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  lowStockCount: 0,
  lowStockProducts: [],
  totalProducts: 0,
  totalCategories: 0,
  isLoading: false,

  fetchLowStock: async () => {
    try {
      const { minStockThreshold } = useSettingsStore.getState();
      const threshold = minStockThreshold > 0 ? minStockThreshold : undefined;
      const res = await window.api.productLowStock(threshold);
      const data = unwrap<ProductRow[]>(res);
      const active = (data ?? []).filter((p) => p.isActive);
      set({ lowStockCount: active.length, lowStockProducts: active });
    } catch {
      set({ lowStockCount: 0, lowStockProducts: [] });
    }
  },

  fetchDashboardData: async () => {
    set({ isLoading: true });
    try {
      const { minStockThreshold } = useSettingsStore.getState();
      const threshold = minStockThreshold > 0 ? minStockThreshold : undefined;

      const [countsRes, lowStockRes, catsRes] = await Promise.all([
        window.api.productCount(),
        window.api.productLowStock(threshold),
        window.api.categoryList(),
      ]);

      const counts = unwrap<{ total: number; active: number }>(countsRes);
      const totalProducts = counts?.active ?? counts?.total ?? 0;

      const lowStock = unwrap<ProductRow[]>(lowStockRes) ?? [];

      const cats = unwrap<{ id: string }[]>(catsRes) ?? [];
      const totalCategories = cats.length;

      set({
        lowStockCount: lowStock.length,
        lowStockProducts: lowStock,
        totalProducts,
        totalCategories,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
