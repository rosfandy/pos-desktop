import { ipcMain } from 'electron';
import { stockIn, stockOut, adjust, transferStock, listLocations, getInventoryLogs, getCurrentStock, getStockMovementReport } from './service.ts';

export function registerInventoryHandlers() {
  ipcMain.handle('inventory:stockIn', async (_e, input: {
    productId: string;
    quantity: number;
    unit: string;
    conversionFactor?: number;
    costPrice?: number;
    supplier?: string;
    reason?: string;
    userId: string;
    referenceId?: string;
  }) => {
    try {
      const data = await stockIn(input);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: err.code || 'INV_STOCK_IN', message: err.message || 'Gagal stok masuk' } };
    }
  });

  ipcMain.handle('inventory:stockOut', async (_e, input: {
    productId: string;
    quantity: number;
    unit: string;
    conversionFactor?: number;
    reason: string;
    userId: string;
    referenceId?: string;
  }) => {
    try {
      const data = await stockOut(input);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: err.code || 'INV_STOCK_OUT', message: err.message || 'Gagal stok keluar' } };
    }
  });

  ipcMain.handle('inventory:adjust', async (_e, input: {
    productId: string;
    newQuantity: number;
    unit: string;
    conversionFactor?: number;
    reason: string;
    userId: string;
  }) => {
    try {
      const data = await adjust(input);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: err.code || 'INV_ADJUST', message: err.message || 'Gagal adjustment stok' } };
    }
  });

  ipcMain.handle('inventory:transfer', async (_e, input: {
    productId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    unit: string;
    conversionFactor?: number;
    reason: string;
    userId: string;
  }) => {
    try {
      const data = await transferStock(input);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: err.code || 'INV_TRANSFER', message: err.message || 'Gagal transfer stok' } };
    }
  });

  ipcMain.handle('inventory:logs', async (_e, filter?: {
    productId?: string;
    type?: string;
    userId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const data = await getInventoryLogs(filter);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'INV_LOGS', message: err?.message || 'Gagal memuat log stok' } };
    }
  });

  ipcMain.handle('inventory:currentStock', async (_e, productId: string) => {
    try {
      const stock = await getCurrentStock(productId);
      return { ok: true, data: { stock } };
    } catch (err: any) {
      return { ok: false, error: { code: 'INV_STOCK', message: err?.message || 'Gagal cek stok' } };
    }
  });

  ipcMain.handle('inventory:locations', async () => {
    try {
      const data = await listLocations();
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'INV_LOC', message: err?.message || 'Gagal memuat lokasi' } };
    }
  });

  ipcMain.handle('inventory:movement', async (_e, filter?: {
    productId?: string;
    locationId?: string;
    startDate?: number;
    endDate?: number;
    type?: string;
  }) => {
    try {
      const data = await getStockMovementReport(filter);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'INV_MOVEMENT', message: err?.message || 'Gagal memuat laporan pergerakan' } };
    }
  });
}
