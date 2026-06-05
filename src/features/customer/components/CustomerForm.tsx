'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  User,
  Phone,
  At,
  MapPin,
  FloppyDisk,
  XCircle,
  X,
  Crown,
  Star,
} from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string | null; // if set → edit mode
}

// ─── Tier Badge ────────────────────────────────────────────────────────────────

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

function TierBadge({ tier }: { tier: string }) {
  const style = TIER_COLORS[tier] || TIER_COLORS.bronze;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border',
      style.bg, style.text, style.border
    )}>
      <Crown className="w-3 h-3" />
      {TIER_LABEL[tier] || tier}
    </span>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function emptyForm() {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    points: 0,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CustomerForm({ open, onOpenChange, customerId }: CustomerFormProps) {
  const {
    selectedCustomer,
    createCustomer,
    updateCustomer,
    selectCustomer,
    clearError,
  } = useCustomerStore();

  const isEdit = Boolean(customerId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyForm());
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset on close
  const handleClose = useCallback(() => {
    setForm(emptyForm());
    setError(null);
    setTouched({});
    selectCustomer(null);
    clearError();
    onOpenChange(false);
  }, [selectCustomer, clearError, onOpenChange]);

  // Load existing customer in edit mode
  useEffect(() => {
    if (open && customerId && isEdit) {
      setLoading(true);
      // fetchCustomerById will set selectedCustomer in the store
      // Use the API directly since store doesn't have fetchCustomerById
      window.api.customerGet(customerId).then((res: any) => {
        if (res.ok && res.data) {
          selectCustomer(res.data);
          setForm({
            name: res.data.name,
            phone: res.data.phone || '',
            email: res.data.email || '',
            address: res.data.address || '',
            points: res.data.points ?? 0,
          });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [open, customerId, isEdit, selectCustomer]);

  // Sync selectedCustomer → form (when loaded via direct fetch)
  useEffect(() => {
    if (selectedCustomer && customerId === selectedCustomer.id && !form.name) {
      setForm({
        name: selectedCustomer.name,
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
        address: selectedCustomer.address || '',
        points: selectedCustomer.points ?? 0,
      });
    }
  }, [selectedCustomer, customerId, form.name]);

  // Reset when dialog opens without customerId
  useEffect(() => {
    if (open && !customerId) {
      setForm(emptyForm());
      setError(null);
      setTouched({});
      selectCustomer(null);
    }
  }, [open, customerId, selectCustomer]);

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi';
    if (form.phone && !/^[0-9+\-\s]+$/.test(form.phone)) e.phone = 'Telepon hanya boleh angka';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email tidak valid';
    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (hasErrors) {
      setTouched({ name: true, email: true });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (isEdit && customerId) {
        result = await updateCustomer(customerId, {
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
          points: form.points,
        });
      } else {
        result = await createCustomer({
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
          points: form.points,
        });
      }

      if (result && 'error' in result) {
        setError(result.error || 'Gagal menyimpan pelanggan');
        return;
      }

      handleClose();
    } catch {
      setError('Gagal menyimpan pelanggan');
    } finally {
      setLoading(false);
    }
  }, [hasErrors, isEdit, customerId, form, createCustomer, updateCustomer, handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[520px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            {isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* ── Error Banner ─────────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-[12px] px-3 py-2 rounded-md border border-red-200">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Nama ────────────────────────────────────────────────────────────── */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-600">Nama *</label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nama pelanggan"
              className={cn('h-8 text-[12px]', touched.name && errors.name ? 'border-red-400 focus:ring-red-400' : '')}
            />
            {touched.name && errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
          </div>

          {/* ── Telepon ─────────────────────────────────────────────────────────── */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-600">Telepon</label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <Input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="08xxxxxxxxxx"
                className={cn('h-8 text-[12px] pl-8 font-mono', touched.phone && errors.phone ? 'border-red-400' : '')}
              />
            </div>
            {touched.phone && errors.phone && <p className="text-[10px] text-red-500">{errors.phone}</p>}
          </div>

          {/* ── Email ───────────────────────────────────────────────────────────── */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-600">Email</label>
            <div className="relative">
              <At className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <Input
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="email@contoh.com"
                type="email"
                className={cn('h-8 text-[12px] pl-8', touched.email && errors.email ? 'border-red-400' : '')}
              />
            </div>
            {touched.email && errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}
          </div>

          {/* ── Alamat ──────────────────────────────────────────────────────────── */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-600">Alamat</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-400" />
              <Textarea
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Alamat lengkap"
                rows={2}
                className={cn(
                  'text-[12px] pl-8 py-2 resize-none',
                )}
              />
            </div>
          </div>

          {/* ── Poin (hanya di edit) ──────────────────────────────────────────────── */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-600">Poin</label>
            <div className="relative">
              <Star className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />
              <Input
                type="number"
                min={0}
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="h-8 text-[12px] pl-8 font-mono"
              />
            </div>
            <p className="text-[10px] text-neutral-400">
              Jumlah poin loyalitas pelanggan. Poin otomatis bertambah saat transaksi menggunakan pelanggan ini.
            </p>
          </div>

          {/* ── Info tier untuk edit mode ────────────────────────────────────────── */}
          {isEdit && selectedCustomer && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md border border-neutral-200">
              <TierBadge tier={selectedCustomer.tier} />
              <div className="text-[11px] text-neutral-500">
                <span className="font-medium">{selectedCustomer.points.toLocaleString('id-ID')} poin</span>
                {' · '}
                <span>Total belanja Rp{(selectedCustomer.totalSpent / 100).toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || hasErrors}
            className="h-8 text-[12px] px-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <FloppyDisk className="w-3.5 h-3.5 mr-1" />
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-8 text-[12px] px-4"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
