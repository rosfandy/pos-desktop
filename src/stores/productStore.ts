import { create } from 'zustand';
import type {
  ProductRow,
  ProductWithUnits,
  ProductFilter,
  ProductPageResult,
  CategoryRow,
} from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductState {
  products: ProductRow[];
  categories: CategoryRow[];
  selectedProduct: ProductWithUnits | null;
  isLoading: boolean;
  isLoadingCategories: boolean;
  error: string | null;
  lowStockAlerts: ProductRow[];

  fetchProducts: (filter?: ProductFilter) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProductById: (id: string) => Promise<ProductWithUnits | null>;
  createProduct: (input: any) => Promise<ProductWithUnits | { error: string }>;
  updateProduct: (id: string, input: any) => Promise<ProductWithUnits | { error: string }>;
  bulkSaveProducts: (rows: any[]) => Promise<{ success: number; errors: { row: number; message: string }[] }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkLowStock: () => void;
  clearSelected: () => void;
  clearError: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T; error?: { code: string; message: string } };
    if (r.ok) return r.data as T;
  }
  return fallback ?? null;
}

function unwrapErr(res: unknown): string | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; error?: { code: string; message: string } };
    if (!r.ok && r.error) return r.error.message;
  }
  return null;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  selectedProduct: null,
  isLoading: false,
  isLoadingCategories: false,
  error: null,
  lowStockAlerts: [],

  fetchProducts: async (filter?: ProductFilter) => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.productList(filter);
      const pageResult = unwrap<ProductPageResult>(res);
      const list = pageResult?.data ?? [];
      set({ products: list, error: unwrapErr(res) });
    } catch (err: any) {
      console.error('[STORE] fetchProducts error:', err);
      set({ error: err.message || 'Gagal memuat produk' });
    } finally {
      set({ isLoading: false });
    }
  },

fetchCategories: async () => {
    set({ isLoadingCategories: true, error: null });
    try {
      const res = await window.api.categoryList();
      const data = unwrap<CategoryRow[]>(res, []);
      console.log('[STORE] fetchCategories res:', JSON.stringify(res)?.slice(0, 200), 'data:', data?.length);
      set({ categories: data ?? [], error: unwrapErr(res) });
    } catch (err: any) {
      console.error('[STORE] fetchCategories error:', err);
      set({ error: err.message || 'Gagal memuat kategori' });
    } finally {
      set({ isLoadingCategories: false });
    }
  },

  fetchProductById: async (id: string): Promise<ProductWithUnits | null> => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.productGet(id);
      const data = unwrap<ProductWithUnits>(res);
      set({ selectedProduct: data, error: data ? null : (unwrapErr(res) ?? 'Produk tidak ditemukan') });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat produk', selectedProduct: null });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  createProduct: async (input: any) => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.productCreate(input);
      const data = unwrap<ProductWithUnits>(res);
      if (data) {
        await get().fetchProducts();
        return data;
      }
      const msg = unwrapErr(res) || 'Gagal membuat produk';
      set({ error: msg });
      return { error: msg };
    } catch (err: any) {
      const msg = err.message || 'Gagal membuat produk';
      set({ error: msg });
      return { error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  updateProduct: async (id: string, input: any) => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.productUpdate(id, input);
      const data = unwrap<ProductWithUnits>(res);
      if (data) {
        await get().fetchProducts();
        return data;
      }
      const msg = unwrapErr(res) || 'Gagal memperbarui produk';
      set({ error: msg });
      return { error: msg };
    } catch (err: any) {
      const msg = err.message || 'Gagal memperbarui produk';
      set({ error: msg });
      return { error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  bulkSaveProducts: async (rows: any[]) => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.productBulkSave(rows);
      const data = unwrap<{ success: number; errors: { row: number; message: string }[] }>(res);
      if (data) {
        await get().fetchProducts();
        return data;
      }
      const msg = unwrapErr(res) || 'Gagal menyimpan produk';
      set({ error: msg });
      return { success: 0, errors: [{ row: -1, message: msg }] };
    } catch (err: any) {
      const msg = err.message || 'Gagal menyimpan produk';
      set({ error: msg });
      return { success: 0, errors: [{ row: -1, message: msg }] };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProduct: async (id: string) => {
    set({ error: null });
    try {
      const res = await window.api.productDelete(id);
      if (res && typeof res === 'object' && 'ok' in res) {
        if (res.ok) {
          await get().fetchProducts();
          return { success: true };
        }
        set({ error: res.error.message });
        return { success: false, error: res.error.message };
      }
      return { success: false, error: 'Gagal menghapus produk' };
    } catch (err: any) {
      const msg = err.message || 'Gagal menghapus produk';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  checkLowStock: () => {
    const { products } = get();
    const alerts = products.filter((p) => p.stock <= p.minStock && p.isActive);
    set({ lowStockAlerts: alerts });
  },

  clearSelected: () => set({ selectedProduct: null, error: null }),
  clearError: () => set({ error: null }),
}));
