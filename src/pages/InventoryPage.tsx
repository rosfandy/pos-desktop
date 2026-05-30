'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Package, ArrowDown, ArrowUp, ArrowClockwise, ArrowsOutSimple, Scroll, ChartBar } from 'phosphor-react';
import StockInForm from '@/components/inventory/StockInForm';
import StockOutForm from '@/components/inventory/StockOutForm';
import AdjustmentForm from '@/components/inventory/AdjustmentForm';
import InventoryLogTable from '@/components/inventory/InventoryLogTable';
import StockMovementReport from '@/components/inventory/StockMovementReport';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectPositioner, SelectContent, SelectItem } from '@/components/ui/select';
import type { StockInLine } from '@/components/inventory/StockInForm';
import type { StockOutLine } from '@/components/inventory/StockOutForm';
import type { AdjustmentLine } from '@/components/inventory/AdjustmentForm';
import ProductSearchInput from '@/components/inventory/ProductSearchInput';
import type { ProductRow } from '@/lib/api';

type Tab = 'in' | 'out' | 'adjust' | 'transfer' | 'movement' | 'log';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'in',       label: 'Stok Masuk',  icon: ArrowDown },
  { id: 'out',      label: 'Stok Keluar', icon: ArrowUp },
  { id: 'adjust',   label: 'Penyesuaian', icon: ArrowClockwise },
  { id: 'transfer', label: 'Transfer',    icon: ArrowsOutSimple },
  { id: 'movement', label: 'Laporan',     icon: ChartBar },
  { id: 'log',      label: 'Riwayat',     icon: Scroll },
];

// ─── Transfer Form (inline) ─────────────────────────────────────────────────────

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
  const fromLocOptions = activeLocations;
  const toLocOptions = activeLocations.filter((l) => l.id !== fromLocation);

  const productId = selectedProduct?.id ?? '';
  const currentStock = selectedProduct?.stock ?? 0;
  const baseQty = (parseFloat(quantity) || 0) * (parseFloat(conversionFactor) || 1);
  const isValid = productId && toLocation && baseQty > 0 && baseQty <= currentStock && reason.trim() && toLocation !== fromLocation;

  // Fetch data on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Auto-select first active location as source when locations load
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
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ArrowsOutSimple weight="fill" className="w-4 h-4 text-violet-600" />
        <h3 className="text-[12px] font-semibold text-neutral-800">Transfer Stok Antar Lokasi</h3>
      </div>

      {/* Product search */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Produk</label>
        <ProductSearchInput
          value={productId}
          productName={selectedProduct?.name ?? ''}
          onSelect={(p) => { setSelectedProduct(p); setUnit(p.baseUnit || 'pcs'); }}
          onClear={() => setSelectedProduct(null)}
          placeholder="Cari produk…"
        />
      </div>

      {selectedProduct && (
        <div className="text-[10px] text-neutral-500 -mt-2">
          Stok saat ini: <b className="text-neutral-700">{currentStock} {selectedProduct.baseUnit}</b>
        </div>
      )}

      {/* From / To locations */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">Dari Lokasi</label>
          <Select
            value={fromLocation}
            onValueChange={(val: string | null) => { if (!val) return; setFromLocation(val); }}
          >
            <SelectTrigger className="w-full h-9 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectPositioner>
              <SelectContent>
                {fromLocOptions.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Ke Lokasi</label>
          <Select
            value={toLocation}
            onValueChange={(val: string | null) => { if (!val) return; setToLocation(val); }}
          >
            <SelectTrigger className="w-full h-9 text-[12px]">
              <SelectValue placeholder="Pilih lokasi tujuan…" />
            </SelectTrigger>
            <SelectPositioner>
              <SelectContent>
                {toLocOptions.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </Select>
        </div>
      </div>

      {/* Qty + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Jumlah</label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className={cn('h-9 text-[12px]', baseQty > currentStock ? 'border-red-300' : '')}
          />
          {baseQty > currentStock && (
            <p className="text-[10px] text-red-500">Tersedia {currentStock}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Satuan</label>
          <Select
            value={unit}
            onValueChange={(val: string | null) => { if (!val) return; setUnit(val); }}
          >
            <SelectTrigger className="w-full h-9 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectPositioner>
              <SelectContent>
                <SelectItem value="pcs">pcs</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lusin">lusin</SelectItem>
                <SelectItem value="dus">dus</SelectItem>
              </SelectContent>
            </SelectPositioner>
          </Select>
        </div>
      </div>

      {/* Conversion factor */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Faktor Konversi (ke satuan dasar)</label>
        <Input
          type="number"
          min={0.01}
          step={0.01}
          value={conversionFactor}
          onChange={(e) => setConversionFactor(e.target.value)}
          className="h-9 text-[12px]"
        />
      </div>

      {/* Reason */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wide">Alasan Transfer</label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Contoh: Restock gudang, perbaikan stok"
          className="h-9 text-[12px]"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
        {onDone && (
          <Button variant="outline" size="sm" onClick={onDone} className="h-8 text-[11px]">
            Batal
          </Button>
        )}
        <Button
          size="sm"
          disabled={!isValid || submitting}
          onClick={handleSubmit}
          className="h-8 text-[11px] bg-violet-600 hover:bg-violet-700"
        >
          {submitting ? 'Memindahkan…' : 'Transfer Stok'}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tabParam = searchParams.get('tab') as Tab | null;
    if (tabParam && TABS.some((t) => t.id === tabParam)) return tabParam;
    return 'in';
  });
  const [initialProductId] = useState<string | null>(() => searchParams.get('productId') || null);

  // Bersihkan query params setelah dibaca
  useEffect(() => {
    if (initialProductId || searchParams.get('tab')) {
      setSearchParams({}, { replace: true });
    }
  }, []); // sekali di mount

  const stockIn = useInventoryStore((s) => s.stockIn);
  const stockOut = useInventoryStore((s) => s.stockOut);
  const adjustStock = useInventoryStore((s) => s.adjustStock);
  const fetchMovement = useInventoryStore((s) => s.fetchMovement);

  useEffect(() => {
    if (activeTab === 'movement') {
      fetchMovement();
    }
  }, [activeTab, fetchMovement]);

  const { user } = useAuthStore();

  const handleStockInSubmit = async (lines: StockInLine[]) => {
    for (const line of lines) {
      await stockIn({
        productId: line.productId,
        quantity: line.quantity,
        unit: line.unit,
        conversionFactor: line.conversionFactor,
        reason: line.reason,
        userId: user?.id ?? 'system',
      });
    }
  };

  const handleStockOutSubmit = async (lines: StockOutLine[]) => {
    for (const line of lines) {
      await stockOut({
        productId: line.productId,
        quantity: line.quantity,
        unit: line.unit,
        conversionFactor: line.conversionFactor,
        reason: line.reason,
        userId: user?.id ?? 'system',
      });
    }
  };

  const handleAdjustSubmit = async (lines: AdjustmentLine[]) => {
    for (const line of lines) {
      await adjustStock({
        productId: line.productId,
        newQuantity: line.newQuantity,
        unit: line.unit,
        conversionFactor: line.conversionFactor,
        reason: line.reason,
        userId: user?.id ?? 'system',
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-12 flex items-center px-4 border-b border-neutral-200 bg-white">
        <Package weight="fill" className="w-4 h-4 text-indigo-600 mr-2" />
        <span className="text-[12px] font-semibold text-neutral-800">Inventaris</span>

        {/* Tabs */}
        <div className="flex items-center ml-6 gap-0.5 bg-neutral-100 rounded-lg p-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Icon weight={isActive ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'in' && (
          <div className="h-full overflow-y-auto">
            <StockInForm onSubmit={handleStockInSubmit} onDone={() => setActiveTab('log')} initialProductId={initialProductId ?? undefined} />
          </div>
        )}
        {activeTab === 'out' && (
          <div className="h-full overflow-y-auto">
            <StockOutForm onSubmit={handleStockOutSubmit} onDone={() => setActiveTab('log')} />
          </div>
        )}
        {activeTab === 'adjust' && (
          <div className="h-full overflow-y-auto">
            <AdjustmentForm onSubmit={handleAdjustSubmit} onDone={() => setActiveTab('log')} />
          </div>
        )}
        {activeTab === 'transfer' && (
          <div className="h-full overflow-y-auto">
            <TransferForm onDone={() => setActiveTab('log')} />
          </div>
        )}
        {activeTab === 'movement' && (
          <div className="h-full overflow-hidden">
            <StockMovementReport />
          </div>
        )}
        {activeTab === 'log' && <InventoryLogTable />}
      </div>
    </div>
  );
}
