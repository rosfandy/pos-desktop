import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const PRINT_ERRORS = {
  PRINTER_NOT_FOUND: 'PRINT_001',
  PRINT_FAILED: 'PRINT_002',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;   // in cents
  total: number;   // in cents
}

export interface ReceiptData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptShowLogo: boolean;
  receiptShowTaxBreakdown: boolean;
  receiptShowQr: boolean;

  invoiceNumber: string;
  createdAt: number;
  cashierName: string;
  paymentMethod: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;

  // Customer / loyalty info
  customerName?: string;
  customerPoints?: number;       // saldo poin saat ini
  pointsEarned?: number;         // poin yg didapat dari transaksi ini
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(cents: number): string {
  return `Rp${(cents / 100).toLocaleString('id-ID')}`;
}

// Pad string kiri+kanan agar pas di lebar kolom (monospace)
function padLeft(s: string, width: number): string {
  return s.slice(0, width).padStart(width);
}
function padRight(s: string, width: number): string {
  return s.slice(0, width).padEnd(width);
}

// ─── ESC/POS builder via node-thermal-printer ─────────────────────────────────
// Lebar 32 char untuk 58mm | 42 char untuk 80mm

const LINE_WIDTH = 32;

function buildEscposBuffer(data: ReceiptData): Buffer {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: 'file:/dev/null',   // interface dummy — kita ambil buffer-nya saja
    width: LINE_WIDTH,
    characterSet: CharacterSet.PC852_LATIN2,
    breakLine: BreakLine.WORD,
    removeSpecialCharacters: false,
    lineCharacter: '-',
  });

  const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Tunai', debit: 'Debit', qris: 'QRIS',
    transfer: 'Transfer', credit: 'Kredit',
  };

  const dateStr = new Date(data.createdAt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── HEADER ──────────────────────────────────────────────────────────────────
  printer.alignCenter();
  printer.setTextDoubleHeight();
  printer.bold(true);
  printer.println(data.storeName || 'TOKO SAYA');
  printer.bold(false);
  printer.setTextNormal();

  if (data.storeAddress) printer.println(data.storeAddress);
  if (data.storePhone)   printer.println(`Telp: ${data.storePhone}`);
  if (data.receiptHeader) {
    printer.newLine();
    printer.println(data.receiptHeader);
  }

  printer.alignLeft();
  printer.drawLine();

  // ── META ────────────────────────────────────────────────────────────────────
  const labelW = 12;
  const metaRow = (label: string, value: string) => {
    printer.println(`${padRight(label, labelW)}: ${value}`);
  };
  metaRow('No. Invoice', data.invoiceNumber);
  metaRow('Tanggal',     dateStr);
  metaRow('Kasir',       data.cashierName);
  metaRow('Pembayaran',  PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod.toUpperCase());

  printer.drawLine();

  // ── PEMBELI & POIN ──────────────────────────────────────────────────────────
  if (data.customerName) {
    let ptVal = data.customerName;
    if (data.customerPoints !== undefined) {
      ptVal += ` (${data.customerPoints.toLocaleString('id-ID')})`;
    }
    if (data.pointsEarned !== undefined && data.pointsEarned > 0) {
      ptVal += ` +${data.pointsEarned.toLocaleString('id-ID')}`;
    }
    printer.println(`${padRight('Pembeli', labelW)}: ${ptVal}`);
  }

  // ── ITEMS ────────────────────────────────────────────────────────────────────
  // Header item: "PRODUK           TOTAL"
  const itemTotalW = 10;
  const itemNameW  = LINE_WIDTH - itemTotalW - 1;

  printer.bold(true);
  printer.println(`${padRight('PRODUK', itemNameW)} ${padLeft('TOTAL', itemTotalW)}`);
  printer.bold(false);

  for (const item of data.items) {
    const totalStr = fmtCurrency(item.total);
    // baris 1: nama produk (kiri) + total (kanan)
    const name = item.name.slice(0, itemNameW);
    printer.println(`${padRight(name, itemNameW)} ${padLeft(totalStr, itemTotalW)}`);
    // baris 2: harga × qty (indent 2)
    const detail = `  ${fmtCurrency(item.price)} x ${item.quantity} ${item.unit}`;
    printer.println(detail);
    // baris 3: diskon per-item jika ada
    const expectedTotal = item.price * item.quantity;
    if (item.total < expectedTotal && item.price > 0) {
      printer.println(`  diskon -${fmtCurrency(expectedTotal - item.total)}`);
    }
  }

  // ── TOTAL ITEM / QTY ────────────────────────────────────────
  const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);
  printer.println(`${padRight('Total', 24)} ${padLeft(String(data.items.length) + ' item, ' + String(totalQty) + ' pcs', 8)}`);

  printer.drawLine();

  // ── SUMMARY ──────────────────────────────────────────────────────────────────
  const sumValW  = 12;
  const sumLblW  = LINE_WIDTH - sumValW - 1;

  const sumRow = (label: string, value: string) => {
    printer.println(`${padRight(label, sumLblW)} ${padLeft(value, sumValW)}`);
  };

  sumRow('Subtotal', fmtCurrency(data.subtotal));

  if (data.discount > 0) {
    sumRow('Diskon', `- ${fmtCurrency(data.discount)}`);
  }
  if (data.tax > 0 && data.receiptShowTaxBreakdown) {
    sumRow('Pajak', fmtCurrency(data.tax));
  }

  // TOTAL — double height
  printer.drawLine();
  printer.bold(true);
  printer.setTextDoubleHeight();
  printer.leftRight('TOTAL', fmtCurrency(data.total));
  printer.setTextNormal();
  printer.bold(false);
  printer.drawLine();

  if (data.amountPaid > 0) {
    sumRow('Bayar',   fmtCurrency(data.amountPaid));
    sumRow('Kembali', fmtCurrency(data.change));
  }

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  printer.drawLine();
  printer.alignCenter();
  printer.bold(true);
  printer.println(data.receiptFooter || 'TERIMA KASIH');
  printer.bold(false);

  if (data.receiptShowQr) {
    printer.newLine();
    printer.println('[QR Code]');
  }

  printer.newLine();
  printer.cut();

  return printer.getBuffer() as Buffer;
}

// ─── Send ESC/POS buffer to Windows printer via PowerShell RAW ────────────────

function sendRawToPrinter(buffer: Buffer, printerName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmpFile = join(tmpdir(), "pos_print_" + Date.now() + ".bin");
    try { writeFileSync(tmpFile, buffer); }
    catch (e: any) { return reject(new Error("Gagal tulis file: " + e.message)); }

    console.log("[printer] " + buffer.length + " bytes -> [" + printerName + "]");

    // Tulis PS1 script ke file temp untuk avoid quoting nightmare
    const psFile = tmpFile + ".ps1";
    const printerEsc = printerName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const fileEsc = tmpFile.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const csharp = [
      "using System;",
      "using System.IO;",
      "using System.Runtime.InteropServices;",
      "public class WinRaw {",
      "  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]",
      "  public class DOC { public string pDocName; public string pOutputFile; public string pDataType; }",
      "  [DllImport(\"winspool.drv\",CharSet=CharSet.Unicode)] public static extern bool OpenPrinter(string n,out IntPtr h,IntPtr d);",
      "  [DllImport(\"winspool.drv\",CharSet=CharSet.Unicode)] public static extern bool ClosePrinter(IntPtr h);",
      "  [DllImport(\"winspool.drv\",CharSet=CharSet.Unicode)] public static extern int StartDocPrinter(IntPtr h,int lv,[In,MarshalAs(UnmanagedType.LPStruct)]DOC di);",
      "  [DllImport(\"winspool.drv\",CharSet=CharSet.Unicode)] public static extern bool EndDocPrinter(IntPtr h);",
      "  [DllImport(\"winspool.drv\",CharSet=CharSet.Unicode)] public static extern bool StartPagePrinter(IntPtr h);",
      "  [DllImport(\"winspool.drv\",CharSet=CharSet.Unicode)] public static extern bool EndPagePrinter(IntPtr h);",
      "  [DllImport(\"winspool.drv\",CharSet=CharSet.Unicode)] public static extern bool WritePrinter(IntPtr h,byte[] b,int n,out int w);",
      "  public static int Send(string printer,string path){",
      "    IntPtr hp;",
      "    if(!OpenPrinter(printer,out hp,IntPtr.Zero))return 1;",
      "    var di=new DOC{pDocName=\"POS\",pOutputFile=null,pDataType=\"RAW\"};",
      "    if(StartDocPrinter(hp,1,di)<=0){ClosePrinter(hp);return 2;}",
      "    StartPagePrinter(hp);",
      "    byte[] data=File.ReadAllBytes(path); int w=0;",
      "    bool ok=WritePrinter(hp,data,data.Length,out w);",
      "    EndPagePrinter(hp);EndDocPrinter(hp);ClosePrinter(hp);",
      "    return ok?0:3;",
      "  }",
      "}",
    ].join("\n");

    const psScript = [
      "Add-Type -TypeDefinition @\"",
      csharp,
      "\"@ -Language CSharp -ErrorAction Stop",
      "$r = [WinRaw]::Send(\"" + printerEsc + "\", \"" + fileEsc + "\")",
      "Write-Host (\"exit=\" + $r)",
      "exit $r",
    ].join("\n");

    try { writeFileSync(psFile, psScript, "utf8"); }
    catch (e: any) { return reject(new Error("Gagal tulis ps1: " + e.message)); }

    const proc = spawn("powershell.exe", [
      "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
      "-File", psFile,
    ], { shell: false });

    let out = "";
    proc.stdout?.on("data", (c: Buffer) => { out += c.toString(); });
    proc.stderr?.on("data", (c: Buffer) => { out += c.toString(); });

    proc.on("close", (code) => {
      const msg = out.trim();
      console.log("[printer] exit=" + code + " out=" + msg);
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
      try { unlinkSync(psFile); } catch { /* ignore */ }
      if (code === 0) resolve();
      else reject(new Error("Print gagal (code " + code + "): " + (msg || "unknown")));
    });

    proc.on("error", (err) => {
      console.error("[printer] spawn: " + err.message);
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
      try { unlinkSync(psFile); } catch { /* ignore */ }
      reject(new Error(err.message));
    });
  });
}

function buildTestBuffer(): Buffer {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: 'file:/dev/null',
    width: LINE_WIDTH,
    characterSet: CharacterSet.PC852_LATIN2,
    removeSpecialCharacters: false,
    lineCharacter: '-',
  });

  printer.alignCenter();
  printer.bold(true);
  printer.setTextDoubleHeight();
  printer.println('TEST PRINT');
  printer.setTextNormal();
  printer.bold(false);
  printer.drawLine();
  printer.println('Printer terhubung dengan baik');
  printer.println(new Date().toLocaleString('id-ID'));
  printer.drawLine();
  printer.println('Jika terbaca, printer siap.');
  printer.newLine();
  printer.newLine();
  printer.cut();

  return printer.getBuffer() as Buffer;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function printReceipt(data: ReceiptData, printerName?: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> {
  if (!printerName) {
    return { ok: false, error: { code: PRINT_ERRORS.PRINTER_NOT_FOUND, message: 'Nama printer belum diatur di Pengaturan' } };
  }
  try {
    const buffer = buildEscposBuffer(data);
    await sendRawToPrinter(buffer, printerName);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: { code: PRINT_ERRORS.PRINT_FAILED, message: err.message || 'Print gagal' } };
  }
}

export async function printTestPage(printerName?: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> {
  if (!printerName) {
    return { ok: false, error: { code: PRINT_ERRORS.PRINTER_NOT_FOUND, message: 'Nama printer belum diatur di Pengaturan' } };
  }
  try {
    const buffer = buildTestBuffer();
    await sendRawToPrinter(buffer, printerName);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: { code: PRINT_ERRORS.PRINTER_NOT_FOUND, message: err.message || 'Printer tidak terhubung' } };
  }
}


// Open cash drawer via ESC/POS raw command
export async function openCashDrawer(printerName?: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> {
  if (!printerName) {
    return { ok: false, error: { code: PRINT_ERRORS.PRINTER_NOT_FOUND, message: 'Nama printer diperlukan untuk buka laci' } };
  }

  try {
    // ESC/POS command for cash drawer: ESC p pin onTime offTime
    // pin 2 (default) → byte 0, pin 5 → byte 1
    const pin: number = 2;
    const onTime = 25;  // 25ms / 2 = 12.5ms
    const offTime = 250; // 250ms / 2 = 125ms
    const escposPin = pin === 5 ? 1 : 0;
    const raw = Buffer.from([0x1B, 0x70, escposPin, Math.min(255, Math.max(0, Math.round(onTime / 2))), Math.min(255, Math.max(0, Math.round(offTime / 2)))]);

    // Write raw bytes to temp file then print via PowerShell
    const tmpFile = join(tmpdir(), `pos_drawer_${Date.now()}.bin`).replace(/\\/g, '/');
    writeFileSync(tmpFile, raw);

    const psCmd = `Add-Type -AssemblyName System.Printing;
$srv = New-Object System.Printing.LocalPrintServer;
$q = $srv.GetPrintQueue('${printerName.replace(/'/g, "''")}');
$j = $q.AddJob('pos_drawer');
$s = $j.JobStream;
$b = [System.IO.File]::ReadAllBytes('${tmpFile.replace(/'/g, "''")}');
$s.Write($b, 0, $b.Length);
$s.Close()`;

    return new Promise((resolve) => {
      const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCmd], { shell: false });
      let stderr = '';
      proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      proc.on('close', (code) => {
        try { unlinkSync(tmpFile); } catch { /* ignore */ }
        if (code === 0) {
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: { code: PRINT_ERRORS.PRINTER_NOT_FOUND, message: `Gagal buka laci (exit ${code}): ${stderr.trim()}` } });
        }
      });
      proc.on('error', (err) => {
        try { unlinkSync(tmpFile); } catch { /* ignore */ }
        resolve({ ok: false, error: { code: PRINT_ERRORS.PRINTER_NOT_FOUND, message: err.message } });
      });
    });
  } catch (err: any) {
    return { ok: false, error: { code: PRINT_ERRORS.PRINTER_NOT_FOUND, message: err.message || 'Gagal buka drawer' } };
  }
}
