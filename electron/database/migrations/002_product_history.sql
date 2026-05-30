-- Migration: 002_product_history
-- Creates: product_history table for product change audit trail

CREATE TABLE IF NOT EXISTS product_history (
  id          TEXT    PRIMARY KEY,
  product_id  TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     TEXT    REFERENCES users(id),
  action      TEXT    NOT NULL,              -- 'create' | 'update' | 'delete' | 'stock_change'
  changed_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  old_data    TEXT,                         -- JSON string of previous values (nullable)
  new_data    TEXT,                         -- JSON string of new values (nullable)
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS product_history_product_id_idx ON product_history(product_id);
CREATE INDEX IF NOT EXISTS product_history_changed_at_idx ON product_history(changed_at);
