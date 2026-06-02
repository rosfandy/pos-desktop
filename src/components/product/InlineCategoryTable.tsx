'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { CategoryRow } from '@/lib/api';
import {
  Plus,
  FloppyDisk,
  XCircle,
  PencilSimple,
  Trash,
  ArrowCounterClockwise,
  Tag,
} from 'phosphor-react';
import { PosTable, PosTableHead } from '@/components/ui/table';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EditingCatRow {
  id: string; // existing id or 'new-<timestamp>'
  isNew: boolean;
  name: string;
  parentId: string;
  isActive: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: unknown, fallback?: T): T | null {
  if (res && typeof res === 'object' && 'ok' in res) {
    const r = res as { ok: boolean; data?: T; error?: { code: string; message: string } };
    if (r.ok && r.data !== undefined) return r.data as T;
  }
  return (fallback ?? null) as T | null;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function InlineCategoryTable() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [editingRows, setEditingRows] = useState<Map<string, EditingCatRow>>(new Map());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load categories directly from API
  const loadCategories = useCallback(async () => {
    try {
      const res: any = await window.api.categoryList();
      const data = unwrap<CategoryRow[]>(res, []);
      setCategories(data ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const flatTree = useMemo(() => {
    const result: (CategoryRow & { depth: number })[] = [];

    const walk = (parentId: string | null, depth: number) => {
      const children = categories.filter((c) => c.parentId === parentId);
      for (const child of children) {
        result.push({ ...child, depth });
        walk(child.id, depth + 1);
      }
    };

    walk(null, 0);
    return result;
  }, [categories]);

  // ── Parent options (exclude self and descendants to prevent circular refs) ─
  const getParentOptions = useCallback(
    (currentId: string | null) => {
      const exclude = new Set<string>();
      if (currentId) {
        exclude.add(currentId);
        // Exclude all descendants
        const addDescendants = (id: string) => {
          for (const c of categories) {
            if (c.parentId === id) {
              exclude.add(c.id);
              addDescendants(c.id);
            }
          }
        };
        addDescendants(currentId);
      }
      return categories.filter((c) => !exclude.has(c.id));
    },
    [categories]
  );

  // ── Inline edit handlers ────────────────────────────────────────────────────

  const startEdit = useCallback((cat: CategoryRow) => {
    setEditingRows((prev) => {
      const next = new Map(prev);
      next.set(cat.id, {
        id: cat.id,
        isNew: false,
        name: cat.name,
        parentId: cat.parentId || '',
        isActive: cat.isActive,
      });
      return next;
    });
  }, []);

  const addNewRow = useCallback(() => {
    const tempId = `new-${Date.now()}`;
    setEditingRows((prev) => {
      const next = new Map(prev);
      next.set(tempId, { id: tempId, isNew: true, name: '', parentId: '', isActive: true });
      return next;
    });
  }, []);

  const cancelEdit = useCallback((id: string) => {
    setEditingRows((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateField = useCallback((id: string, field: keyof EditingCatRow, value: string | boolean) => {
    setEditingRows((prev) => {
      const next = new Map(prev);
      const row = prev.get(id);
      if (row) next.set(id, { ...row, [field]: value });
      return next;
    });
  }, []);

  const saveRow = useCallback(
    async (id: string) => {
      const row = editingRows.get(id);
      if (!row || !row.name.trim()) return;

      setSavingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      try {
        if (row.isNew) {
          const res = await window.api.categoryCreate({
            name: row.name.trim(),
            parentId: row.parentId || null,
            isActive: row.isActive,
          });
          if (res && !res.ok) {
            alert(res.error?.message || 'Gagal membuat kategori');
            return;
          }
        } else {
          const res = await window.api.categoryUpdate(id, {
            name: row.name.trim(),
            parentId: row.parentId || null,
            isActive: row.isActive,
          });
          if (res && !res.ok) {
            alert(res.error?.message || 'Gagal memperbarui kategori');
            return;
          }
        }

        cancelEdit(id);
        loadCategories();
      } catch {
        alert('Gagal menyimpan kategori');
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [editingRows, cancelEdit, loadCategories]
  );

  const handleDelete = useCallback(
    async (catId: string) => {
      try {
        const res = await window.api.categoryDelete(catId);
        if (res && res.ok) {
          setDeleteConfirmId(null);
          setDeleteConfirmText('');
          loadCategories();
        } else {
          alert(res?.error?.message || 'Gagal menghapus kategori');
        }
      } catch {
        alert('Gagal menghapus kategori');
      }
    },
    [loadCategories]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveRow(id);
      } else if (e.key === 'Escape') {
        cancelEdit(id);
      }
    },
    [saveRow, cancelEdit]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        <div className="text-[13px]">Memuat kategori…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-9 border-b border-border bg-card text-card-foreground px-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[12px] font-medium text-neutral-700">Kategori</span>
          <span className="text-[10px] text-neutral-400 tabular-nums">({categories.length})</span>
        </div>

        <Button
          onClick={addNewRow}
          variant="default"
          size="xs"
          className="h-7 px-2 text-[10px] bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-3 h-3" />
          Tambah Baris
        </Button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <PosTable className="[&_td]:border-r [&_th]:border-r [&_td]:border-neutral-200 [&_th]:border-neutral-200">
          <PosTableHead>
            <tr className="bg-neutral-50 border-b-2 border-neutral-300">
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase w-8">No</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase">Nama Kategori</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase">Induk</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-center">Produk</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-center w-14">Aktif</th>
              <th className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase text-center w-24">Aksi</th>
            </tr>
          </PosTableHead>
          <tbody>
            {/* ── New rows (editing) ──── */}
            {[...editingRows.entries()]
              .filter(([, row]) => row.isNew)
              .map(([id, row]) => (
                <tr key={id} className="bg-amber-50/60 border-b border-amber-100">
                  <td className="px-2 py-1.5 text-[11px] text-amber-600 font-medium">✦</td>
                  <td className="px-1.5 py-1.5">
                    <Input
                      value={row.name}
                      onChange={(e) => updateField(id, 'name', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, id)}
                      placeholder="Nama kategori *"
                      autoFocus
                      className={cn(
                        'h-7 text-[11px]',
                        !row.name.trim() ? 'border-red-300 focus:ring-red-300' : ''
                      )}
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <select
                      value={row.parentId}
                      onChange={(e) => updateField(id, 'parentId', e.target.value)}
                      className="w-full h-7 text-[11px] border border-neutral-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">— Tanpa Induk —</option>
                      {getParentOptions(null).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-400 text-center">—</td>
                  <td className="px-2 py-1.5 text-center">
                    <Checkbox
                      defaultChecked={row.isActive}
                      onCheckedChange={(checked) => updateField(id, 'isActive', checked as boolean)}
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => saveRow(id)} disabled={savingIds.has(id) || !row.name.trim()} className="text-emerald-600 hover:bg-emerald-50" title="Simpan (Enter)">
                        <FloppyDisk className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => cancelEdit(id)} className="text-neutral-400 hover:text-red-500 hover:bg-red-50" title="Batal (Esc)">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

            {/* ── Existing rows ──── */}
            {flatTree.map((cat, idx) => {
              const editing = editingRows.get(cat.id);
              const isEditing = !!editing;

              if (isEditing && editing) {
                return (
                  <tr key={cat.id} className="bg-amber-50/40 border-b border-amber-100">
                    <td className="px-2 py-1.5 text-[11px] text-amber-600 tabular-nums">✏ {idx + 1}</td>
                    <td className="px-1.5 py-1.5" style={{ paddingLeft: `${(cat.depth || 0) * 20 + 8}px` }}>
                      <Input
                        value={editing.name}
                        onChange={(e) => updateField(cat.id, 'name', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, cat.id)}
                        className={cn(
                          'h-7 text-[11px]',
                          !editing.name.trim() ? 'border-red-300 focus:ring-red-300' : ''
                        )}
                        autoFocus
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <select
                        value={editing.parentId}
                        onChange={(e) => updateField(cat.id, 'parentId', e.target.value)}
                        className="w-full h-7 text-[11px] border border-neutral-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">— Tanpa Induk —</option>
                        {getParentOptions(cat.id).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-neutral-400 text-center tabular-nums">{cat.productCount}</td>
                    <td className="px-2 py-1.5 text-center">
                      <Checkbox
                        defaultChecked={editing.isActive}
                        onCheckedChange={(checked) => updateField(cat.id, 'isActive', checked as boolean)}
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => saveRow(cat.id)} disabled={savingIds.has(cat.id) || !editing.name.trim()} className="text-emerald-600 hover:bg-emerald-50" title="Simpan (Enter)">
                          <FloppyDisk className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => cancelEdit(cat.id)} className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100" title="Batal (Esc)">
                          <ArrowCounterClockwise className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }

              // ── Read mode row ────
              return (
                <tr
                  key={cat.id}
                  className={cn(
                    'border-b border-neutral-100 transition-colors hover:bg-neutral-50',
                    !cat.isActive && 'opacity-50 bg-neutral-50/50'
                  )}
                >
                  <td className="px-2 py-1.5 text-[11px] text-neutral-400 tabular-nums">{idx + 1}</td>
                  <td className="px-2 py-1.5" style={{ paddingLeft: `${(cat.depth || 0) * 20 + 8}px` }}>
                    <div className="flex items-center gap-1.5">
                      {cat.depth > 0 && <span className="text-neutral-300">└</span>}
                      <span className="text-[12px] font-medium text-neutral-800">{cat.name}</span>
                      {!cat.isActive && <span className="text-[9px] text-neutral-400">(nonaktif)</span>}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-500">
                    {cat.parentId ? categories.find((c) => c.id === cat.parentId)?.name || '—' : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-neutral-500 text-center tabular-nums">{cat.productCount}</td>
                  <td className="px-2 py-1.5 text-center">
                    {cat.isActive ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Aktif" />
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-neutral-300" title="Nonaktif" />
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => startEdit(cat)}
                        className="text-neutral-400 hover:text-amber-600 hover:bg-amber-50"
                        title="Edit"
                      >
                        <PencilSimple className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setDeleteConfirmId(cat.id);
                          setDeleteConfirmText('');
                        }}
                        className="text-neutral-400 hover:text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {flatTree.length === 0 && editingRows.size === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center text-neutral-400">
                    <Tag className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[13px] font-medium">Belum ada kategori</p>
                    <p className="text-[11px] mt-1">Klik "Tambah Baris" untuk menambah kategori baru</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </PosTable>
      </div>

      {/* ── Delete confirmation bar ──────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-2.5 flex items-center gap-3">
          <p className="text-[11px] text-red-700">Hapus kategori ini?</p>
          <Input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder='Ketik "HAPUS" untuk konfirmasi'
            className="max-w-xs h-7 text-[11px] border-red-300 focus:ring-red-400"
          />
          <Button
            variant="destructive"
            size="xs"
            onClick={() => handleDelete(deleteConfirmId)}
            disabled={deleteConfirmText !== 'HAPUS'}
          >
            Hapus
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setDeleteConfirmId(null);
              setDeleteConfirmText('');
            }}
            className="text-neutral-500"
          >
            Batal
          </Button>
        </div>
      )}
    </div>
  );
}