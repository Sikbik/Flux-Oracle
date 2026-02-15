CREATE TABLE IF NOT EXISTS anchor_utxo_state (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  txid TEXT,
  vout INTEGER,
  amount TEXT,
  address TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT OR IGNORE INTO anchor_utxo_state(id)
VALUES (1);

