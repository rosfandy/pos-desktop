// Type declarations for the preload-exposed window.api

// ─── Report Types ─────────────────────────────────────────────────────────────

export interface ReportParams {
  startDate: number; // unix seconds
  endDate: number;
}

export interface SalesSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageTicket: number;
  totalItems: number;
  totalDiscount: number;
  totalTax: number;
  totalCogs: number;
  totalProfit: number;
}

export interface SalesByDay {
  date: string;
  revenue: number;
  transactions: number;
}

export interface SalesByProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface SalesByCategory {
  categoryName: string;
  revenue: number;
  quantity: number;
}

export interface SalesByPayment {
  method: string;
  total: number;
  count: number;
}

export interface SalesByCashier {
  userId: string;
  userName: string;
  total: number;
  transactions: number;
}

export interface SalesByShift {
  shiftId: string | null;
  userName: string;
  openedAt: number;
  closedAt: number | null;
  status: string;
  total: number;
  transactions: number;
}

export interface SalesReport {
  params: ReportParams;
  summary: SalesSummary;
  byDay: SalesByDay[];
  byProduct: SalesByProduct[];
  byCategory: SalesByCategory[];
  byPayment: SalesByPayment[];
  byCashier: SalesByCashier[];
  byShift: SalesByShift[];
}

export interface StockReportRow {
  productId: string;
  productName: string;
  sku: string | null;
  categoryName: string | null;
  currentStock: number;
  baseUnit: string;
  minStock: number;
  status: 'ok' | 'low' | 'out';
  stockValue: number;
}

export interface StockReport {
  asOfDate: number;
  products: StockReportRow[];
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface FinanceDailyRow {
  date: string;
  revenue: number;
  transactions: number;
}

export interface FinanceReport {
  params: ReportParams;
  revenue: number;
  discount: number;
  tax: number;
  netRevenue: number;
  byDay: FinanceDailyRow[];
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  pin: string | null;
  passwordHash: string | null;
  role: 'admin' | 'manager' | 'cashier';
  isActive: boolean;
  createdAt: string;
}

export interface AuthLoginResult {
  user: User;
  token: string;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiErr {
  ok: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface Shift {
  id: string;
  userId: string;
  openedAt: number;
  closedAt: number | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  totalSales: number;
  totalCashSales: number;
  totalNonCashSales: number;
  discrepancy: number | null;
  status: 'open' | 'closed';
  notes: string | null;
  userName?: string;
}

export interface ShiftSummary {
  shiftId: string;
  totalTransactions: number;
  totalSales: number;
  totalCashSales: number;
  totalNonCashSales: number;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  discrepancy: number | null;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  customerName?: string | null;
  userId: string;
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  status: 'completed' | 'held' | 'voided' | 'refunded';
  createdAt: number;
  shiftId: string | null;
  voidReason: string | null;
  userName?: string | null;
  items: TransactionItem[];
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  discount: number;
  total: number;
}

// ─── Product Types ─────────────────────────────────────────────────────────────

export interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  priceBuy: number;
  priceSell: number;
  stock: number;
  baseUnit: string;
  imagePath: string | null;
  minStock: number;
}

export interface ProductUnitRow {
  id: string;
  productId: string;
  unitName: string;
  conversionFactor: number;
  priceSell: number | null;
  isDefault: boolean;
}

export interface ProductWithUnits extends ProductRow {
  units: ProductUnitRow[];
}

export interface ProductPageResult {
  data: ProductRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ProductCounts {
  total: number;
  active: number;
  lowStock: number;
}

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
  lowStock?: boolean;
  lowStockThreshold?: number;
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  priceBuy: number;
  priceSell: number;
  stock: number;
  baseUnit: string;
  imagePath?: string;
  minStock: number;
  units: Array<{
    id?: string;
    unitName: string;
    conversionFactor: number;
    priceSell?: number;
    isDefault?: boolean;
  }>;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  priceBuy?: number;
  priceSell?: number;
  stock?: number;
  baseUnit?: string;
  imagePath?: string | null;
  minStock?: number;
  units?: Array<{
    id?: string;
    unitName: string;
    conversionFactor: number;
    priceSell?: number;
    isDefault?: boolean;
  }>;
}

export interface StockCheckResult {
  stock: number;
  minStock: number;
  isLow: boolean;
}

// ─── Product History (Audit Trail) ──────────────────────────────────────────────

export interface ProductHistoryEntry {
  id: string;
  productId: string;
  userId: string | null;
  action: 'create' | 'update' | 'delete' | 'stock_change';
  changedAt: number;
  oldData: string | null;  // JSON string
  newData: string | null;  // JSON string
  notes: string | null;
}

// ─── Inventory Types ────────────────────────────────────────────────────────────

export interface InventoryLogRow {
  id: string;
  productId: string;
  locationId: string;
  locationName?: string;
  type: 'in' | 'out' | 'adjustment' | 'sale' | 'return' | 'damage' | 'expired' | 'transfer_in' | 'transfer_out';
  quantity: number;
  unit: string;
  conversionFactor: number;
  reason: string | null;
  referenceId: string | null;
  userId: string;
  userName?: string;
  createdAt: number;
  productName?: string;
}

export interface LocationRow {
  id: string;
  name: string;
  type: 'store' | 'warehouse' | 'backroom' | 'other';
  address: string | null;
  isActive: boolean;
}

export interface StockMovementRow {
  productId: string;
  productName: string;
  baseUnit: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  adjustmentNet: number;
  closingBalance: number;
}

export interface StockInInput {
  productId: string;
  quantity: number;
  unit: string;
  locationId?: string;
  conversionFactor?: number;
  costPrice?: number;
  supplier?: string;
  reason?: string;
  userId: string;
  referenceId?: string;
}

export interface StockOutInput {
  productId: string;
  quantity: number;
  unit: string;
  locationId?: string;
  conversionFactor?: number;
  reason: string;
  userId: string;
  referenceId?: string;
}

export interface AdjustmentInput {
  productId: string;
  newQuantity: number;
  unit: string;
  locationId?: string;
  conversionFactor?: number;
  reason: string;
  userId: string;
}

export interface TransferInput {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  unit: string;
  conversionFactor?: number;
  reason: string;
  userId: string;
}

// ─── Bulk Import Types

export interface ImportRow {
  rowIndex: number;
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  priceBuy: number;
  priceSell: number;
  stock: number;
  baseUnit: string;
  minStock: number;
  units: Array<{ unitName: string; conversionFactor: number; priceSell?: number; isDefault?: boolean }>;
}

export interface CustomerImportRow {
  rowIndex: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  points: number;
  tier: string;
  totalSpent: number;
}

// ─── Customer Types ─────────────────────────────────────────────────────────────

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  createdAt: number;
}

export interface CustomerFilter {
  search?: string;
}

export interface AddPointsResult {
  customer: CustomerRow;
}

export interface RedeemPointsResult {
  customer: CustomerRow;
  discount: number;
}

export interface CustomerTransactionRow {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  createdAt: number;
  itemCount: number;
  userName: string | null;
}

// ─── Category Types ────────────────────────────────────────────────────────────

export interface CategoryRow {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  isActive: boolean;
  createdAt: number;
  productCount: number;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  status: number; // 0=ready, 1=busy, 2=error, 3=unknown
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

export interface CategoryInput {
  name: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface API {
  // Auth
  authLogin: (
    credentials: { pin?: string; email?: string; password?: string }
  ) => Promise<ApiResponse<AuthLoginResult>>;
  authLogout: () => Promise<ApiOk<void>>;
  authMe: (token?: string) => Promise<ApiResponse<User | null>>;
  authVerifyPin: (pin: string) => Promise<ApiResponse<{ ok: boolean; userId?: string; role?: string }>>;

  // Settings
  settingsGet: (key: string) => Promise<ApiResponse<string | null>>;
  settingsSet: (key: string, value: string) => Promise<ApiOk<void>>;
  settingsGetAll: () => Promise<ApiResponse<Record<string, string>>>;
  settingsGetTheme: () => Promise<ApiResponse<'light' | 'dark'>>;
  settingsSetTheme: (theme: 'light' | 'dark') => Promise<ApiOk<void>>;

  // Shift
  shiftOpen: (data: { openingCash: number; userId: string }) => Promise<ApiResponse<Shift>>;
  shiftClose: (data: { closingCash: number; shiftId: string; notes?: string }) => Promise<ApiResponse<Shift>>;
  shiftCurrent: (userId: string) => Promise<ApiResponse<Shift | null>>;
  shiftGet: (id: string) => Promise<ApiResponse<Shift | null>>;
  shiftList: (filters?: { userId?: string; status?: string; from?: number; to?: number }) => Promise<ApiResponse<Shift[]>>;
  shiftSummary: (shiftId: string) => Promise<ApiResponse<ShiftSummary>>;

  // Transaction
  transactionCreate: (data: any) => Promise<ApiResponse<any>>;
  transactionGet: (id: string) => Promise<ApiResponse<any>>;
  transactionList: (filters?: any) => Promise<ApiResponse<any[]>>;
  transactionHold: (data: any) => Promise<ApiResponse<any>>;
  transactionListHeld: () => Promise<ApiResponse<any[]>>;
  transactionUnhold: (id: string) => Promise<ApiResponse<any>>;
  transactionVoid: (id: string, reason: string) => Promise<ApiResponse<any>>;
  transactionBulkDeleteHeld: (ids: string[]) => Promise<ApiResponse<any[]>>;
  transactionRefund: (id: string, items?: any[]) => Promise<ApiResponse<any>>;

  // Printer (POS-010)
  printerList: () => Promise<ApiResponse<PrinterInfo[]>>;
  printerPrint: (data: any) => Promise<ApiResponse<any>>;
  printerTest: () => Promise<ApiResponse<any>>;
  printerOpenDrawer: () => Promise<ApiResponse<any>>;
  printerQueueList: () => Promise<ApiResponse<PrintJobInfo[]>>;
  printerQueueCancel: (jobId: string) => Promise<ApiResponse<void>>;
  printerQueueClearAll: () => Promise<ApiResponse<void>>;
  printerCheckConnection: () => Promise<ApiResponse<{ connected: boolean; name?: string; status?: number; message?: string }>>;

  // Product (POS-013 / PROD-002)
  productList: (filter?: ProductFilter) => Promise<ApiResponse<ProductPageResult>>;
  productGetByBarcode: (barcode: string) => Promise<ApiResponse<ProductRow>>;
  productGetById: (id: string) => Promise<ApiResponse<ProductRow>>;
  productGet: (id: string) => Promise<ApiResponse<ProductWithUnits>>;
  productCreate: (input: CreateProductInput) => Promise<ApiResponse<ProductWithUnits>>;
  productUpdate: (id: string, input: UpdateProductInput) => Promise<ApiResponse<ProductWithUnits>>;
  productDelete: (id: string) => Promise<ApiResponse<{ success: boolean }>>;
  productCheckStock: (id: string) => Promise<ApiResponse<StockCheckResult>>;
  productUpdateStock: (productId: string, quantityChange: number) => Promise<ApiResponse<boolean>>;
  productLowStock: (threshold?: number) => Promise<ApiResponse<ProductRow[]>>;
  productHistory: (productId: string) => Promise<ApiResponse<ProductHistoryEntry[]>>;
  productImportPreview: (data: Uint8Array) => Promise<ApiResponse<{ rows: ImportRow[]; totalRows: number; errors: Array<{ row: number; message: string }> }>>;
  productImportCommit: (rows: ImportRow[]) => Promise<ApiResponse<{ success: boolean; totalRows: number; imported: number; errors: Array<{ row: number; message: string }> }>>;
  productExport: (params: { filter?: { categoryId?: string; search?: string }; format: 'csv' | 'xlsx' }) => Promise<ApiResponse<{ success: boolean; filePath?: string; error?: string }>>;
  productBulkSave: (rows: any[]) => Promise<ApiResponse<{ success: number; errors: { row: number; message: string }[] }>>;
  productCount: () => Promise<ApiResponse<ProductCounts>>;

  // Customer (CRM)
  customerList: (filter?: { search?: string }) => Promise<ApiResponse<CustomerRow[]>>;
  customerGet: (id: string) => Promise<ApiResponse<CustomerRow>>;
  customerGetByPhone: (phone: string) => Promise<ApiResponse<CustomerRow>>;
  customerCreate: (input: { name: string; phone?: string; email?: string; address?: string; points?: number }) => Promise<ApiResponse<CustomerRow>>;
  customerUpdate: (id: string, input: Partial<{ name: string; phone: string; email: string; address: string; points: number }>) => Promise<ApiResponse<CustomerRow>>;
  customerDelete: (id: string) => Promise<ApiResponse<{ success: boolean }>>;
  customerBulkDelete: (ids: string[]) => Promise<ApiResponse<{ success: boolean; deleted: number; errors: Array<{ id: string; message: string }> }>>;
  customerAddPoints: (id: string, points: number) => Promise<ApiResponse<CustomerRow>>;
  customerRedeemPoints: (id: string, points: number) => Promise<ApiResponse<RedeemPointsResult>>;
  customerRecordTransaction: (id: string, totalCents: number) => Promise<ApiResponse<{ customer: CustomerRow; earnedPoints: number }>>;
  customerCalculatePoints: (amountCents: number, tier: string) => Promise<ApiResponse<{ points: number }>>;
  customerCalculateTier: (totalSpent: number) => Promise<ApiResponse<{ tier: CustomerRow['tier'] }>>;
  customerTransactions: (customerId: string, limit?: number) => Promise<ApiResponse<CustomerTransactionRow[]>>;
  customerImportPreview: (data: Uint8Array) => Promise<ApiResponse<{ rows: CustomerImportRow[]; totalRows: number; errors: Array<{ row: number; message: string }> }>>;
  customerImportCommit: (rows: CustomerImportRow[]) => Promise<ApiResponse<{ success: boolean; totalRows: number; imported: number; errors: Array<{ row: number; message: string }> }>>;
  customerExport: (params: { filter?: { search?: string }; format: 'csv' | 'xlsx' }) => Promise<ApiResponse<{ success: boolean; filePath?: string; error?: string }>>;

  // Inventory (INV-002)
  inventoryStockIn: (data: StockInInput) => Promise<ApiResponse<InventoryLogRow>>;
  inventoryStockOut: (data: StockOutInput) => Promise<ApiResponse<InventoryLogRow>>;
  inventoryAdjust: (data: AdjustmentInput) => Promise<ApiResponse<InventoryLogRow>>;
  inventoryTransfer: (data: TransferInput) => Promise<ApiResponse<{ outLog: InventoryLogRow; inLog: InventoryLogRow }>>;
  inventoryLocations: () => Promise<ApiResponse<LocationRow[]>>;
  inventoryMovement: (filter?: { productId?: string; locationId?: string; startDate?: number; endDate?: number; type?: string }) => Promise<ApiResponse<StockMovementRow[]>>;
  inventoryLogs: (filter?: { productId?: string; type?: string; userId?: string; startDate?: number; endDate?: number; limit?: number; offset?: number }) => Promise<ApiResponse<InventoryLogRow[]>>;
  inventoryCurrentStock: (productId: string) => Promise<ApiResponse<{ stock: number }>>;

  // Category (PROD-003)
  categoryList: () => Promise<ApiResponse<CategoryRow[]>>;
  categoryGet: (id: string) => Promise<ApiResponse<CategoryRow>>;
  categoryCreate: (input: CategoryInput) => Promise<ApiResponse<CategoryRow>>;
  categoryUpdate: (id: string, input: CategoryInput) => Promise<ApiResponse<CategoryRow>>;
  categoryDelete: (id: string) => Promise<ApiResponse<{ success: boolean }>>;

  // Cash Flow
  cashFlowRecordOut: (dto: { shiftId: string; amount: number; reason: string; userId: string }) => Promise<ApiResponse<any>>;
  cashFlowRecordIn: (dto: { shiftId: string; amount: number; reason: string; userId: string }) => Promise<ApiResponse<any>>;
  cashFlowList: (shiftId: string) => Promise<ApiResponse<any[]>>;
  cashFlowSummary: (shiftId: string) => Promise<ApiResponse<{ totalIn: number; totalOut: number }>>;
  cashFlowListByDate: (params: { startDate: number; endDate: number }) => Promise<ApiResponse<any[]>>;

  // App
  getDbPath: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    api: API;
  }
}
