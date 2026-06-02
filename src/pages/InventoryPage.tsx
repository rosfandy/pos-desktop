'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowClockwise, ArrowsOutSimple, Scroll, ChartBar, Cube } from 'phosphor-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectPositioner, SelectContent, SelectItem } from '@/components/ui/select';
import ProductSearchInput from '@/components/inventory/ProductSearchInput';
import StockInForm from '@/components/inventory/StockInForm';
import StockOutForm from '@/components/inventory/StockOutForm';
import AdjustmentForm from '@/components/inventory/AdjustmentForm';
import InventoryLogTable from '@/components/inventory/InventoryLogTable';
import StockMovementReport from '@/components/inventory/StockMovementReport';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useAuthStore } from '@/stores/authStore';
import type { StockInLine } from '@/components/inventory/StockInForm';
import type { StockOutLine } from '@/components/inventory/StockOutForm';
import type { AdjustmentLine } from '@/components/inventory/AdjustmentForm';
import type { ProductRow } from '@/lib/api';
import {
  PosPage, PosSideMenu, PosSideMenuHeader, PosSideMenuNav, PosSideMenuItem,
  PosPanel, PosButton, PosForm, PosFormSection, PosLabel, PosHint,
} from '@/components/ui/pos-ui';

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'in' | 'out' | 'adjust' | 'transfer' | 'movement' | 'log';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'in',       label: 'Stok Masuk',   icon: ArrowDown },
  { id: 'out',      label: 'Stok Keluar',  icon: ArrowUp },
  { id: 'adjust',   label: 'Penyesuaian',  icon: ArrowClockwise },
  { id: 'transfer', label: 'Transfer',     icon: ArrowsOutSimple },
  { id: 'movement', label: 'Laporan',      icon: ChartBar },
  { id: 'log',      label: 'Riwayat',      icon: Scroll },
];

const TAB_TITLES: Record<Tab, string> = {
  in: 'Stok Masuk', out: 'Stok Keluar', adjust: 'Penyesuaian Stok',
  transfer: 'Transfer Lokasi', movement: 'Laporan Pergerakan Stok', log: 'Riwayat Inventaris',
};

// ── Transfer Form (inline) ────────────────────────────────────────────────────

function TransferForm({ onDone }: { onDone?: () => void }) {
  const { locations, fetchLocations } = useInventoryStore();
  const transferStock = useInventoryStore((s) => s.transferStock);
  const { user } = useAuthStore();

  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [conversionFactor, setConversionFactor] = useState('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeLocations = locations.filter((l) => l.isActive);
  const toLocOptions = activeLocations.filter((l) => l.id !== fromLocation);
  const productId = selectedProduct?.id ?? '';
  const currentStock = selectedProduct?.stock ?? 0;
  const baseQty = (parseFloat(quantity) || 0) * (parseFloat(conversionFactor) || 1);
  const isValid = productId && toLocation && baseQty > 0 && baseQty <= currentStock && reason.trim() && toLocation !== fromLocation;

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  useEffect(() => {
    if (activeLocations.length > 0 && !fromLocation) {
      const main = activeLocations.find((l) => l.type === 'store') || activeLocations[0]!;
      setFromLocation(main.id);
    }
  }, [activeLocations, fromLocation]);

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await transferStock({
        productId,
        fromLocationId: fromLocation,
        toLocationId: toLocation,
        quantity: parseFloat(quantity),
        unit,
        conversionFactor: parseFloat(conversionFactor) || 1,
        reason,
        userId: user?.id ?? 'system',
      });
      setSelectedProduct(null);
      setToLocation('');
      setQuantity('');
      setReason('');
      onDone?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PosForm className="max-w-xl">
      <PosFormSection className="flex items-center gap-2">
        <ArrowsOutSimple weight="fill" className="w-4 h-4 text-violet-600" />
        <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wide">Transfer Stok</span>
      </PosFormSection>

      <div className="space-y-1">
        <PosLabel>Produk</PosLabel>
        <ProductSearchInput
          value={productId}
          productName={selectedProduct?.name ?? ''}
          onSelect={(p) => { setSelectedProduct(p); setUnit(p.baseUnit || 'pcs'); }}
          onClear={() => setSelectedProduct(null)}
          placeholder="Cari produk…"
        />
      </div>

      {selectedProduct && (
        <PosHint>Stok saat ini: <b className="text-neutral-700">{currentStock} {selectedProduct.baseUnit}</b></PosHint>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <PosLabel tone="danger">Dari Lokasi</PosLabel>
          <Select value={fromLocation} onValueChange={(v) => { if (v) setFromLocation(v); }}>
            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectPositioner><SelectContent>
              {activeLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent></SelectPositioner>
          </Select>
        </div>
        <div className="space-y-1">
          <PosLabel tone="success">Ke Lokasi</PosLabel>
          <Select value={toLocation} onValueChange={(v) => { if (v) setToLocation(v); }}>
            <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Pilih…" /></SelectTrigger>
            <SelectPositioner><SelectContent>
              {toLocOptions.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent></SelectPositioner>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <PosLabel>Jumlah</PosLabel>
          <Input type="number" min={0} step={0.01} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="h-8 text-[11px]" />
        </div>
        <div className="space-y-1">
          <PosLabel>Satuan</PosLabel>
          <Select value={unit} onValueChange={(v) => { if (v) setUnit(v); }}>
            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectPositioner><SelectContent>
              <SelectItem value="pcs">pcs</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="lusin">lusin</SelectItem>
              <SelectItem value="dus">dus</SelectItem>
            </SelectContent></SelectPositioner>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <PosLabel>Faktor Konversi</PosLabel>
        <Input type="number" min={0.01} step={0.01} value={conversionFactor} onChange={(e) => setConversionFactor(e.target.value)} className="h-8 text-[11px]" />
      </div>

      <div className="space-y-1">
        <PosLabel>Alasan</PosLabel>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: Restok gudang" className="h-8 text-[11px]" />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
        {onDone && <PosButton variant="secondary" onClick={onDone}>Batal</PosButton>}
        <PosButton variant="primary" disabled={!isValid || submitting} onClick={handleSubmit}>
          {submitting ? 'Memindah…' : 'Transfer'}
        </PosButton>
      </div>
    </PosForm>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab') as Tab | null;
    return t && ['in','out','adjust','transfer','movement','log'].includes(t) ? t : 'in';
  });
  const [initialProductId] = useState<string | null>(() => searchParams.get('productId') || null);

  useEffect(() => {
    if (initialProductId || searchParams.get('tab')) setSearchParams({}, { replace: true });
  }, []);

  const stockIn = useInventoryStore((s) => s.stockIn);
  const stockOut = useInventoryStore((s) => s.stockOut);
  const adjustStock = useInventoryStore((s) => s.adjustStock);
  const fetchMovement = useInventoryStore((s) => s.fetchMovement);
  const { user } = useAuthStore();

  useEffect(() => {
    if (activeTab === 'movement') fetchMovement();
  }, [activeTab, fetchMovement]);

  const handleStockInSubmit = async (lines: StockInLine[]) => {
    for (const line of lines) await stockIn({ ...line, userId: user?.id ?? 'system' });
  };
  const handleStockOutSubmit = async (lines: StockOutLine[]) => {
    for (const line of lines) await stockOut({ ...line, userId: user?.id ?? 'system' });
  };
  const handleAdjustSubmit = async (lines: AdjustmentLine[]) => {
    for (const line of lines) await adjustStock({ ...line, userId: user?.id ?? 'system' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'in':       return <StockInForm onSubmit={handleStockInSubmit} onDone={() => setActiveTab('log')} initialProductId={initialProductId ?? undefined} />;
      case 'out':      return <StockOutForm onSubmit={handleStockOutSubmit} onDone={() => setActiveTab('log')} />;
      case 'adjust':   return <AdjustmentForm onSubmit={handleAdjustSubmit} onDone={() => setActiveTab('log')} />;
      case 'transfer': return <TransferForm onDone={() => setActiveTab('log')} />;
      case 'movement': return <StockMovementReport />;
      case 'log':      return <InventoryLogTable />;
      default:         return null;
    }
  };

  return (
    <PosPage>
      {/* Side menu */}
      <PosSideMenu className="w-36">
        <PosSideMenuHeader>
          <Cube weight="fill" className="w-3.5 h-3.5 text-indigo-600 mr-1.5 inline-block" />
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Inventaris</span>
        </PosSideMenuHeader>
        <PosSideMenuNav>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <PosSideMenuItem
              key={id}
              active={activeTab === id}
              onClick={() => setActiveTab(id)}
            >
              <Icon weight={activeTab === id ? 'fill' : 'regular'} className="w-3.5 h-3.5 shrink-0" />
              {label}
            </PosSideMenuItem>
          ))}
        </PosSideMenuNav>
      </PosSideMenu>

      {/* Content panel */}
      <PosPanel>
        {/* Panel header */}
        <div className="h-12 px-4 border-b border-neutral-200 flex items-center bg-neutral-50 shrink-0">
          <h2 className="text-[12px] font-semibold text-neutral-800">{TAB_TITLES[activeTab]}</h2>
        </div>
        {/* Panel body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {renderContent()}
        </div>
      </PosPanel>
    </PosPage>
  );
}
