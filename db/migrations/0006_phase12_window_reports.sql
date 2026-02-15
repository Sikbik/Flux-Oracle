CREATE TABLE IF NOT EXISTS window_reports (
  pair TEXT NOT NULL,
  window_seconds INTEGER NOT NULL,
  window_ts INTEGER NOT NULL,
  open_fp TEXT,
  high_fp TEXT,
  low_fp TEXT,
  close_fp TEXT,
  minute_root TEXT NOT NULL,
  report_hash TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  available_minutes INTEGER NOT NULL DEFAULT 0,
  degraded INTEGER NOT NULL DEFAULT 0,
  signatures_json TEXT,
  reporter_set_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (pair, window_seconds, window_ts),
  UNIQUE (report_hash)
);

CREATE TABLE IF NOT EXISTS window_anchors (
  txid TEXT PRIMARY KEY,
  pair TEXT NOT NULL,
  window_seconds INTEGER NOT NULL,
  window_ts INTEGER NOT NULL,
  report_hash TEXT NOT NULL,
  reporter_set_id TEXT,
  block_height INTEGER,
  block_hash TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0,
  ipfs_cid TEXT,
  ipfs_mirror_url TEXT,
  op_return_hex TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (pair, window_seconds, window_ts)
);

CREATE INDEX IF NOT EXISTS idx_window_reports_pair_window ON window_reports(pair, window_seconds, window_ts);
CREATE INDEX IF NOT EXISTS idx_window_anchors_pair_window ON window_anchors(pair, window_seconds, window_ts);
