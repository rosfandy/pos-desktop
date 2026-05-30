-- Migration: 004_locations
-- Creates: locations table (warehouse/store), adds locationId to inventory_logs
-- Note: SQLite does not support ALTER TABLE DROP/RENAME for CHECK constraints,
--   so inventory_logs is rebuilt with the updated type enum.

-- 1. Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  type        TEXT    NOT NULL DEFAULT 'store' CHECK (type IN ('store','warehouse','backroom','other')),
  address     TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS locations_type_idx ON locations(type);
CREATE INDEX IF NOT EXISTS locations_is_active_idx ON locations(is_active);

-- 2. Seed default location
INSERT OR IGNORE INTO locations (id, name, type, address, is_active, created_at)
VALUES ('loc_main', 'Toko Utama', 'store', NULL, 1, strftime('%s','now'));

-- 3. Rebuild inventory_logs with location_id + extended type enum
CREATE TABLE IF NOT EXISTS inventory_logs_new (
  id               TEXT    PRIMARY KEY,
  product_id       TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id      TEXT    NOT NULL REFERENCES locations(id),
  type             TEXT    NOT NULL CHECK (type IN ('in','out','adjustment','sale','return','damage','expired','transfer_in','transfer_out')),
  quantity         INTEGER NOT NULL,
  unit             TEXT    NOT NULL,
  conversion_factor INTEGER NOT NULL DEFAULT 1,
  reason           TEXT,
  reference_id     TEXT,
  user_id          TEXT    NOT NULL REFERENCES users(id),
  created_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS inventory_logs_new_product_id_idx  ON inventory_logs_new(product_id);
CREATE INDEX IF NOT EXISTS inventory_logs_new_created_at_idx  ON inventory_logs_new(created_at);
CREATE INDEX IF NOT EXISTS inventory_logs_new_location_id_idx ON inventory_logs_new(location_id);

INSERT INTO inventory_logs_new (
  id, product_id, location_id, type, quantity, unit, conversion_factor, reason, reference_id, user_id, created_at
)
SELECT id, product_id, 'loc_main', type, quantity, unit, conversion_factor, reason, reference_id, user_id, created_at
FROM inventory_logs;

DROP TABLE inventory_logs;
ALTER TABLE inventory_logs_new RENAME TO inventory_logs;
