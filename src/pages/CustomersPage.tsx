'use client';

import { useState, useCallback } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import CustomerList from '@/components/customer/CustomerList';
import CustomerForm from '@/components/customer/CustomerForm';
import BulkExportDialog from '@/components/customer/BulkExportDialog';
import BulkImportDialog from '@/components/customer/BulkImportDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Users,
  Download,
  Upload,
} from 'phosphor-react';

export default function CustomersPage() {
  const { fetchCustomers } = useCustomerStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleRefresh = useCallback(() => {
    fetchCustomers(showInactive ? undefined : { isActive: true });
  }, [fetchCustomers, showInactive]);

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

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-10 flex items-center gap-2 px-4 border-b border-neutral-200 bg-white">
        <Users className="w-4 h-4 text-indigo-600" />
        <span className="text-[13px] font-semibold text-neutral-800">Manajemen Pelanggan</span>
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-[11px] text-neutral-500 cursor-pointer">
          <Checkbox
            checked={showInactive}
            onCheckedChange={(checked) => {
              setShowInactive(checked === true);
              fetchCustomers(checked ? undefined : { isActive: true });
            }}
            className="w-3.5 h-3.5"
          />
          Tampilkan nonaktif
        </label>
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
      <div className="flex-1 min-h-0">
        <CustomerList
          className="h-full"
          onEdit={handleEdit}
          showInactive={showInactive}
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
