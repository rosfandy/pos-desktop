-- Add columns for shift close calculation
ALTER TABLE shifts ADD COLUMN expected_cash INTEGER;
ALTER TABLE shifts ADD COLUMN total_cash_sales INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shifts ADD COLUMN total_non_cash_sales INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shifts ADD COLUMN discrepancy INTEGER;
ALTER TABLE shifts ADD COLUMN notes TEXT;
