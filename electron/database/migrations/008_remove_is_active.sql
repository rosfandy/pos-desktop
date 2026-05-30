-- Migration: 008_remove_is_active
-- Drop column is_active from products table
-- SQLite < 3.35 does not support DROP COLUMN, so we recreate the table.

BEGIN TRANSACTION;

-- 1. Create new table without is_active
CREATE TABLE products_new (
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

-- 2. Copy data (skip is_active column)
INSERT INTO products_new (id, name, sku, barcode, category, category_id, price_buy, price_sell, stock, base_unit, image_path, min_stock, created_at, updated_at)
  SELECT id, name, sku, barcode, category, category_id, price_buy, price_sell, stock, base_unit, image_path, min_stock, created_at, updated_at
  FROM products;

-- 3. Drop old table
DROP TABLE products;

-- 4. Rename new table
ALTER TABLE products_new RENAME TO products;

-- 5. Recreate indexes
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique     ON products(sku);
CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique ON products(barcode);

COMMIT;
