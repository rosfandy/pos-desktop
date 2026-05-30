import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations, type AnyColumn } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  pin: text('pin'),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['admin', 'manager', 'cashier'] }).notNull().default('cashier'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─── Settings ────────────────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

// ─── Shifts ─────────────────────────────────────────────────────────────────
export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  openedAt: integer('opened_at', { mode: 'timestamp' }).notNull(),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  openingCash: integer('opening_cash').notNull().default(0),
  closingCash: integer('closing_cash'),
  expectedCash: integer('expected_cash'),
  totalSales: integer('total_sales').notNull().default(0),
  totalCashSales: integer('total_cash_sales').notNull().default(0),
  totalNonCashSales: integer('total_non_cash_sales').notNull().default(0),
  discrepancy: integer('discrepancy'),
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
  notes: text('notes'),
});

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

// ─── Categories ────────────────────────────────────────────────────────────────
// Note: self-referential parentId FK defined in migration SQL (sql.js limitation)
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  parentId: text('parent_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  barcode: text('barcode').unique(),
  category: text('category'),
  categoryId: text('category_id').references(() => categories.id),
  priceBuy: integer('price_buy').notNull().default(0),
  priceSell: integer('price_sell').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  baseUnit: text('base_unit').notNull().default('pcs'),
  imagePath: text('image_path'),
  minStock: integer('min_stock').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// ─── Product Units ─────────────────────────────────────────────────────────────
export const productUnits = sqliteTable('product_units', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id).notNull(),
  unitName: text('unit_name').notNull(),
  conversionFactor: integer('conversion_factor').notNull().default(1),
  priceSell: integer('price_sell'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type ProductUnit = typeof productUnits.$inferSelect;
export type NewProductUnit = typeof productUnits.$inferInsert;

// ─── Product History (Audit Trail) ─────────────────────────────────────────────
export const productHistory = sqliteTable('product_history', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id).notNull(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(), // 'create' | 'update' | 'delete' | 'stock_change'
  changedAt: integer('changed_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  oldData: text('old_data'), // JSON
  newData: text('new_data'), // JSON
  notes: text('notes'),
});

export type ProductHistory = typeof productHistory.$inferSelect;
export type NewProductHistory = typeof productHistory.$inferInsert;


// ─── Locations (Warehouse / Store) ─────────────────────────────────────────────

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['store', 'warehouse', 'backroom', 'other'] }).notNull().default('store'),
  address: text('address'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

// ─── Customers ──────────────────────────────────────────────────────────────────

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').unique(),
  email: text('email'),
  address: text('address'),
  points: integer('points').notNull().default(0),
  tier: text('tier', { enum: ['bronze', 'silver', 'gold', 'platinum'] }).notNull().default('bronze'),
  totalSpent: integer('total_spent').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// ─── Transactions ────────────────────────────────────────────────────────────────
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').unique().notNull(),
  customerId: text('customer_id'),
  userId: text('user_id').references(() => users.id).notNull(),
  subtotal: integer('subtotal').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  discountPercent: integer('discount_percent').default(0),
  tax: integer('tax').notNull().default(0),
  taxPercent: integer('tax_percent').default(0),
  total: integer('total').notNull().default(0),
  paymentMethod: text('payment_method', { enum: ['cash', 'debit', 'qris', 'transfer', 'credit'] }).notNull(),
  amountPaid: integer('amount_paid').notNull().default(0),
  change: integer('change').notNull().default(0),
  status: text('status', { enum: ['completed', 'held', 'voided', 'refunded'] }).notNull().default('completed'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  shiftId: text('shift_id').references(() => shifts.id),
  voidReason: text('void_reason'),
  notes: text('notes'),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export interface TransactionWithItems extends Transaction {
  items: TransactionItem[];
  userName: string | null;
  customerName?: string | null;
}

// ─── Transaction Items ─────────────────────────────────────────────────────────
export const transactionItems = sqliteTable('transaction_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').references(() => transactions.id).notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unit: text('unit').notNull().default('pcs'),
  price: integer('price').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  total: integer('total').notNull().default(0),
});

export type TransactionItem = typeof transactionItems.$inferSelect;
export type NewTransactionItem = typeof transactionItems.$inferInsert;

// ─── Inventory Logs ─────────────────────────────────────────────────────────────
export const inventoryLogs = sqliteTable('inventory_logs', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id).notNull(),
  locationId: text('location_id').references(() => locations.id).notNull(),
  type: text('type', { enum: ['in', 'out', 'adjustment', 'sale', 'return', 'damage', 'expired', 'transfer_in', 'transfer_out'] }).notNull(),
  quantity: integer('quantity').notNull(),              // in base unit
  unit: text('unit').notNull(),                         // display unit
  conversionFactor: integer('conversion_factor').notNull().default(1),
  reason: text('reason'),
  referenceId: text('reference_id'),
  userId: text('user_id').references(() => users.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type NewInventoryLog = typeof inventoryLogs.$inferInsert;
