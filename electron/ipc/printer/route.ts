import { ipcMain, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { printReceipt, printTestPage, openCashDrawer } from './service.ts';
import { getSettingValue } from '../settings/service.ts';
import type { ReceiptData } from './service.ts';

async function getPrinterName(): Promise<string | undefined> {
  try {
    const name = await getSettingValue('printer_name');
    return name || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Convert berbagai format date dari WMI/PowerShell ke ISO string.
 * WMI kadang ngasih objek {value, DateTime} — ini handle itu.
 */
function extractDateString(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj.value === 'string' && obj.value) return obj.value;
    if (typeof obj.DateTime === 'string' && obj.DateTime) return obj.DateTime;
  }
  return null;
}

/**
 * Query Windows print queue via WMI Win32_PrintJob.
 * Returns list of queued jobs for the given printer.
 */
async function queryPrintQueue(printerName: string): Promise<PrintJobInfo[]> {
  return new Promise((resolve) => {
    // Use WMI (Win32_PrintJob) — available on all Windows versions, no module needed
    const psCmd = [
      `Get-CimInstance Win32_PrintJob`,
      `| Where-Object { $_.Name -like '${printerName.replace(/'/g, "''")},*' }`,
      `| Select-Object @{N='Id';E={[int]($_.Name -split ',')[1]}},`,
      `               @{N='DocumentName';E={$_.Document}},`,
      `               @{N='JobStatus';E={$_.Status}},`,
      `               @{N='TotalPages';E={$_.TotalPages}},`,
      `               @{N='Size';E={$_.Size}},`,
      `               @{N='SubmittedTime';E={$_.TimeSubmitted.ToString('yyyy-MM-ddTHH:mm:ss')}},`,
      `               @{N='PrinterName';E={($_.Name -split ',')[0]}}`,
      `| ConvertTo-Json -Compress`,
    ].join(' ');

    const proc = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', psCmd,
    ], { shell: false });

    let stdout = '';
    proc.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', () => { /* swallow stderr — WMI may emit warnings */ });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.warn('[printer:queueList] PowerShell exit', code);
        resolve([]);
        return;
      }
      try {
        const trimmed = stdout.trim();
        if (!trimmed || trimmed === 'null') {
          resolve([]);
          return;
        }
        const parsed = JSON.parse(trimmed);
        const jobs = Array.isArray(parsed) ? parsed : [parsed];
        resolve(
          jobs
            .filter((j: any) => j && j.Id != null)
            .map((j: any) => ({
              id: String(j.Id),
              documentName: String(j.DocumentName || ''),
              status: String(j.JobStatus || 'Unknown'),
              pages: j.TotalPages ?? 0,
              sizeBytes: j.Size ?? 0,
              submittedAt: extractDateString(j.SubmittedTime),
              printerName: String(j.PrinterName || printerName),
            }))
        );
      } catch {
        resolve([]);
      }
    });

    proc.on('error', () => {
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

/**
 * Query printer physical status via WMI Win32_Printer.
 * Returns: 'ready' | 'offline' | 'error' | 'not_found'
 */
async function queryPrinterStatus(printerName: string): Promise<'ready' | 'offline' | 'error' | 'not_found'> {
  return new Promise((resolve) => {
    const escaped = printerName.replace(/'/g, "''");
    const psCmd = [
      `Get-WmiObject Win32_Printer -Filter "Name = '${escaped}'"`,
      `| Select-Object Name, WorkOffline, PrinterStatus, PrinterState`,
      `| ConvertTo-Json -Compress`,
    ].join(' ');

    const proc = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', psCmd,
    ], { shell: false });

    let stdout = '';
    proc.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0 || !stdout.trim() || stdout.trim() === 'null') {
        resolve('not_found');
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        const p = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!p) { resolve('not_found'); return; }

        // WorkOffline = true → printer offline / USB cabut / mati
        if (p.WorkOffline === true || p.WorkOffline === 'True' || p.WorkOffline === 1) {
          resolve('offline');
          return;
        }

        // PrinterStatus: 3=Idle, 4=Printing, 7=Offline, 2=Unknown, 1=Other
        const ps = parseInt(p.PrinterStatus, 10);
        if (ps === 7 || ps === 6) {  // 7=Offline, 6=Stopped
          resolve('offline');
          return;
        }
        if (ps === 2 || ps === 1) {   // 2=Unknown, 1=Other → might be error
          resolve('error');
          return;
        }

        resolve('ready');
      } catch {
        resolve('not_found');
      }
    });

    proc.on('error', () => resolve('not_found'));
  });
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

  ipcMain.handle('printer:checkConnection', async (): Promise<{ ok: boolean; data: { connected: boolean; name?: string; status?: number; message?: string } }> => {
    try {
      const printerName = await getPrinterName();
      if (!printerName) {
        return { ok: true, data: { connected: false, message: 'Belum ada printer dipilih. Atur di Pengaturan > Cetak.' } };
      }

      // Cek fisik via WMI Win32_Printer — lihat properti WorkOffline
      const status = await queryPrinterStatus(printerName);

      if (status === 'offline') {
        return { ok: true, data: { connected: false, name: printerName, message: `Printer "${printerName}" offline atau tidak terhubung. Periksa kabel USB/ power printer.` } };
      }

      if (status === 'not_found') {
        return { ok: true, data: { connected: false, name: printerName, message: `Printer "${printerName}" tidak ditemukan di sistem. Instal driver printer terlebih dahulu.` } };
      }

      if (status === 'error') {
        return { ok: true, data: { connected: false, name: printerName, message: `Printer "${printerName}" dalam status error. Periksa printer.` } };
      }

      return { ok: true, data: { connected: true, name: printerName } };
    } catch (err: any) {
      return { ok: true, data: { connected: false, message: err.message || 'Gagal memeriksa printer' } };
    }
  });

  ipcMain.handle('printer:print', async (_event, data: ReceiptData) => {
    const printerName = await getPrinterName();
    if (!printerName) {
      return { ok: false, error: { code: 'PRINT_001', message: 'Belum ada printer dipilih. Atur di Pengaturan > Cetak.' } };
    }
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

  ipcMain.handle('printer:queueClearAll', async (): Promise<{ ok: boolean; error?: { code: string; message: string } }> => {
    try {
      const printerName = await getPrinterName();
      if (!printerName) {
        return { ok: false, error: { code: 'PRINT_001', message: 'Printer belum dipilih' } };
      }
      return await clearAllPrintJobs(printerName);
    } catch (err: any) {
      return { ok: false, error: { code: 'PRINT_002', message: err.message || 'Gagal menghapus semua antrian' } };
    }
  });
}

async function cancelPrintJob(printerName: string, jobId: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> {
  return new Promise((resolve) => {
    const numId = parseInt(jobId, 10);
    const escapedName = printerName.replace(/'/g, "''");

    // Tulis script ke temp file (sama pola seperti sendRawToPrinter di service.ts)
    const tmpFile = join(tmpdir(), 'pos_cancel_' + Date.now() + '.ps1');
    const script = [
      `param([int]$JobId, [string]$PrinterName)`,
      ``,
      `# Method 1: WMI Win32_PrintJob (paling universal)`,
      `try {`,
      `  $job = Get-WmiObject Win32_PrintJob -Filter "JobId = $JobId" -ErrorAction Stop`,
      `  if ($job) { $job.Delete(); Write-Host 'ok'; exit 0 }`,
      `} catch { $e1 = $_.Exception.Message }`,
      ``,
      `# Method 2: CIM fallback`,
      `try {`,
      `  $job2 = Get-CimInstance Win32_PrintJob -Filter "JobId = $JobId" -ErrorAction Stop`,
      `  if ($job2) { Remove-CimInstance $job2 -ErrorAction Stop; Write-Host 'ok'; exit 0 }`,
      `} catch { $e2 = $_.Exception.Message }`,
      ``,
      `# Method 3: PrintManagement module`,
      `try {`,
      `  Import-Module PrintManagement -ErrorAction SilentlyContinue`,
      `  Remove-PrintJob -PrinterName $PrinterName -Id $JobId -Force -ErrorAction Stop`,
      `  Write-Host 'ok'; exit 0`,
      `} catch { $e3 = $_.Exception.Message }`,
      ``,
      `# All failed — report errors`,
      `Write-Host "err:WMI=$e1 | CIM=$e2 | PrintMgt=$e3"`,
      `exit 1`,
    ].join('\n');

    try { writeFileSync(tmpFile, script, 'utf-8'); }
    catch (e: any) {
      resolve({ ok: false, error: { code: 'PRINT_002', message: 'Gagal tulis script: ' + e.message } });
      return;
    }

    console.log('[printer:cancel] script:', tmpFile);

    const proc = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', tmpFile,
      '-JobId', String(numId),
      '-PrinterName', escapedName,
    ], { shell: false });

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      const out = stdout.trim();
      console.log('[printer:cancel] exit:', code, 'out:', out, 'stderr:', stderr.trim().slice(0, 200));

      // Hapus temp file
      try { unlinkSync(tmpFile); } catch { /* ignore */ }

      if (out === 'ok') {
        resolve({ ok: true });
      } else if (out.startsWith('err:')) {
        resolve({ ok: false, error: { code: 'PRINT_002', message: 'cancel gagal: ' + out.slice(4) } });
      } else {
        const msg = stderr.trim() || out || `exit code ${code}`;
        resolve({ ok: false, error: { code: 'PRINT_002', message: 'cancel gagal: ' + msg } });
      }
    });

    proc.on('error', (err) => {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
      resolve({ ok: false, error: { code: 'PRINT_002', message: 'spawn error: ' + err.message } });
    });
  });
}

async function clearAllPrintJobs(printerName: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> {
  return new Promise((resolve) => {
    const escapedName = printerName.replace(/'/g, "''");
    const tmpFile = join(tmpdir(), 'pos_clearall_' + Date.now() + '.ps1');

    const script = [
      `param([string]$PrinterName)`,
      ``,
      `$count = 0`,
      `$errors = @()`,
      ``,
      `# Method 1: WMI`,
      `try {`,
      `  $jobs = Get-WmiObject Win32_PrintJob -Filter "Name LIKE '${escapedName}%'" -ErrorAction Stop`,
      `  foreach ($j in $jobs) {`,
      `    try { $j.Delete(); $count++ }`,
      `    catch { $errors += "job $($j.JobId): $($_.Exception.Message)" }`,
      `  }`,
      `} catch { $e1 = $_.Exception.Message }`,
      ``,
      `# Method 2: CIM (fallback)`,
      `try {`,
      `  $jobs2 = Get-CimInstance Win32_PrintJob -Filter "Name LIKE '${escapedName}%'" -ErrorAction Stop`,
      `  foreach ($j in $jobs2) {`,
      `    try { Remove-CimInstance $j -ErrorAction Stop; $count++ }`,
      `    catch { $errors += "job $($j.JobId): $($_.Exception.Message)" }`,
      `  }`,
      `} catch { $e2 = $_.Exception.Message }`,
      ``,
      `# Method 3: PrintManagement`,
      `try {`,
      `  Import-Module PrintManagement -ErrorAction SilentlyContinue`,
      `  $jobs3 = Get-PrintJob -PrinterName $PrinterName -ErrorAction Stop`,
      `  foreach ($j in $jobs3) {`,
      `    try { Remove-PrintJob -InputObject $j -Force -ErrorAction Stop; $count++ }`,
      `    catch { $errors += "job $($j.Id): $($_.Exception.Message)" }`,
      `  }`,
      `} catch { $e3 = $_.Exception.Message }`,
      ``,
      `Write-Host "count=$count errors=$($errors -join '; ')"`,
      `if ($errors.Count -eq 0 -and ($count -gt 0 -or $count -eq 0)) { exit 0 }`,
      `exit 1`,
    ].join('\n');

    try { writeFileSync(tmpFile, script, 'utf-8'); }
    catch (e: any) {
      resolve({ ok: false, error: { code: 'PRINT_002', message: 'Gagal tulis script: ' + e.message } });
      return;
    }

    const proc = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', tmpFile,
      '-PrinterName', escapedName,
    ], { shell: false });

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      const out = stdout.trim();
      console.log('[printer:clearAll] exit:', code, 'out:', out, 'stderr:', stderr.trim().slice(0, 200));
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
      if (code === 0) {
        resolve({ ok: true });
      } else {
        resolve({ ok: false, error: { code: 'PRINT_002', message: stderr.trim() || out || `exit code ${code}` } });
      }
    });

    proc.on('error', (err) => {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
      resolve({ ok: false, error: { code: 'PRINT_002', message: 'spawn error: ' + err.message } });
    });
  });
}
