import { contextBridge, ipcRenderer } from 'electron';

// Minimal API surface — channels will be expanded as modules are built
const api = {
  // Auth channels (CORE-005)
  authLogin: (credentials: { pin?: string; email?: string; password?: string }) =>
    ipcRenderer.invoke('auth:login', credentials),
  authLogout: () => ipcRenderer.invoke('auth:logout'),
  authMe: (token?: string) => ipcRenderer.invoke('auth:me', token),
  authVerifyPin: (pin: string) => ipcRenderer.invoke('auth:verifyPin', pin),

  // Settings channels (CORE-008)
  settingsGet: (key: string) => ipcRenderer.invoke('settings:get', key),
  settingsSet: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  settingsGetAll: () => ipcRenderer.invoke('settings:getAll'),
  settingsGetTheme: () => ipcRenderer.invoke('settings:getTheme'),
  settingsSetTheme: (theme: 'light' | 'dark') => ipcRenderer.invoke('settings:setTheme', theme),

  // Shift channels (CORE-010)
  shiftOpen: (data: { openingCash: number; userId: string }) =>
    ipcRenderer.invoke('shift:open', data),
  shiftClose: (data: { closingCash: number; shiftId: string; notes?: string }) =>
    ipcRenderer.invoke('shift:close', data),
  shiftCurrent: (userId: string) => ipcRenderer.invoke('shift:current', userId),
  shiftGet: (id: string) => ipcRenderer.invoke('shift:get', id),
  shiftList: (filter?: any) => ipcRenderer.invoke('shift:list', filter),
  shiftSummary: (shiftId: string) => ipcRenderer.invoke('shift:summary', shiftId),

  // Transaction channels (POS-008)
  transactionCreate: (dto: any) => ipcRenderer.invoke('transaction:create', dto),
  transactionGet: (id: string) => ipcRenderer.invoke('transaction:get', id),
  transactionList: (filters?: any) => ipcRenderer.invoke('transaction:list', filters),
  transactionHold: (dto: any) => ipcRenderer.invoke('transaction:hold', dto),
  transactionUnhold: (id: string) => ipcRenderer.invoke('transaction:unhold', id),
  transactionListHeld: () => ipcRenderer.invoke('transaction:listHeld'),
  transactionVoid: (id: string, reason: string) => ipcRenderer.invoke('transaction:void', id, reason),
  transactionBulkDeleteHeld: (ids: string[]) => ipcRenderer.invoke('transaction:bulkDeleteHeld', ids),
  transactionRefund: (id: string, items?: any[]) => ipcRenderer.invoke('transaction:refund', id, items),

  // Backup channels (CORE-011)
  backupCreate: () => ipcRenderer.invoke('backup:create'),
  backupRestore: () => ipcRenderer.invoke('backup:restore'),

  // Printer channels (POS-010)
  printerList: () => ipcRenderer.invoke('printer:list'),
  printerPrint: (data: any) => ipcRenderer.invoke('printer:print', data),
  printerTest: () => ipcRenderer.invoke('printer:test'),
  printerOpenDrawer: () => ipcRenderer.invoke('printer:open-drawer'),
  printerQueueList: () => ipcRenderer.invoke('printer:queueList'),
  printerQueueCancel: (jobId: string) => ipcRenderer.invoke('printer:queueCancel', jobId),

  // Product channels (POS-013 / PROD-002)
  productList: (filter?: any) => ipcRenderer.invoke('product:list', filter),
  productGetByBarcode: (barcode: string) => ipcRenderer.invoke('product:getByBarcode', barcode),
  productGetById: (id: string) => ipcRenderer.invoke('product:getById', id),
  productGet: (id: string) => ipcRenderer.invoke('product:get', id),
  productCreate: (input: any) => ipcRenderer.invoke('product:create', input),
  productUpdate: (id: string, input: any) => ipcRenderer.invoke('product:update', id, input),
  productDelete: (id: string) => ipcRenderer.invoke('product:delete', id),
  productCheckStock: (id: string) => ipcRenderer.invoke('product:checkStock', id),
  productUpdateStock: (productId: string, quantityChange: number) => ipcRenderer.invoke('product:updateStock', productId, quantityChange),
  productLowStock: (threshold?: number) => ipcRenderer.invoke('product:lowStock', threshold),
  productHistory: (productId: string) => ipcRenderer.invoke('product:history', productId),
  productImportPreview: (data: Uint8Array) => ipcRenderer.invoke('product:import-preview', data),
  productImportCommit: (rows: any[]) => ipcRenderer.invoke('product:import-commit', rows),
  productExport: (params: any) => ipcRenderer.invoke('product:export', params),
  productBulkSave: (rows: any[]) => ipcRenderer.invoke('product:bulkSave', rows),
  productCount: () => ipcRenderer.invoke('product:count'),

  // Inventory channels (INV-002)
  inventoryStockIn: (data: any) => ipcRenderer.invoke('inventory:stockIn', data),
  inventoryStockOut: (data: any) => ipcRenderer.invoke('inventory:stockOut', data),
  inventoryAdjust: (data: any) => ipcRenderer.invoke('inventory:adjust', data),
  inventoryTransfer: (data: any) => ipcRenderer.invoke('inventory:transfer', data),
  inventoryLocations: () => ipcRenderer.invoke('inventory:locations'),
  inventoryMovement: (filter?: any) => ipcRenderer.invoke('inventory:movement', filter),
  inventoryLogs: (filter?: any) => ipcRenderer.invoke('inventory:logs', filter),
  inventoryCurrentStock: (productId: string) => ipcRenderer.invoke('inventory:currentStock', productId),

  // Category channels (PROD-003)
  categoryList: () => ipcRenderer.invoke('category:list'),
  categoryGet: (id: string) => ipcRenderer.invoke('category:get', id),
  categoryCreate: (input: any) => ipcRenderer.invoke('category:create', input),
  categoryUpdate: (id: string, input: any) => ipcRenderer.invoke('category:update', id, input),
  categoryDelete: (id: string) => ipcRenderer.invoke('category:delete', id),

  // Customer channels (CRM)
  customerList: (filter?: { search?: string }) => ipcRenderer.invoke('customer:list', filter),
  customerGet: (id: string) => ipcRenderer.invoke('customer:get', id),
  customerGetByPhone: (phone: string) => ipcRenderer.invoke('customer:getByPhone', phone),
  customerCreate: (input: { name: string; phone?: string; email?: string; address?: string; points?: number }) => ipcRenderer.invoke('customer:create', input),
  customerUpdate: (id: string, input: any) => ipcRenderer.invoke('customer:update', id, input),
  customerDelete: (id: string) => ipcRenderer.invoke('customer:delete', id),
  customerBulkDelete: (ids: string[]) => ipcRenderer.invoke('customer:bulkDelete', ids),
  customerAddPoints: (id: string, points: number) => ipcRenderer.invoke('customer:addPoints', id, points),
  customerRedeemPoints: (id: string, points: number) => ipcRenderer.invoke('customer:redeemPoints', id, points),
  customerRecordTransaction: (id: string, totalCents: number) => ipcRenderer.invoke('customer:recordTransaction', id, totalCents),
  customerCalculatePoints: (amountCents: number, tier: string) => ipcRenderer.invoke('customer:calculatePoints', amountCents, tier),
  customerCalculateTier: (totalSpent: number) => ipcRenderer.invoke('customer:calculateTier', totalSpent),
  customerTransactions: (customerId: string, limit?: number) => ipcRenderer.invoke('customer:transactions', customerId, limit),
  customerImportPreview: (data: Uint8Array) => ipcRenderer.invoke('customer:import-preview', data),
  customerImportCommit: (rows: any[]) => ipcRenderer.invoke('customer:import-commit', rows),
  customerExport: (params: any) => ipcRenderer.invoke('customer:export', params),

  // Report channels (RPT)
  reportSales: (params: { startDate: number; endDate: number }) => ipcRenderer.invoke('report:sales', params),
  reportStock: () => ipcRenderer.invoke('report:stock'),
  reportFinance: (params: { startDate: number; endDate: number }) => ipcRenderer.invoke('report:finance', params),

  // Cash flow channels
  cashFlowRecordOut: (dto: { shiftId: string; amount: number; reason: string; userId: string }) =>
    ipcRenderer.invoke('cashFlow:recordOut', dto),
  cashFlowRecordIn: (dto: { shiftId: string; amount: number; reason: string; userId: string }) =>
    ipcRenderer.invoke('cashFlow:recordIn', dto),
  cashFlowList: (shiftId: string) => ipcRenderer.invoke('cashFlow:list', shiftId),
  cashFlowSummary: (shiftId: string) => ipcRenderer.invoke('cashFlow:summary', shiftId),
  cashFlowListByDate: (params: { startDate: number; endDate: number }) => ipcRenderer.invoke('cashFlow:listByDate', params),

  // App channels
  getDbPath: () => ipcRenderer.invoke('app:getDbPath'),
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),

  // Updater channels
  updaterCheck: () => ipcRenderer.invoke('updater:check'),
  updaterDownload: () => ipcRenderer.invoke('updater:download'),
  updaterInstall: () => ipcRenderer.invoke('updater:install'),
  onUpdaterEvent: (callback: (event: string, data?: any) => void) => {
    const events = ['updater:checking', 'updater:available', 'updater:not-available', 'updater:progress', 'updater:downloaded', 'updater:error'];
    const handlers = events.map(ch => {
      const handler = (_: any, data: any) => callback(ch, data);
      ipcRenderer.on(ch, handler);
      return { ch, handler };
    });
    // Return cleanup function
    return () => handlers.forEach(({ ch, handler }) => ipcRenderer.removeListener(ch, handler));
  },
};

contextBridge.exposeInMainWorld('api', api);
