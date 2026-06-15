import { ipcMain } from 'electron';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './service.ts';
import type { CategoryInput } from './service.ts';

export function registerCategoryHandlers() {
  ipcMain.handle('category:list', async () => {
    try {
      const data = await listCategories();
      console.log('[IPC:category:list] data count:', data?.length, 'first:', data?.[0]);
      return { ok: true, data };
    } catch (err: any) {
      console.error('[IPC:category:list] error:', err);
      return { ok: false, error: { code: 'CAT_LIST', message: err?.message || 'Gagal memuat kategori' } };
    }
  });

  ipcMain.handle('category:get', async (_e, id: string) => {
    try {
      const data = await getCategoryById(id);
      if (!data) return { ok: false, error: { code: 'CAT_003', message: 'Kategori tidak ditemukan' } };
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'CAT_GET', message: err?.message || 'Gagal memuat kategori' } };
    }
  });

  ipcMain.handle('category:create', async (_e, input: CategoryInput) => {
    try {
      const result = await createCategory(input);
      if ('error' in result) return { ok: false, error: { code: 'CAT_CREATE', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CAT_CREATE', message: err?.message || 'Gagal membuat kategori' } };
    }
  });

  ipcMain.handle('category:update', async (_e, id: string, input: CategoryInput) => {
    try {
      const result = await updateCategory(id, input);
      if ('error' in result) return { ok: false, error: { code: 'CAT_UPDATE', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CAT_UPDATE', message: err?.message || 'Gagal memperbarui kategori' } };
    }
  });

  ipcMain.handle('category:delete', async (_e, id: string) => {
    try {
      const result = await deleteCategory(id);
      if (!result.success) return { ok: false, error: { code: 'CAT_DELETE', message: result.error || 'Gagal menghapus kategori' } };
      return { ok: true, data: { success: true } };
    } catch (err: any) {
      return { ok: false, error: { code: 'CAT_DELETE', message: err?.message || 'Gagal menghapus kategori' } };
    }
  });
}
