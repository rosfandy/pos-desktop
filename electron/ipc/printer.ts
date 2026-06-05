import { ipcMain, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
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

/**
 * Query Windows print queue via PowerShell Get-PrintJob.
 * Returns list of queued jobs for the given printer.
 */
async function queryPrintQueue(printerName: string): Promise<PrintJobInfo[]> {
  return new Promise((resolve, reject) => {
    const psCmd = [
      `Get-PrintJob -PrinterName '${printerName.replace(/'/g, "''")}'`,
      `| Select-Object Id, DocumentName, JobStatus, TotalPages, Size, SubmittedTime, PrinterName`,
      `| ConvertTo-Json -Compress`,
    ].join(' ');

    const proc = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', psCmd,
    ], { shell: false });

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.warn('[printer:queueList] PowerShell exit code', code, stderr.trim());
        resolve([]);
        return;
      }
      try {
        const trimmed = stdout.trim();
        if (!trimmed || trimmed === 'null') {
          resolve([]);
          return;
        }
        // Get-PrintJob returns a single object if only one job, or array if many
        const parsed = JSON.parse(trimmed);
        const jobs = Array.isArray(parsed) ? parsed : [parsed];
        resolve(
          jobs
            .filter((j: any) => j && j.Id != null)
            .map((j: any) => ({
              id: String(j.Id),
              documentName: j.DocumentName || '',
              status: j.JobStatus || 'Unknown',
              pages: j.TotalPages ?? 0,
              sizeBytes: j.Size ?? 0,
              submittedAt: j.SubmittedTime || null,
              printerName: j.PrinterName || printerName,
            }))
        );
      } catch {
        resolve([]);
      }
    });

    proc.on('error', (err) => {
      console.warn('[printer:queueList] spawn error:', err.message);
      resolve([]);
    });
  });
}

export interface PrintJobInfo {
  id: string;
  documentName: string;
  status: string;
  pages: number;
  sizeBytes: number;
  submittedAt: string | null;
  printerName: string;
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

  // ── Print Queue ────────────────────────────────────────────────────────────
  ipcMain.handle('printer:queueList', async (): Promise<{ ok: boolean; data: PrintJobInfo[] }> => {
    try {
      const printerName = await getPrinterName();
      if (!printerName) {
        return { ok: true, data: [] };
      }
      const jobs = await queryPrintQueue(printerName);
      return { ok: true, data: jobs };
    } catch (err) {
      console.error('[printer:queueList] error:', err);
      return { ok: true, data: [] };
    }
  });

  ipcMain.handle('printer:queueCancel', async (_event, jobId: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> => {
    try {
      const printerName = await getPrinterName();
      if (!printerName) {
        return { ok: false, error: { code: 'PRINT_001', message: 'Printer belum dipilih' } };
      }
      return await cancelPrintJob(printerName, jobId);
    } catch (err: any) {
      return { ok: false, error: { code: 'PRINT_002', message: err.message || 'Gagal membatalkan antrian' } };
    }
  });
}

async function cancelPrintJob(printerName: string, jobId: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> {
  return new Promise((resolve) => {
    const psCmd = `Remove-PrintJob -PrinterName '${printerName.replace(/'/g, "''")}' -Id ${parseInt(jobId, 10)} -Force`;
    const proc = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', psCmd,
    ], { shell: false });

    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true });
      } else {
        resolve({ ok: false, error: { code: 'PRINT_002', message: `Gagal batalkan job (exit ${code}): ${stderr.trim()}` } });
      }
    });

    proc.on('error', (err) => {
      resolve({ ok: false, error: { code: 'PRINT_002', message: err.message } });
    });
  });
}
