'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MagnifyingGlass,
  CaretUp,
  CaretDown,
  PencilSimple,
  Trash,
  User,
  Phone,
} from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerListProps {
  className?: string;
  onEdit?: (customerId: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

type SortKey = 'name' | 'points' | 'totalSpent' | 'tier';
type SortDir = 'asc' | 'desc';

// ─── Tier Badge Colors ──────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze:   { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  silver:   { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  gold:     { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  platinum: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CustomerList({
  className,
  onEdit,
  selectedIds = new Set(),
  onSelectionChange,
}: CustomerListProps) {
  const { customers, fetchCustomers, deleteCustomer } = useCustomerStore();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = customers;

    // Search: name OR phone
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone?.toLowerCase().includes(q) ?? false)
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'id');
          break;
        case 'points':
          cmp = a.points - b.points;
          break;
        case 'totalSpent':
          cmp = a.totalSpent - b.totalSpent;
          break;
        case 'tier':
          cmp = a.tier.localeCompare(b.tier);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [customers, search, sortKey, sortDir]);

  // ── Selection ───────────────────────────────────────────────────────────────

  const isAllSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const isIndeterminate = !isAllSelected && filtered.some((c) => selectedIds.has(c.id));

  const toggleSelect = useCallback((id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }, [selectedIds, onSelectionChange]);

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(filtered.map((c) => c.id)));
    }
  }, [filtered, isAllSelected, onSelectionChange]);

  // ── Sort toggle ─────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  };

  // ── Delete handler ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Hapus pelanggan ini?')) return;
    setDeletingId(id);
    await deleteCustomer(id);
    setDeletingId(null);
  }, [deleteCustomer]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-3 py-2">
        <div className="relative">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau telepon…"
            className="w-full h-8 pl-8 pr-3 text-[12px]"
          />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white">
        <table className="w-full text-left border-collapse [&_td]:border-r [&_th]:border-r [&_td]:border-neutral-200 [&_th]:border-neutral-200">
          <thead className="sticky top-0 z-10">
            <tr className="bg-neutral-50 border-b-2 border-neutral-300">
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-10">
                {onSelectionChange && (
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onCheckedChange={toggleSelectAll}
                    className="w-3.5 h-3.5"
                  />
                )}
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-10">
                No
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('name')}
              >
                <span className="flex items-center gap-0.5">
                  Nama
                  {sortKey === 'name' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Telepon
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('tier')}
              >
                <span className="flex items-center gap-0.5">
                  Tier
                  {sortKey === 'tier' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-right cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('points')}
              >
                <span className="flex items-center justify-end gap-0.5">
                  Poin
                  {sortKey === 'points' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th
                className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-right cursor-pointer hover:text-neutral-700 select-none"
                onClick={() => toggleSort('totalSpent')}
              >
                <span className="flex items-center justify-end gap-0.5">
                  Total Belanja
                  {sortKey === 'totalSpent' && (
                    sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-center w-20">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((customer, idx) => {
              const tierStyle = TIER_COLORS[customer.tier] || TIER_COLORS.bronze;
              const isDeleting = deletingId === customer.id;
              const checked = selectedIds.has(customer.id);

              return (
                <tr
                  key={customer.id}
                  className={cn(
                    'border-b transition-colors hover:bg-neutral-50',
                    checked && 'bg-indigo-50/40'
                  )}
                >
                  <td className="px-3 py-1">
                    {onSelectionChange && (
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSelect(customer.id)}
                        className="w-3.5 h-3.5"
                      />
                    )}
                  </td>
                  <td className="px-3 py-1 text-[11px] text-neutral-400 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <User className="w-2.5 h-2.5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-neutral-800 truncate max-w-[180px]">
                          {customer.name}
                        </p>
                        {customer.address && (
                          <p className="text-[10px] text-neutral-400 truncate max-w-[180px]">{customer.address}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1">
                    {customer.phone ? (
                      <span className="text-[11px] text-neutral-600 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        {customer.phone}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-1">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      tierStyle.bg, tierStyle.text, tierStyle.border
                    )}>
                      {TIER_LABEL[customer.tier] || customer.tier}
                    </span>
                  </td>
                  <td className="px-3 py-1 text-[12px] text-center tabular-nums font-medium text-indigo-600">
                    {customer.points.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-1 text-[12px] text-right tabular-nums text-neutral-600">
                    Rp{(customer.totalSpent / 100).toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onEdit?.(customer.id)}
                        className="text-neutral-400 hover:text-amber-600 hover:bg-amber-50"
                        title="Edit"
                      >
                        <PencilSimple className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(customer.id)}
                        disabled={isDeleting}
                        className="text-neutral-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                        title="Hapus"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
            <User className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-[13px] font-medium">Pelanggan tidak ditemukan</p>
            <p className="text-[11px] mt-1">Coba kata kunci lain</p>
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-7 flex items-center justify-between px-3 border-t border-neutral-200 bg-white text-[10px] text-neutral-500">
        <span>{filtered.length} pelanggan</span>
      </div>
    </div>
  );
}
