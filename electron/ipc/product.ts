import { ipcMain } from 'electron';
import {
  listProducts,
  getProductByBarcode,
  getProductById,
  getProductWithUnits,
  createProduct,
  updateProduct,
  deleteProduct,
  checkStock,
  updateProductStock,
  getLowStockProducts,
  getProductHistory,
  bulkSaveProducts,
  productCount,
  type ProductCounts,
  type ProductPageResult,
} from '../services/product/service.ts';
import type { ProductFilter, CreateProductInput, UpdateProductInput } from '../services/product/service.ts';

export function registerProductHandlers() {
  ipcMain.handle('product:list', async (_e, filter?: ProductFilter) => {
    try {
      const data = await listProducts(filter);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_LIST', message: err?.message || 'Gagal memuat produk' } };
    }
  });

  ipcMain.handle('product:getByBarcode', async (_e, barcode: string) => {
    try {
      const data = await getProductByBarcode(barcode);
      if (!data) return { ok: false, error: { code: 'PROD_003', message: 'Produk tidak ditemukan' } };
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_GET', message: err?.message || 'Gagal memuat produk' } };
    }
  });

  ipcMain.handle('product:getById', async (_e, id: string) => {
    try {
      const data = await getProductById(id);
      if (!data) return { ok: false, error: { code: 'PROD_003', message: 'Produk tidak ditemukan' } };
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_GET', message: err?.message || 'Gagal memuat produk' } };
    }
  });

  ipcMain.handle('product:get', async (_e, id: string) => {
    try {
      const data = await getProductWithUnits(id);
      if (!data) return { ok: false, error: { code: 'PROD_003', message: 'Produk tidak ditemukan' } };
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_GET', message: err?.message || 'Gagal memuat produk' } };
    }
  });

  ipcMain.handle('product:create', async (_e, input: CreateProductInput) => {
    try {
      const result = await createProduct(input);
      if ('error' in result) return { ok: false, error: { code: 'PROD_CREATE', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_CREATE', message: err?.message || 'Gagal membuat produk' } };
    }
  });

  ipcMain.handle('product:update', async (_e, id: string, input: UpdateProductInput) => {
    try {
      const result = await updateProduct(id, input);
      if ('error' in result) return { ok: false, error: { code: 'PROD_UPDATE', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_UPDATE', message: err?.message || 'Gagal memperbarui produk' } };
    }
  });

  ipcMain.handle('product:delete', async (_e, id: string) => {
    try {
      const result = await deleteProduct(id);
      if (!result.success) return { ok: false, error: { code: 'PROD_DELETE', message: result.error || 'Gagal menghapus produk' } };
      return { ok: true, data: { success: true } };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_DELETE', message: err?.message || 'Gagal menghapus produk' } };
    }
  });

  ipcMain.handle('product:checkStock', async (_e, id: string) => {
    try {
      const data = await checkStock(id);
      if (!data) return { ok: false, error: { code: 'PROD_STOCK', message: 'Produk tidak ditemukan' } };
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_STOCK', message: err?.message || 'Gagal cek stok' } };
    }
  });

  ipcMain.handle('product:updateStock', async (_e, productId: string, qty: number) => {
    try {
      const data = await updateProductStock(productId, qty);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_STOCK', message: err?.message || 'Gagal update stok' } };
    }
  });

  ipcMain.handle('product:lowStock', async (_e, threshold?: number) => {
    try {
      const data = await getLowStockProducts(threshold);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_LOW', message: err?.message || 'Gagal memuat stok rendah' } };
    }
  });

  ipcMain.handle('product:history', async (_e, productId: string) => {
    try {
      const data = await getProductHistory(productId);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_HIST', message: err?.message || 'Gagal memuat riwayat' } };
    }
  });

  ipcMain.handle('product:bulkSave', async (_e, rows: any[]) => {
    try {
      const result = await bulkSaveProducts(rows);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_BULK', message: err?.message || 'Gagal menyimpan produk' } };
    }
  });

  ipcMain.handle('product:count', async () => {
    try {
      const data = await productCount();
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'PROD_COUNT', message: err?.message || 'Gagal menghitung produk' } };
    }
  });
}
