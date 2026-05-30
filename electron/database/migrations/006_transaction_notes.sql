-- Migration: 006_transaction_notes
-- Adds: notes column to transactions table for hold bill descriptions

ALTER TABLE transactions ADD COLUMN notes TEXT;
