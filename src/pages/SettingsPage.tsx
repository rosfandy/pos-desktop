import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectPortal, SelectPositioner } from '@/components/ui/select';
import { cn, unwrap } from '@/lib/utils';
import type { PrinterInfo } from '@/lib/api';
import {
  Storefront, MapPin, Phone, Percent, CheckCircle, Warning, FloppyDisk,
  WarningCircle, Printer, Package, TextT, ArrowClockwise,
  SidebarSimple, Receipt, Shield,
} from 'phosphor-react';
import {
  PosPageColumn, PosToolbar, PosToolbarTitle,
  PosSideMenu, PosSideMenuHeader, PosSideMenuNav, PosSideMenuItem,
  PosPanel, PosPanelBody, PosButton, PosAlert, PosForm, PosFormSection,
  PosLabel, PosHint,
} from '@/components/ui/pos-ui';

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabId = 'general' | 'print' | 'inventory' | 'tampilan';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  { id: 'general',   label: 'Umum',        icon: <Storefront className="w-3.5 h-3.5" /> },
  { id: 'print',     label: 'Cetak',       icon: <Printer className="w-3.5 h-3.5" /> },
  { id: 'inventory', label: 'Inventaris',  icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'tampilan',  label: 'Tampilan',    icon: <TextT className="w-3.5 h-3.5" /> },
];

const TAB_TITLES: Record<TabId, string> = {
  general:   'Pengaturan Umum',
  print:     'Pengaturan Cetak',
  inventory: 'Pengaturan Inventaris',
  tampilan:  'Tampilan & Ukuran',
};

const TAB_DESCRIPTIONS: Record<TabId, string> = {
  general:   'Informasi toko untuk header struk dan laporan.',
  print:     'Printer thermal, header/footer struk, opsi cetak.',
  inventory: 'Ambang batas stok rendah global.',
  tampilan:  'Ukuran huruf keseluruhan aplikasi.',
};

// ── Section renderers ─────────────────────────────────────────────────────────

function GeneralSection({ form, setForm }: { form: any; setForm: any }) {
  return (
    <PosForm>
      <PosFormSection className="flex items-center gap-2">
        <Storefront weight="fill" className="w-4 h-4 text-indigo-600" />
        <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wide">Informasi Toko</span>
      </PosFormSection>

      <div className="space-y-1">
        <PosLabel htmlFor="storeName">Nama Toko</PosLabel>
        <div className="relative">
          <Storefront className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <Input
            id="storeName"
            value={form.storeName}
            onChange={(e) => setForm((f: any) => ({ ...f, storeName: e.target.value }))}
            placeholder="Contoh: Toko Saya"
            required
            className="pos-input pl-10 h-9"
          />
        </div>
      </div>

      <div className="space-y-1">
        <PosLabel htmlFor="storeAddress">Alamat Toko</PosLabel>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
          <Textarea
            id="storeAddress"
            value={form.storeAddress}
            onChange={(e) => setForm((f: any) => ({ ...f, storeAddress: e.target.value }))}
            placeholder="Contoh: Jl. Sudirman No. 123"
            rows={3}
            className="pl-10 text-[12px] bg-white border border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <PosLabel htmlFor="storePhone">Nomor Telepon</PosLabel>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <Input
            id="storePhone"
            value={form.storePhone}
            onChange={(e) => setForm((f: any) => ({ ...f, storePhone: e.target.value }))}
            placeholder="Contoh: 08123456789"
            className="pos-input pl-10 h-9"
          />
        </div>
      </div>

      <div className="space-y-1">
        <PosLabel htmlFor="taxRate">Pajak (%)</PosLabel>
        <div className="relative">
          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <Input
            id="taxRate"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.taxRate}
            onChange={(e) => setForm((f: any) => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
            className="pos-input pl-10 h-9"
          />
        </div>
        <PosHint>0 = nonaktif. Pajak akan otomatis ditambahkan ke setiap transaksi.</PosHint>
      </div>
    </PosForm>
  );
}

function PrintSection({ form, setForm, printers, printersLoading, fetchPrinters }: { form: any; setForm: any; printers: PrinterInfo[]; printersLoading: boolean; fetchPrinters: () => void }) {
  return (
    <PosForm>
      <PosFormSection className="flex items-center gap-2">
        <Receipt weight="fill" className="w-4 h-4 text-indigo-600" />
        <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wide">Pengaturan Cetak / Struk</span>
      </PosFormSection>

      <div className="space-y-1">
        <PosLabel>Printer Thermal</PosLabel>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Printer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none z-10" />
            <Select
              value={form.printerName || '__default__'}
              onValueChange={(val) => {
                const v = val ?? '';
                setForm((f: any) => ({ ...f, printerName: v === '__default__' ? '' : v }));
              }}
            >
              <SelectTrigger className="pos-input h-9 pl-10">
                <SelectValue placeholder="Pilih printer (kosong = default)" />
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
          <button
            type="button"
            onClick={fetchPrinters}
            disabled={printersLoading}
            className="h-9 w-9 shrink-0 flex items-center justify-center text-neutral-400 hover:text-indigo-600 hover:bg-neutral-100 transition-colors border border-neutral-300"
            title="Muat ulang daftar printer"
          >
            <ArrowClockwise className={cn('w-4 h-4', printersLoading && 'animate-spin')} />
          </button>
        </div>
        <PosHint>
          Pilih printer thermal. Nilai yang disimpan adalah <strong>nama sistem</strong> printer.
        </PosHint>
        {form.printerName && form.printerName !== '' && (
          <p className="text-[10px] text-indigo-600 font-mono">Tersimpan: {form.printerName}</p>
        )}
        {printers.length === 0 && !printersLoading && (
          <PosHint className="text-amber-600">
            Tidak ada printer terdeteksi. Pastikan printer terhubung dan driver terinstal.
          </PosHint>
        )}
      </div>

      <div className="space-y-1">
        <PosLabel htmlFor="receiptHeader">Teks Header Struk</PosLabel>
        <Textarea
          id="receiptHeader"
          value={form.receiptHeader}
          onChange={(e) => setForm((f: any) => ({ ...f, receiptHeader: e.target.value }))}
          placeholder="Terima Kasih"
          rows={2}
          className="text-[12px] bg-white border border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
        />
        <PosHint>Teks yang muncul di bagian atas struk.</PosHint>
      </div>

      <div className="space-y-1">
        <PosLabel htmlFor="receiptFooter">Teks Footer Struk</PosLabel>
        <Textarea
          id="receiptFooter"
          value={form.receiptFooter}
          onChange={(e) => setForm((f: any) => ({ ...f, receiptFooter: e.target.value }))}
          placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
          rows={2}
          className="text-[12px] bg-white border border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
        />
        <PosHint>Teks yang muncul di bagian bawah struk.</PosHint>
      </div>

      <div className="space-y-2 pt-1">
        {[
          { id: 'receiptShowLogo',         label: 'Tampilkan logo toko di struk',            key: 'receiptShowLogo' },
          { id: 'receiptShowTaxBreakdown', label: 'Tampilkan rincian pajak di struk',       key: 'receiptShowTaxBreakdown' },
          { id: 'receiptShowQr',           label: 'Tampilkan QR Code pembayaran di struk',  key: 'receiptShowQr' },
        ].map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <Checkbox
              id={opt.id}
              checked={form[opt.key]}
              onCheckedChange={(checked) => setForm((f: any) => ({ ...f, [opt.key]: checked === true }))}
              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <label htmlFor={opt.id} className="text-[12px] text-neutral-700 cursor-pointer select-none">
              {opt.label}
            </label>
          </div>
        ))}
      </div>
    </PosForm>
  );
}

function InventorySection({ form, setForm }: { form: any; setForm: any }) {
  return (
    <PosForm>
      <PosFormSection className="flex items-center gap-2">
        <Shield weight="fill" className="w-4 h-4 text-indigo-600" />
        <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wide">Pengaturan Inventaris</span>
      </PosFormSection>

      <div className="space-y-1">
        <PosLabel htmlFor="minStockThreshold">Ambang Batas Stok Rendah (Global)</PosLabel>
        <div className="relative">
          <WarningCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <Input
            id="minStockThreshold"
            type="number"
            min={0}
            value={form.minStockThreshold || ''}
            onChange={(e) => setForm((f: any) => ({ ...f, minStockThreshold: parseInt(e.target.value || '0', 10) || 0 }))}
            placeholder="0 (pakai ambang per-produk)"
            className="pos-input pl-10 h-9"
          />
        </div>
        <PosHint>
          Jika diisi, produk dengan stok di bawah angka ini akan ditandai stok rendah. Jika 0, gunakan ambang batas per-produk (min_stock).
        </PosHint>
      </div>
    </PosForm>
  );
}

function TampilanSection({ form, setForm }: { form: any; setForm: any }) {
  const sizes: { value: 'small' | 'medium' | 'large'; label: string }[] = [
    { value: 'small',  label: 'Kecil' },
    { value: 'medium', label: 'Sedang' },
    { value: 'large',  label: 'Besar' },
  ];

  return (
    <PosForm>
      <PosFormSection className="flex items-center gap-2">
        <TextT weight="fill" className="w-4 h-4 text-indigo-600" />
        <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wide">Tampilan & Ukuran</span>
      </PosFormSection>

      <div className="space-y-2">
        <PosLabel>Ukuran Huruf</PosLabel>
        <PosHint>Pilih ukuran huruf keseluruhan aplikasi.</PosHint>
        <div className="flex gap-2">
          {sizes.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm((f: any) => ({ ...f, fontSize: s.value }))}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border transition-colors',
                form.fontSize === s.value
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50'
              )}
            >
              <TextT className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>
        <PosHint>Perubahan ukuran huruf akan langsung diterapkan setelah disimpan.</PosHint>
      </div>
    </PosForm>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const {
    storeName, storeAddress, storePhone, taxRate,
    receiptHeader, receiptFooter, receiptShowLogo, receiptShowTaxBreakdown, receiptShowQr,
    minStockThreshold, printerName, fontSize, isLoading, isSaving, error, loadSettings, saveSettings
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [form, setForm] = useState({
    storeName: '', storeAddress: '', storePhone: '', taxRate: 0,
    receiptHeader: '', receiptFooter: '', receiptShowLogo: false,
    receiptShowTaxBreakdown: true, receiptShowQr: false,
    minStockThreshold: 0, printerName: '', fontSize: 'medium' as 'small' | 'medium' | 'large',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [printersLoading, setPrintersLoading] = useState(false);

  const fetchPrinters = async () => {
    setPrintersLoading(true);
    try {
      const res = await window.api.printerList();
      const data = unwrap<PrinterInfo[]>(res);
      if (data) setPrinters(data);
    } finally { setPrintersLoading(false); }
  };

  useEffect(() => { fetchPrinters(); }, []);
  useEffect(() => { loadSettings(); }, [loadSettings]);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-200">
        <span className="text-[11px] text-neutral-500">Memuat pengaturan…</span>
      </div>
    );
  }

  return (
    <PosPageColumn>
      <PosToolbar>
        <SidebarSimple weight="fill" className="w-3.5 h-3.5 text-indigo-600 mr-2" />
        <PosToolbarTitle>Pengaturan</PosToolbarTitle>
      </PosToolbar>

      <div className="flex flex-1 min-h-0 gap-2 ">
        {/* Side menu */}
        <PosSideMenu className="w-40">
          <PosSideMenuHeader>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Kategori</span>
          </PosSideMenuHeader>
          <PosSideMenuNav>
            {TABS.map((tab) => (
              <PosSideMenuItem
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </PosSideMenuItem>
            ))}
          </PosSideMenuNav>
        </PosSideMenu>

        {/* Content panel */}
        <PosPanel className="m-0">
          {/* Panel header */}
          <div className="h-12 px-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
            <div>
              <h2 className="text-[12px] font-semibold text-neutral-800">{TAB_TITLES[activeTab]}</h2>
              <p className="text-[10px] text-neutral-500">{TAB_DESCRIPTIONS[activeTab]}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <PosPanelBody>
              {showSuccess && (
                <PosAlert tone="success" className="mb-3 flex items-center gap-2">
                  <CheckCircle weight="fill" className="w-3.5 h-3.5 shrink-0" />
                  Pengaturan berhasil disimpan.
                </PosAlert>
              )}
              {error && (
                <PosAlert tone="error" className="mb-3 flex items-center gap-2">
                  <Warning weight="fill" className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </PosAlert>
              )}

              {activeTab === 'general'   && <GeneralSection form={form} setForm={setForm} />}
              {activeTab === 'print'     && <PrintSection form={form} setForm={setForm} printers={printers} printersLoading={printersLoading} fetchPrinters={fetchPrinters} />}
              {activeTab === 'inventory' && <InventorySection form={form} setForm={setForm} />}
              {activeTab === 'tampilan'  && <TampilanSection form={form} setForm={setForm} />}
            </PosPanelBody>

            {/* Save bar */}
            <div className="h-10 shrink-0 flex items-center justify-between px-4 border-t border-neutral-200 bg-white">
              <span className={cn('text-[10px]', hasChanges ? 'text-amber-600 font-medium' : 'text-neutral-400')}>
                {hasChanges ? '● Ada perubahan yang belum disimpan' : '○ Semua perubahan tersimpan'}
              </span>
              <PosButton variant="primary" type="submit" disabled={isSaving || !hasChanges}>
                <FloppyDisk className="w-3.5 h-3.5" />
                {isSaving ? 'Menyimpan…' : 'Simpan Pengaturan'}
              </PosButton>
            </div>
          </form>
        </PosPanel>
      </div>
    </PosPageColumn>
  );
}
