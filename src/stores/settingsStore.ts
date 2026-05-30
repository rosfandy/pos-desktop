import { create } from 'zustand';
import type { API } from '@/lib/api';

export type FontSize = 'small' | 'medium' | 'large';

export interface SettingsState {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  receiptHeader: string;
  receiptFooter: string;
  receiptShowLogo: boolean;
  receiptShowTaxBreakdown: boolean;
  receiptShowQr: boolean;
  minStockThreshold: number;  // 0 = use per-product minStock
  printerName: string;        // nama printer untuk thermal printer
  fontSize: FontSize;         // small / medium / large
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  saveSettings: (values: {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    taxRate: number;
    receiptHeader: string;
    receiptFooter: string;
    receiptShowLogo: boolean;
    receiptShowTaxBreakdown: boolean;
    receiptShowQr: boolean;
    minStockThreshold: number;
    printerName: string;
    fontSize: FontSize;
  }) => Promise<void>;
}

const DEFAULTS = {
  storeName: 'Toko Saya',
  storeAddress: '',
  storePhone: '',
  taxRate: 0,
  receiptHeader: 'Terima Kasih',
  receiptFooter: 'Barang yang sudah dibeli tidak dapat dikembalikan',
  receiptShowLogo: false,
  receiptShowTaxBreakdown: true,
  receiptShowQr: false,
  minStockThreshold: 0,
  printerName: '',
  fontSize: 'medium' as FontSize,
};

function getBool(val: string | undefined, def: boolean): boolean {
  if (val === undefined) return def;
  return val === 'true';
}

export const useSettingsStore = create<SettingsState>((set) => ({
  storeName: DEFAULTS.storeName,
  storeAddress: DEFAULTS.storeAddress,
  storePhone: DEFAULTS.storePhone,
  taxRate: DEFAULTS.taxRate,
  receiptHeader: DEFAULTS.receiptHeader,
  receiptFooter: DEFAULTS.receiptFooter,
  receiptShowLogo: DEFAULTS.receiptShowLogo,
  receiptShowTaxBreakdown: DEFAULTS.receiptShowTaxBreakdown,
  receiptShowQr: DEFAULTS.receiptShowQr,
  minStockThreshold: DEFAULTS.minStockThreshold,
  printerName: DEFAULTS.printerName,
  fontSize: DEFAULTS.fontSize,
  isLoading: false,
  isSaving: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await (window as unknown as { api: API }).api.settingsGetAll();
      if (res.ok) {
        const data = res.data;
        set({
          storeName: data.storeName ?? DEFAULTS.storeName,
          storeAddress: data.storeAddress ?? DEFAULTS.storeAddress,
          storePhone: data.storePhone ?? DEFAULTS.storePhone,
          taxRate: parseFloat(data.taxRate ?? '0') || 0,
          receiptHeader: data.receipt_header ?? DEFAULTS.receiptHeader,
          receiptFooter: data.receipt_footer ?? DEFAULTS.receiptFooter,
          receiptShowLogo: getBool(data.receipt_show_logo, DEFAULTS.receiptShowLogo),
          receiptShowTaxBreakdown: getBool(data.receipt_show_tax_breakdown, DEFAULTS.receiptShowTaxBreakdown),
          receiptShowQr: getBool(data.receipt_show_qr, DEFAULTS.receiptShowQr),
          minStockThreshold: parseInt(data.min_stock_threshold ?? '0', 10) || 0,
          printerName: data.printer_name ?? DEFAULTS.printerName,
          fontSize: (data.font_size as FontSize) ?? DEFAULTS.fontSize,
          isLoading: false,
        });
      } else {
        set({ error: res.error.message, isLoading: false });
      }
    } catch {
      set({ error: 'Gagal memuat pengaturan', isLoading: false });
    }
  },

  saveSettings: async (values) => {
    set({ isSaving: true, error: null });
    try {
      const api = (window as unknown as { api: API }).api;
      await Promise.all([
        api.settingsSet('storeName', values.storeName),
        api.settingsSet('storeAddress', values.storeAddress),
        api.settingsSet('storePhone', values.storePhone),
        api.settingsSet('taxRate', String(values.taxRate)),
        api.settingsSet('receipt_header', values.receiptHeader),
        api.settingsSet('receipt_footer', values.receiptFooter),
        api.settingsSet('receipt_show_logo', String(values.receiptShowLogo)),
        api.settingsSet('receipt_show_tax_breakdown', String(values.receiptShowTaxBreakdown)),
        api.settingsSet('receipt_show_qr', String(values.receiptShowQr)),
        api.settingsSet('min_stock_threshold', String(values.minStockThreshold)),
        api.settingsSet('printer_name', values.printerName),
        api.settingsSet('font_size', values.fontSize),
      ]);

      set({
        storeName: values.storeName,
        storeAddress: values.storeAddress,
        storePhone: values.storePhone,
        taxRate: values.taxRate,
        receiptHeader: values.receiptHeader,
        receiptFooter: values.receiptFooter,
        receiptShowLogo: values.receiptShowLogo,
        receiptShowTaxBreakdown: values.receiptShowTaxBreakdown,
        receiptShowQr: values.receiptShowQr,
        minStockThreshold: values.minStockThreshold,
        printerName: values.printerName,
        fontSize: values.fontSize,
        isSaving: false,
      });
    } catch {
      set({ error: 'Gagal menyimpan pengaturan', isSaving: false });
    }
  },
}));
