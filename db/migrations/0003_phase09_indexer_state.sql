CREATE TABLE IF NOT EXISTS indexer_state (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  last_height INTEGER NOT NULL DEFAULT 0,
  last_block_hash TEXT
);

INSERT OR IGNORE INTO indexer_state(id, last_height, last_block_hash)
VALUES (1, 0, NULL);
