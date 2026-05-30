import { ipcMain, BrowserWindow } from 'electron';
import { printReceipt, printTestPage, openCashDrawer } from '../services/printer/service.ts';
import { getSettingValue } from '../services/settings/service.ts';
import type { ReceiptData } from '../services/printer/service.ts';

async function getPrinterName(): Promise<string | undefined> {
  try {
    const name = await getSettingValue('printer_name');
    return name || undefined;
  } catch {
    return undefined;
  }
}

export function registerPrinterHandlers() {
  // List available printers from system
  ipcMain.handle('printer:list', async () => {
    try {
      const wins = BrowserWindow.getAllWindows();
      if (wins.length === 0) return { ok: true, data: [] };
      const printers = await wins[0].webContents.getPrintersAsync();
      const list = printers.map((p) => ({
        name: p.name,
        displayName: p.displayName || p.name,
        status: p.status ?? 3,
      }));
      return { ok: true, data: list };
    } catch (err) {
      console.error('[printer] Gagal mengambil daftar printer:', err);
      return { ok: true, data: [] };
    }
  });

  ipcMain.handle('printer:print', async (_event, data: ReceiptData) => {
    const printerName = await getPrinterName();
    console.log("printing", printerName)
    return await printReceipt(data, printerName);
  });

  ipcMain.handle('printer:test', async () => {
    const printerName = await getPrinterName();
    return await printTestPage(printerName);
  });

  ipcMain.handle('printer:open-drawer', async () => {
    const printerName = await getPrinterName();
    return await openCashDrawer(printerName);
  });
}
