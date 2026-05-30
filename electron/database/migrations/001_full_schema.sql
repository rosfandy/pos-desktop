-- Migration: 001_full_schema
-- Creates: users, settings, shifts, categories, products, product_units,
--          transactions, transaction_items, drizzle_migrations
-- Plus: seed categories, unique indexes

-- ─── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  name           TEXT    NOT NULL,
  email          TEXT    UNIQUE,
  pin            TEXT,
  password_hash  TEXT,
  role           TEXT    NOT NULL DEFAULT 'cashier',
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);

-- ─── Settings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT    NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- ─── Shifts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT    NOT NULL REFERENCES users(id),
  opened_at     INTEGER NOT NULL,
  closed_at     INTEGER,
  opening_cash  INTEGER NOT NULL DEFAULT 0,
  closing_cash  INTEGER,
  total_sales   INTEGER NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'open'
);

-- ─── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  name       TEXT    NOT NULL,
  parent_id  TEXT    REFERENCES categories(id),
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- ─── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT    NOT NULL,
  sku         TEXT    UNIQUE,
  barcode     TEXT    UNIQUE,
  category    TEXT,
  category_id TEXT    REFERENCES categories(id),
  price_buy   INTEGER NOT NULL DEFAULT 0,
  price_sell  INTEGER NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  base_unit   TEXT    NOT NULL DEFAULT 'pcs',
  image_path  TEXT,
  min_stock   INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique     ON products(sku);
CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique ON products(barcode);

-- ─── Product Units ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_units (
  id                 TEXT PRIMARY KEY,
  product_id         TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_name          TEXT    NOT NULL,
  conversion_factor  INTEGER NOT NULL DEFAULT 1,
  price_sell         INTEGER,
  is_default         INTEGER NOT NULL DEFAULT 0,
  created_at         INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS product_units_product_unit_idx
  ON product_units (product_id, unit_name);

-- ─── Transactions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT PRIMARY KEY,
  invoice_number TEXT    UNIQUE NOT NULL,
  customer_id    TEXT,
  user_id        TEXT    NOT NULL REFERENCES users(id),
  subtotal       INTEGER NOT NULL DEFAULT 0,
  discount       INTEGER NOT NULL DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  tax            INTEGER NOT NULL DEFAULT 0,
  tax_percent    INTEGER DEFAULT 0,
  total          INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT    NOT NULL,
  amount_paid    INTEGER NOT NULL DEFAULT 0,
  change         INTEGER NOT NULL DEFAULT 0,
  status         TEXT    NOT NULL DEFAULT 'completed',
  created_at     INTEGER NOT NULL,
  shift_id       TEXT    REFERENCES shifts(id),
  void_reason    TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS transactions_invoice_number_unique ON transactions(invoice_number);

-- ─── Transaction Items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_items (
  id            TEXT PRIMARY KEY,
  transaction_id TEXT   NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id    TEXT    NOT NULL,
  product_name  TEXT    NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit          TEXT    NOT NULL DEFAULT 'pcs',
  price         INTEGER NOT NULL DEFAULT 0,
  discount      INTEGER NOT NULL DEFAULT 0,
  total         INTEGER NOT NULL DEFAULT 0
);

-- ─── Migration tracker ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drizzle_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);