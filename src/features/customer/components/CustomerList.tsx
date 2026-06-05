'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import CustomerSearch from '@/components/fragments/customer-search';
import { DataTable } from '@/components/fragments/data-table';
import {
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
  const [selectedSearchCustomerId, setSelectedSearchCustomerId] = useState<string | null>(null);
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

    if (selectedSearchCustomerId) {
      list = list.filter((c) => c.id === selectedSearchCustomerId);
    } else if (search.trim()) {
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
      <div className="shrink-0 border-b border-neutral-200 px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <CustomerSearch
              className="w-full"
              value={search}
              onQueryChange={(q) => {
                setSearch(q);
                setSelectedSearchCustomerId(null);
              }}
              onSelect={(customer) => {
                setSearch(customer.name);
                setSelectedSearchCustomerId(customer.id);
              }}
            />
          </div>
          {(search || selectedSearchCustomerId) && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSearch('');
                setSelectedSearchCustomerId(null);
              }}
              className="h-7 text-[11px]"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <DataTable
          data={filtered}
          getRowKey={(customer) => customer.id}
          rowClassName={(customer) => selectedIds.has(customer.id) ? 'bg-indigo-50/40' : undefined}
          emptyMessage={
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
              <User className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-[13px] font-medium">Pelanggan tidak ditemukan</p>
              <p className="text-[11px] mt-1">Coba kata kunci lain</p>
            </div>
          }
          columns={[
            {
              key: 'select',
              header: onSelectionChange ? (
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={toggleSelectAll}
                  className="w-3.5 h-3.5"
                />
              ) : null,
              headerClassName: 'w-10',
              cellClassName: 'w-10',
              render: (customer) => onSelectionChange ? (
                <Checkbox
                  checked={selectedIds.has(customer.id)}
                  onCheckedChange={() => toggleSelect(customer.id)}
                  className="w-3.5 h-3.5"
                />
              ) : null,
            },
            {
              key: 'no',
              header: 'No',
              headerClassName: 'w-10',
              cellClassName: 'text-neutral-400 tabular-nums w-10',
              render: (_, i) => i + 1,
            },
            {
              key: 'name',
              header: (
                <span className="flex items-center gap-0.5">
                  Nama
                  {sortKey === 'name' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              onHeaderClick: () => toggleSort('name'),
              render: (customer) => (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="w-2.5 h-2.5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-neutral-800 truncate max-w-[180px]">{customer.name}</p>
                    {customer.address && <p className="text-[10px] text-neutral-400 truncate max-w-[180px]">{customer.address}</p>}
                  </div>
                </div>
              ),
            },
            {
              key: 'phone',
              header: 'Telepon',
              render: (customer) => customer.phone ? (
                <span className="text-[11px] text-neutral-600 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  {customer.phone}
                </span>
              ) : <span className="text-[11px] text-neutral-300">—</span>,
            },
            {
              key: 'tier',
              header: (
                <span className="flex items-center gap-0.5">
                  Tier
                  {sortKey === 'tier' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              onHeaderClick: () => toggleSort('tier'),
              render: (customer) => {
                const tierStyle = TIER_COLORS[customer.tier] || TIER_COLORS.bronze;
                return (
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', tierStyle.bg, tierStyle.text, tierStyle.border)}>
                    {TIER_LABEL[customer.tier] || customer.tier}
                  </span>
                );
              },
            },
            {
              key: 'points',
              header: (
                <span className="flex items-center justify-end gap-0.5">
                  Poin
                  {sortKey === 'points' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              headerClassName: 'text-right',
              cellClassName: 'text-center tabular-nums font-medium text-indigo-600',
              onHeaderClick: () => toggleSort('points'),
              render: (customer) => customer.points.toLocaleString('id-ID'),
            },
            {
              key: 'totalSpent',
              header: (
                <span className="flex items-center justify-end gap-0.5">
                  Total Belanja
                  {sortKey === 'totalSpent' && (sortDir === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
                </span>
              ),
              sortable: true,
              headerClassName: 'text-right',
              cellClassName: 'text-right tabular-nums text-neutral-600',
              onHeaderClick: () => toggleSort('totalSpent'),
              render: (customer) => `Rp${(customer.totalSpent / 100).toLocaleString('id-ID')}`,
            },
            {
              key: 'actions',
              header: 'Aksi',
              headerClassName: 'text-center w-20',
              cellClassName: 'text-center',
              render: (customer) => {
                const isDeleting = deletingId === customer.id;
                return (
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => onEdit?.(customer.id)} className="text-neutral-400 hover:text-amber-600 hover:bg-amber-50" title="Edit">
                      <PencilSimple className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(customer.id)} disabled={isDeleting} className="text-neutral-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40" title="Hapus">
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-7 flex items-center justify-between px-3 border-t border-border bg-card text-[10px] text-muted-foreground">
        <span>{filtered.length} pelanggan</span>
      </div>
    </div>
  );
}
