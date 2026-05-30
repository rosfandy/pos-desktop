'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProductStore } from '@/stores/productStore';
import type { CategoryRow } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CaretDown,
  CaretRight,
  Plus,
  PencilSimple,
  Trash,
  X,
  FloppyDisk,
  Folder,
  FolderOpen,
  Tag,
} from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CategoryTreeProps {
  className?: string;
  selectedId?: string | null;
  onSelect?: (categoryId: string | null) => void;
  onAdd?: (parentId?: string) => void;
  onEdit?: (categoryId: string) => void;
  onDelete?: (categoryId: string) => void;
}

// ─── Recursive Category Node ───────────────────────────────────────────────────

interface TreeNode {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  productCount: number;
  children: TreeNode[];
  depth: number;
}

function buildTree(categories: CategoryRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [], depth: 0 });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      const parent = map.get(cat.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CategoryTree({
  className,
  selectedId,
  onSelect,
  onAdd,
  onEdit: _onEdit,
  onDelete: _onDelete,
}: CategoryTreeProps) {
  const { categories, fetchCategories } = useProductStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const tree = useMemo(() => buildTree(categories), [categories]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const walk = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) allIds.add(node.id);
        walk(node.children);
      }
    };
    walk(tree);
    setExpandedIds(allIds);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const startEdit = useCallback((id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId || !editName.trim()) return;
    await window.api.categoryUpdate(editingId, { name: editName.trim() });
    cancelEdit();
    fetchCategories();
  }, [editingId, editName, fetchCategories, cancelEdit]);

  const handleDelete = useCallback(async () => {
    if (!deletingId) return;
    const result = await window.api.categoryDelete(deletingId);
    if (result.ok) {
      setDeletingId(null);
      setDeleteConfirm('');
      fetchCategories();
    }
  }, [deletingId, deleteConfirm, fetchCategories]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const renderNode = (node: TreeNode) => {
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children.length > 0;
    const isEditing = editingId === node.id;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-1 h-7 px-1.5 rounded cursor-pointer transition-colors group',
            isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-neutral-100 text-neutral-700'
          )}
          style={{ paddingLeft: `${node.depth * 16 + 6}px` }}
          onClick={() => {
            if (isEditing) return;
            onSelect?.(node.id);
          }}
        >
          {/* Expand/collapse toggle */}
          {hasChildren ? (
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }} className="p-0.5 text-neutral-400 hover:text-neutral-600 shrink-0">
              {isExpanded ? <CaretDown className="w-3 h-3" /> : <CaretRight className="w-3 h-3" />}
            </Button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Folder / folder-open icon */}
          <span className="shrink-0 text-neutral-400">
            {hasChildren && isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-500" />
            )}
          </span>

          {/* Name (inline edit or display) */}
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1 min-w-0">
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                autoFocus
                className="h-6 text-[11px] border-indigo-300 focus:ring-indigo-500"
              />
              <Button variant="ghost" size="icon-xs" onClick={saveEdit} className="text-emerald-600 hover:bg-emerald-50 shrink-0">
                <FloppyDisk className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={cancelEdit} className="text-neutral-400 hover:bg-neutral-100 shrink-0">
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <span className="flex-1 text-[12px] truncate">
              {node.name}
              {!node.isActive && <span className="text-neutral-300 ml-1">(nonaktif)</span>}
            </span>
          )}

          {/* Product count badge */}
          {node.productCount > 0 && (
            <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full tabular-nums">
              {node.productCount}
            </span>
          )}

          {/* Actions (show on hover) */}
          {!isEditing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => { e.stopPropagation(); startEdit(node.id, node.name); }}
                className="text-neutral-400 hover:text-amber-600 hover:bg-amber-50"
                title="Edit nama"
              >
                <PencilSimple className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => { e.stopPropagation(); setDeletingId(node.id); }}
                className="text-neutral-400 hover:text-red-500 hover:bg-red-50"
                title="Hapus"
              >
                <Trash className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* ── Toolbar ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-neutral-200 bg-white">
        <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-600">
          <Tag className="w-3.5 h-3.5" />
          Kategori
        </span>
        <div className="flex-1" />
        <Button variant="ghost" size="xs" onClick={expandAll} className="text-[10px] text-neutral-400 hover:text-neutral-600">
          Expand
        </Button>
        <Button variant="ghost" size="xs" onClick={collapseAll} className="text-[10px] text-neutral-400 hover:text-neutral-600">
          Collapse
        </Button>
        <Button variant="ghost" size="xs" onClick={() => onAdd?.(undefined)} className="flex items-center gap-0.5 text-[10px] text-indigo-600 hover:bg-indigo-50">
          <Plus className="w-3 h-3" />
          Tambah
        </Button>
      </div>

      {/* ── Tree nodes ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Root: "Semua Kategori" pseudo-node */}
        <div
          className={cn(
            'flex items-center gap-1 h-7 px-1.5 rounded cursor-pointer transition-colors text-[12px]',
            selectedId === null ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-neutral-100 text-neutral-700'
          )}
          onClick={() => onSelect?.(null)}
        >
          <span className="w-4 shrink-0" />
          <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="flex-1 truncate">Semua Kategori</span>
          <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full tabular-nums">
            {categories.reduce((sum, c) => sum + c.productCount, 0)}
          </span>
        </div>

        {tree.map((node) => renderNode(node))}

        {tree.length === 0 && (
          <div className="px-3 py-6 text-center text-neutral-400 text-[11px]">
            Belum ada kategori. Klik <strong>Tambah</strong> untuk membuat.
          </div>
        )}
      </div>

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      {deletingId && (
        <div className="shrink-0 border-t border-red-200 bg-red-50 px-3 py-2">
          <p className="text-[11px] text-red-700 mb-2">Hapus kategori ini? Tindakan tidak dapat dibatalkan.</p>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Ketik HAPUS untuk konfirmasi"
              className="flex-1 h-7 text-[11px] border-red-300 focus:ring-red-400"
            />
            <Button
              variant="ghost"
              size="xs"
              onClick={() => { setDeletingId(null); setDeleteConfirm(''); }}
              className="text-neutral-500 hover:text-neutral-700"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'HAPUS'}
            >
              Hapus
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
