CREATE TABLE IF NOT EXISTS raw_ticks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair TEXT NOT NULL,
  venue TEXT NOT NULL,
  ts INTEGER NOT NULL,
  price_fp TEXT NOT NULL,
  size_fp TEXT,
  side TEXT,
  source TEXT NOT NULL DEFAULT 'ws',
  inserted_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS venue_minute_prices (
  pair TEXT NOT NULL,
  venue TEXT NOT NULL,
  minute_ts INTEGER NOT NULL,
  price_fp TEXT NOT NULL,
  tick_count INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'ws',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (pair, venue, minute_ts)
);

CREATE TABLE IF NOT EXISTS minute_prices (
  pair TEXT NOT NULL,
  minute_ts INTEGER NOT NULL,
  reference_price_fp TEXT,
  venues_used INTEGER NOT NULL DEFAULT 0,
  degraded INTEGER NOT NULL DEFAULT 0,
  degraded_reason TEXT,
  venue_snapshot_json TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (pair, minute_ts)
);

CREATE TABLE IF NOT EXISTS hour_reports (
  pair TEXT NOT NULL,
  hour_ts INTEGER NOT NULL,
  open_fp TEXT,
  high_fp TEXT,
  low_fp TEXT,
  close_fp TEXT,
  minute_root TEXT NOT NULL,
  report_hash TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  signatures_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (pair, hour_ts),
  UNIQUE (report_hash)
);

CREATE TABLE IF NOT EXISTS anchors (
  txid TEXT PRIMARY KEY,
  pair TEXT NOT NULL,
  hour_ts INTEGER NOT NULL,
  report_hash TEXT NOT NULL,
  block_height INTEGER,
  block_hash TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (pair, hour_ts)
);

CREATE TABLE IF NOT EXISTS reporter_sets (
  reporter_set_id TEXT PRIMARY KEY,
  reporters_json TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_raw_ticks_pair_venue_ts ON raw_ticks(pair, venue, ts);
CREATE INDEX IF NOT EXISTS idx_venue_minute_prices_pair_minute_ts ON venue_minute_prices(pair, minute_ts);
CREATE INDEX IF NOT EXISTS idx_minute_prices_pair_minute_ts ON minute_prices(pair, minute_ts);
CREATE INDEX IF NOT EXISTS idx_anchors_pair_hour_ts ON anchors(pair, hour_ts);
