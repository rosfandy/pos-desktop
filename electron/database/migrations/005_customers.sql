-- Migration: 005_customers
-- Creates: customers table for CRM module

CREATE TABLE IF NOT EXISTS customers (
  id           TEXT    PRIMARY KEY,
  name         TEXT    NOT NULL,
  phone        TEXT    UNIQUE,
  email        TEXT,
  address      TEXT,
  points       INTEGER NOT NULL DEFAULT 0,
  tier         TEXT    NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_spent  INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS customers_phone_idx   ON customers(phone);
CREATE INDEX IF NOT EXISTS customers_name_idx   ON customers(name);
