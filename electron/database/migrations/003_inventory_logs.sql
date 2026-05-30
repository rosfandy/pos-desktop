-- Migration: 003_inventory_logs
-- Creates: inventory_logs table for stock in/out/adjustment tracking

CREATE TABLE IF NOT EXISTS inventory_logs (
  id                TEXT    PRIMARY KEY,
  product_id        TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type              TEXT    NOT NULL CHECK (type IN ('in','out','adjustment','sale','return','damage','expired')),
  quantity          INTEGER NOT NULL,
  unit              TEXT    NOT NULL,
  conversion_factor INTEGER NOT NULL DEFAULT 1,
  reason            TEXT,
  reference_id      TEXT,
  user_id           TEXT    NOT NULL REFERENCES users(id),
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS inventory_logs_product_id_idx  ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS inventory_logs_created_at_idx  ON inventory_logs(created_at);
