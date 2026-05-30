import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectPortal, SelectPositioner } from '@/components/ui/select';
import { cn, unwrap } from '@/lib/utils';
import type { PrinterInfo } from '@/lib/api';
import {
  Storefront, MapPin, Phone, Percent, CheckCircle, Warning, FloppyDisk,
  WarningCircle, Printer, Package, Gear, TextT, ArrowClockwise
} from 'phosphor-react';

// ─── Tab definitions ───────────────────────────────────────────────────────────

type TabId = 'general' | 'print' | 'inventory' | 'tampilan';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  { id: 'general',   label: 'Umum',        icon: <Gear className="w-4 h-4" /> },
  { id: 'print',     label: 'Cetak',       icon: <Printer className="w-4 h-4" /> },
  { id: 'inventory', label: 'Inventaris',  icon: <Package className="w-4 h-4" /> },
  { id: 'tampilan',  label: 'Tampilan',    icon: <TextT className="w-4 h-4" /> },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const {
    storeName, storeAddress, storePhone, taxRate,
    receiptHeader, receiptFooter, receiptShowLogo, receiptShowTaxBreakdown, receiptShowQr,
    minStockThreshold, printerName, fontSize, isLoading, isSaving, error, loadSettings, saveSettings
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [form, setForm] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    taxRate: 0,
    receiptHeader: '',
    receiptFooter: '',
    receiptShowLogo: false,
    receiptShowTaxBreakdown: true,
    receiptShowQr: false,
    minStockThreshold: 0,
    printerName: '',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [printersLoading, setPrintersLoading] = useState(false);

  // Fetch available printers
  const fetchPrinters = async () => {
    setPrintersLoading(true);
    try {
      const res = await window.api.printerList();
      const data = unwrap<PrinterInfo[]>(res);
      if (data) setPrinters(data);
    } catch { /* silent */ }
    finally { setPrintersLoading(false); }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setForm({
      storeName, storeAddress, storePhone, taxRate,
      receiptHeader, receiptFooter, receiptShowLogo, receiptShowTaxBreakdown, receiptShowQr,
      minStockThreshold, printerName, fontSize,
    });
  }, [storeName, storeAddress, storePhone, taxRate, receiptHeader, receiptFooter, receiptShowLogo, receiptShowTaxBreakdown, receiptShowQr, minStockThreshold, printerName, fontSize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(false);
    await saveSettings(form);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const hasChanges =
    form.storeName !== storeName ||
    form.storeAddress !== storeAddress ||
    form.storePhone !== storePhone ||
    form.taxRate !== taxRate ||
    form.receiptHeader !== receiptHeader ||
    form.receiptFooter !== receiptFooter ||
    form.receiptShowLogo !== receiptShowLogo ||
    form.receiptShowTaxBreakdown !== receiptShowTaxBreakdown ||
    form.receiptShowQr !== receiptShowQr ||
    form.minStockThreshold !== minStockThreshold ||
    form.printerName !== printerName ||
    form.fontSize !== fontSize;

  // ── Section renderers ────────────────────────────────────────────────────────

  function renderGeneral() {
    return (
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Informasi Toko</p>

        {/* Store Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Nama Toko</label>
          <div className="relative">
            <Storefront className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Input
              value={form.storeName}
              onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
              placeholder="Contoh: Toko Saya"
              required
              className="h-9 pl-10 text-[12px] bg-white border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Store Address */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Alamat Toko</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Textarea
              value={form.storeAddress}
              onChange={(e) => setForm((f) => ({ ...f, storeAddress: e.target.value }))}
              placeholder="Contoh: Jl. Sudirman No. 123"
              rows={3}
              className="pl-10 text-[12px] bg-white border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Store Phone */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Nomor Telepon</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Input
              value={form.storePhone}
              onChange={(e) => setForm((f) => ({ ...f, storePhone: e.target.value }))}
              placeholder="Contoh: 08123456789"
              className="h-9 pl-10 text-[12px] bg-white border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tax Rate */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Pajak (%)</label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.taxRate}
              onChange={(e) => setForm((f) => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              className="h-9 pl-10 text-[12px] bg-white border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderPrint() {
    return (
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Pengaturan Cetak / Struk</p>

        {/* Printer Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Printer Thermal</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Printer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none z-10" />
              <Select
                value={form.printerName || '__default__'}
                onValueChange={(val) => {
                  const v = val ?? '';
                  setForm((f) => ({ ...f, printerName: v === '__default__' ? '' : v }));
                }}
              >
                <SelectTrigger className="h-9 pl-10 text-[12px] bg-white border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Pilih printer (kosong = default sistem)" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectPositioner>
                    <SelectContent>
                      <SelectItem value="__default__" className="text-[11px]">
                        <span className="text-neutral-400">Default sistem</span>
                      </SelectItem>
                      {printers.map((p) => (
                        <SelectItem key={p.name} value={p.name} className="text-[11px]">
                          <span className={cn('flex flex-col gap-0', p.status !== 0 ? 'text-amber-600' : '')}>
                            <span className="font-medium">{p.displayName}</span>
                            {p.displayName !== p.name && (
                              <span className="text-[9px] text-neutral-400 font-mono">{p.name}</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectPositioner>
                </SelectPortal>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchPrinters}
              disabled={printersLoading}
              className="h-9 w-9 shrink-0 text-neutral-400 hover:text-indigo-600"
              title="Muat ulang daftar printer"
            >
              <ArrowClockwise className={cn('w-4 h-4', printersLoading && 'animate-spin')} />
            </Button>
          </div>
          <p className="text-[10px] text-neutral-500">
            Pilih printer thermal. Nilai yang disimpan adalah <strong>nama sistem</strong> printer (ditampilkan dalam font monospace di bawah nama tampilan).
          </p>
          {form.printerName && form.printerName !== '' && (
            <p className="text-[10px] text-indigo-600 font-mono">Tersimpan: {form.printerName}</p>
          )}
          {printers.length === 0 && !printersLoading && (
            <p className="text-[10px] text-amber-600">Tidak ada printer terdeteksi. Pastikan printer terhubung dan driver terinstal.</p>
          )}
        </div>

        {/* Receipt Header */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Teks Header Struk</label>
          <Textarea
            value={form.receiptHeader}
            onChange={(e) => setForm((f) => ({ ...f, receiptHeader: e.target.value }))}
            placeholder="Terima Kasih"
            rows={2}
            className="text-[12px] bg-white border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          <p className="text-[10px] text-neutral-500">Teks yang muncul di bagian atas struk.</p>
        </div>

        {/* Receipt Footer */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Teks Footer Struk</label>
          <Textarea
            value={form.receiptFooter}
            onChange={(e) => setForm((f) => ({ ...f, receiptFooter: e.target.value }))}
            placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
            rows={2}
            className="text-[12px] bg-white border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          <p className="text-[10px] text-neutral-500">Teks yang muncul di bagian bawah struk.</p>
        </div>

        {/* Checkbox options */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="receiptShowLogo"
              checked={form.receiptShowLogo}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, receiptShowLogo: checked === true }))}
              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <label htmlFor="receiptShowLogo" className="text-[12px] text-neutral-700 cursor-pointer select-none">
              Tampilkan logo toko di struk
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="receiptShowTaxBreakdown"
              checked={form.receiptShowTaxBreakdown}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, receiptShowTaxBreakdown: checked === true }))}
              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <label htmlFor="receiptShowTaxBreakdown" className="text-[12px] text-neutral-700 cursor-pointer select-none">
              Tampilkan rincian pajak di struk
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="receiptShowQr"
              checked={form.receiptShowQr}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, receiptShowQr: checked === true }))}
              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <label htmlFor="receiptShowQr" className="text-[12px] text-neutral-700 cursor-pointer select-none">
              Tampilkan QR Code pembayaran di struk
            </label>
          </div>
        </div>
      </div>
    );
  }

  function renderInventory() {
    return (
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Pengaturan Inventaris</p>

        {/* Min Stock Threshold */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Ambang Batas Stok Rendah (Global)</label>
          <div className="relative">
            <WarningCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Input
              type="number"
              min={0}
              value={form.minStockThreshold || ''}
              onChange={(e) => setForm((f) => ({ ...f, minStockThreshold: parseInt(e.target.value || '0', 10) || 0 }))}
              placeholder="0 (pakai ambang per-produk)"
              className="h-9 pl-10 text-[12px] bg-white border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <p className="text-[10px] text-neutral-500">
            Jika diisi, produk dengan stok di bawah angka ini akan ditandai stok rendah. Jika 0, gunakan ambang batas per-produk (min_stock).
          </p>
        </div>
      </div>
    );
  }

  function renderPreferences() {
    const sizes: { value: 'small' | 'medium' | 'large'; label: string }[] = [
      { value: 'small',  label: 'Kecil' },
      { value: 'medium', label: 'Sedang' },
      { value: 'large',  label: 'Besar' },
    ];

    return (
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Ukuran Huruf</p>

        <div className="space-y-1">
          <p className="text-[10px] text-neutral-600">Pilih ukuran huruf keseluruhan aplikasi.</p>
          <div className="flex gap-2">
            {sizes.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, fontSize: s.value }))}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded border transition-colors',
                  form.fontSize === s.value
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                )}
              >
                <TextT className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-neutral-400">
            Perubahan ukuran huruf akan langsung diterapkan setelah disimpan.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-100">
        <span className="text-[11px] text-neutral-500">Memuat pengaturan…</span>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-neutral-100">
      {/* Toolbar */}
      <div className="h-9 shrink-0 flex items-center px-4 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2">
          <Storefront weight="fill" className="w-4 h-4 text-indigo-600" />
          <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">Pengaturan</span>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <nav className="w-48 shrink-0 border-r border-neutral-200 bg-white flex flex-col py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-medium text-left transition-colors',
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            {/* Scrollable fields */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto p-6 space-y-6">
                {/* Success */}
                {showSuccess && (
                  <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                    <CheckCircle weight="fill" className="w-3.5 h-3.5 shrink-0" />
                    Pengaturan berhasil disimpan.
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    <Warning weight="fill" className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Active section */}
                {activeTab === 'general' && renderGeneral()}
                {activeTab === 'print' && renderPrint()}
                {activeTab === 'inventory' && renderInventory()}
                {activeTab === 'tampilan' && renderPreferences()}
              </div>
            </div>

            {/* Fixed Save Bar */}
            <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-neutral-200 bg-white">
              <span className={cn('text-[10px]', hasChanges ? 'text-amber-600 font-medium' : 'text-neutral-400')}>
                {hasChanges ? '● Ada perubahan yang belum disimpan' : '○ Semua perubahan tersimpan'}
              </span>
              <Button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold shadow-sm"
              >
                <FloppyDisk className="w-3.5 h-3.5" />
                {isSaving ? 'Menyimpan…' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 shrink-0 flex items-center justify-between px-4 border-t border-neutral-200 bg-white">
        <span className="text-[10px] text-neutral-400">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <span className="text-[10px] text-neutral-500">
          {storeName || 'Toko Saya'}
        </span>
      </div>
    </div>
  );
}
