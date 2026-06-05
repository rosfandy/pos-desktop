'use client';

import { useState, useCallback } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import CustomerList from '@/features/customer/components/CustomerList';
import CustomerForm from '@/features/customer/components/CustomerForm';
import BulkExportDialog from '@/features/customer/components/BulkExportDialog';
import BulkImportDialog from '@/features/customer/components/BulkImportDialog';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Users,
  Download,
  Upload,
  Trash,
} from 'phosphor-react';

export default function CustomersPage() {
  const { fetchCustomers, bulkDeleteCustomers } = useCustomerStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const handleRefresh = useCallback(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    handleRefresh();
  }, [handleRefresh]);

  const handleImportOpenChange = useCallback((open: boolean) => {
    setShowImportDialog(open);
    if (!open) {
      handleRefresh();
    }
  }, [handleRefresh]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Hapus ${selectedIds.size} pelanggan? Tindakan ini tidak bisa dibatalkan.`)) return;

    setDeleting(true);
    try {
      const result = await bulkDeleteCustomers(Array.from(selectedIds));
      if (result.success) {
        setSelectedIds(new Set());
      } else {
        alert(`Gagal menghapus ${result.errors.length} pelanggan.`);
      }
    } finally {
      setDeleting(false);
    }
  }, [selectedIds, bulkDeleteCustomers]);

  const handleSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedIds(ids);
  }, []);

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground shadow">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-10 flex items-center gap-2 px-4 border-b border-border bg-card text-card-foreground">
        <Users className="w-4 h-4 text-indigo-600" />
        <span className="text-[13px] font-semibold text-neutral-800">Manajemen Pelanggan</span>
        <div className="flex-1" />
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[11px] text-neutral-500">{selectedIds.size} dipilih</span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] h-7"
            >
              Batal
            </Button>
            <Button
              size="xs"
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-[11px] h-7 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash className="w-3 h-3" />
              {deleting ? 'Menghapus…' : `Hapus ${selectedIds.size}`}
            </Button>
          </div>
        )}
        <Button
          variant="outline"
          size="xs"
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-1.5 text-[11px] h-7"
        >
          <Download className="w-3 h-3" />
          Export
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => setShowImportDialog(true)}
          className="flex items-center gap-1.5 text-[11px] h-7"
        >
          <Upload className="w-3 h-3" />
          Import
        </Button>
        <Button
          onClick={() => { setEditingId(null); setFormOpen(true); }}
          size="sm"
          className="flex items-center gap-1.5 text-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px]"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Pelanggan
        </Button>
      </div>

      {/* ── Customer List ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 p-2">
        <CustomerList
          className="h-full"
          onEdit={handleEdit}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}
      <CustomerForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        customerId={editingId}
      />
      <BulkExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={handleImportOpenChange}
        onImportComplete={handleRefresh}
      />
    </div>
  );
}
