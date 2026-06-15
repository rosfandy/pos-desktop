import { app, BrowserWindow, nativeImage, ipcMain } from 'electron';
import { join } from 'path';
import { registerAuthHandlers } from './ipc/auth/route.ts';
import { registerSettingsHandlers } from './ipc/settings/route.ts';
import { registerTransactionHandlers } from './ipc/transaction/route.ts';
import { registerBackupHandlers } from './ipc/backup/route.ts';
import { registerPrinterHandlers } from './ipc/printer/route.ts';
import { registerProductHandlers } from './ipc/product/route.ts';
import { registerCategoryHandlers } from './ipc/category/route.ts';
import { registerCustomerHandlers } from './ipc/customer/route.ts';
import { registerInventoryHandlers } from './ipc/inventory/route.ts';
import { registerReportHandlers } from './ipc/report/route.ts';
import { registerShiftHandlers } from './ipc/shift/route.ts';
import { registerCashFlowHandlers } from './ipc/cashFlow/route.ts';
import { registerUpdaterHandlers } from './ipc/updater/route.ts';
import { migrate, getDb, seedAdmin, getDbPath } from './db/index.ts';

const APP_NAME = 'POS Desktop';
const __dirname = join(__filename, '..');

// ── Icon ────────────────────────────────────────────────────────────────────
// In dev: read directly from build-resources/
// In production: read from extraResources (copied by electron-builder)
// Windows taskbar needs .ico for best results; use .ico on win32, .png on others
const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
const iconPath = app.isPackaged
  ? join(process.resourcesPath, iconFile)
  : join(__dirname, '..', 'build-resources', iconFile);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Set app user model id (Windows taskbar grouping + icon)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.posdesktop.app');
  }

  const icon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: APP_NAME,
    icon: icon.isEmpty() ? undefined : icon,
    fullscreen: false,
    frame: true,
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
  // Set app name early so Windows uses it for taskbar/title
  app.setName(APP_NAME);
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
  registerCategoryHandlers();
  registerCustomerHandlers();
  registerInventoryHandlers();
  registerReportHandlers();
  registerShiftHandlers();
  registerCashFlowHandlers();
  ipcMain.handle('app:getDbPath', () => getDbPath());
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
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
