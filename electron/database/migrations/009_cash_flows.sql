-- Cash Flows: mencatat pemasukan/pengeluaran kas selama shift

CREATE TABLE IF NOT EXISTS cash_flows (
  id TEXT PRIMARY KEY,
  shift_id TEXT NOT NULL REFERENCES shifts(id),
  type TEXT NOT NULL CHECK(type IN ('in', 'out')),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cash_flows_shift ON cash_flows(shift_id);
CREATE INDEX IF NOT EXISTS idx_cash_flows_created ON cash_flows(created_at);
