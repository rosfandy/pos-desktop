import { create } from 'zustand';
import type { CustomerRow, CustomerFilter } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CustomerState {
  customers: CustomerRow[];
  selectedCustomer: CustomerRow | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  fetchCustomers: (filter?: CustomerFilter) => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  createCustomer: (input: { name: string; phone?: string; email?: string; address?: string }) => Promise<CustomerRow | { error: string }>;
  updateCustomer: (id: string, input: Partial<{ name: string; phone: string; email: string; address: string }>) => Promise<CustomerRow | { error: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;
  selectCustomer: (customer: CustomerRow | null) => void;
  setSearchQuery: (query: string) => void;
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

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  selectedCustomer: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchCustomers: async (filter?: CustomerFilter) => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.customerList(filter);
      const data = unwrap<CustomerRow[]>(res, []);
      set({ customers: data ?? [], error: unwrapErr(res) });
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat pelanggan' });
    } finally {
      set({ isLoading: false });
    }
  },

  searchCustomers: async (query: string) => {
    set({ searchQuery: query, isLoading: true, error: null });
    try {
      const res = await window.api.customerList({ search: query, isActive: true });
      const data = unwrap<CustomerRow[]>(res, []);
      set({ customers: data ?? [], error: unwrapErr(res) });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mencari pelanggan' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCustomerById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.customerGet(id);
      const data = unwrap<CustomerRow>(res);
      if (data) {
        set({ selectedCustomer: data, error: null });
        return data;
      }
      set({ error: unwrapErr(res) || 'Pelanggan tidak ditemukan', selectedCustomer: null });
      return null;
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat pelanggan', selectedCustomer: null });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  createCustomer: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.customerCreate(input);
      const data = unwrap<CustomerRow>(res);
      if (data) {
        await get().fetchCustomers();
        return data;
      }
      const msg = unwrapErr(res) || 'Gagal membuat pelanggan';
      set({ error: msg });
      return { error: msg };
    } catch (err: any) {
      const msg = err.message || 'Gagal membuat pelanggan';
      set({ error: msg });
      return { error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  updateCustomer: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const res = await window.api.customerUpdate(id, input);
      const data = unwrap<CustomerRow>(res);
      if (data) {
        await get().fetchCustomers();
        return data;
      }
      const msg = unwrapErr(res) || 'Gagal memperbarui pelanggan';
      set({ error: msg });
      return { error: msg };
    } catch (err: any) {
      const msg = err.message || 'Gagal memperbarui pelanggan';
      set({ error: msg });
      return { error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCustomer: async (id) => {
    set({ error: null });
    try {
      const res = await window.api.customerDelete(id);
      if (res && typeof res === 'object' && 'ok' in res) {
        if (res.ok) {
          await get().fetchCustomers();
          return { success: true };
        }
        set({ error: (res as any).error?.message || 'Gagal menghapus pelanggan' });
        return { success: false, error: (res as any).error?.message };
      }
      return { success: false, error: 'Gagal menghapus pelanggan' };
    } catch (err: any) {
      const msg = err.message || 'Gagal menghapus pelanggan';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  selectCustomer: (customer) => set({ selectedCustomer: customer }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearError: () => set({ error: null }),
}));
