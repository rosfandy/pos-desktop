import { app, BrowserWindow, nativeImage } from 'electron';
import { join } from 'path';
import { registerAuthHandlers } from './ipc/auth.ts';
import { registerSettingsHandlers } from './ipc/settings.ts';
import { registerTransactionHandlers } from './ipc/transaction.ts';
import { registerBackupHandlers } from './ipc/backup.ts';
import { registerPrinterHandlers } from './ipc/printer.ts';
import { registerProductHandlers } from './ipc/product.ts';
import { registerBulkImportHandlers } from './ipc/bulk-import.ts';
import { registerBulkExportHandlers } from './ipc/bulk-export.ts';
import { registerCategoryHandlers } from './ipc/category.ts';
import { registerCustomerHandlers } from './ipc/customer.ts';
import { registerCustomerBulkExportHandlers } from './ipc/customer-bulk-export.ts';
import { registerCustomerBulkImportHandlers } from './ipc/customer-bulk-import.ts';
import { registerInventoryHandlers } from './ipc/inventory.ts';
import { registerReportHandlers } from './ipc/report.ts';
import { registerShiftHandlers } from './ipc/shift.ts';
import { registerUpdaterHandlers } from './ipc/updater.ts';
import { migrate, getDb, seedAdmin } from './db/index.ts';

const __dirname = join(__filename, '..');
const iconPath = join(__dirname, '..', 'build-resources', 'icon.png');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const icon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'POS Desktop',
    icon: icon.isEmpty() ? undefined : icon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js'),
    },
    show: false,
    backgroundColor: '#f8fafc',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  app.setName('POS Desktop');
  console.log('[APP] whenReady fired');

  // ── Database ──────────────────────────────────────────────────────────
  try {
    await getDb();
    console.log('[APP] DB initialized');
    await migrate();
    console.log('[APP] Migrations applied');
    await seedAdmin();
    console.log('[APP] Seed data applied');
  } catch (err) {
    console.error('[APP] DB error:', err);
  }

  // ── IPC ───────────────────────────────────────────────────────────────
  registerAuthHandlers();
  registerSettingsHandlers();
  registerTransactionHandlers();
  registerBackupHandlers();
  registerPrinterHandlers();
  registerProductHandlers();
  registerBulkImportHandlers();
  registerBulkExportHandlers();
  registerCategoryHandlers();
  registerCustomerHandlers();
  registerCustomerBulkExportHandlers();
  registerCustomerBulkImportHandlers();
  registerInventoryHandlers();
  registerReportHandlers();
  registerShiftHandlers();
  console.log('[APP] IPC handlers registered');

  createWindow();

  // Register updater handlers (always — autoUpdater aman dipanggil di dev)
  registerUpdaterHandlers(mainWindow!);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
