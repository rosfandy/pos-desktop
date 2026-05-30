'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  MagnifyingGlass,
  X,
  User,
  Phone,
  Plus,
} from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerSearchProps {
  className?: string;
  onSelect?: (customer: {
    id: string;
    name: string;
    phone: string | null;
    tier: string;
    points: number;
  }) => void;
  onCreateNew?: (name: string) => void;
}

// ─── Tier Badge ────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  bronze:   { bg: 'bg-orange-100', text: 'text-orange-700' },
  silver:   { bg: 'bg-slate-100', text: 'text-slate-600' },
  gold:     { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  platinum: { bg: 'bg-violet-100', text: 'text-violet-700' },
};

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CustomerSearch({ className, onSelect, onCreateNew }: CustomerSearchProps) {
  const { customers, isLoading, fetchCustomers } = useCustomerStore();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered customers — show all, limit to 10
  const filtered = useMemo(() => {
    if (!query.trim()) return customers.slice(0, 10);
    const q = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone?.toLowerCase().includes(q) ?? false)
    ).slice(0, 10);
  }, [customers, query]);

  // ── Select customer ──────────────────────────────────────────────────────────
  const handleSelect = useCallback((customer: typeof customers[0]) => {
    onSelect?.({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      tier: customer.tier,
      points: customer.points,
    });
    setQuery(customer.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onSelect]);

  // ── Create new customer (delegated to parent via onCreateNew) ─────────────────
  // When user types a new name and presses Enter, we notify parent to create it.
  // Parent handles actual creation and calls onSelect when done.

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen && e.key !== 'Escape') {
      setIsOpen(true);
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex]);
        } else if (query.trim() && onCreateNew) {
          onCreateNew?.(query.trim());
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, filtered, highlightedIndex, query, handleSelect, onCreateNew]);

  // Reset highlight when query changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="relative">
        <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cari nama atau telepon…"
          className="w-full h-6 pl-7 pr-7 text-[12px]!"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => { setQuery(''); setIsOpen(true); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading && filtered.length === 0 ? (
            <div className="px-3 py-4 text-[12px] text-neutral-400 text-center">
              Memuat…
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((customer, idx) => {
              const tierStyle = TIER_COLORS[customer.tier] || TIER_COLORS.bronze;
              const isHighlighted = idx === highlightedIndex;

              return (
                <Button
                  key={customer.id}
                  variant="ghost"
                  onClick={() => handleSelect(customer)}
                  className={cn(
                    'w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors justify-start',
                    isHighlighted ? 'bg-indigo-50' : 'hover:bg-neutral-50'
                  )}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-neutral-800 truncate">
                      {customer.name}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                      {customer.phone && (
                        <span className="flex items-center gap-0.5 font-mono">
                          <Phone className="w-2.5 h-2.5" />
                          {customer.phone}
                        </span>
                      )}
                      <span className={cn('px-1 rounded font-medium', tierStyle.bg, tierStyle.text)}>
                        {TIER_LABEL[customer.tier]}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-500 shrink-0">
                    {customer.points.toLocaleString('id-ID')} poin
                  </div>
                </Button>
              );
            })
          ) : (
            <div className="px-3 py-4">
              <p className="text-[12px] text-neutral-400 text-center mb-2">
                {query.trim() ? `"${query}" tidak ditemukan` : 'Tidak ada pelanggan'}
              </p>
              {query.trim() && onCreateNew && (
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => onCreateNew?.(query.trim())}
                  className="w-full flex items-center justify-center gap-1.5 h-8 text-[12px] text-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat "{query.trim()}" sebagai pelanggan baru
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
