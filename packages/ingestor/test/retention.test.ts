import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { runMigrations } from '@fpho/api';

import { RawTickWriter } from '../src/dbWriter.js';

const migrationDir = fileURLToPath(new URL('../../../db/migrations', import.meta.url));

const tempPaths: string[] = [];

afterEach(() => {
  while (tempPaths.length > 0) {
    const value = tempPaths.pop();
    if (value) {
      rmSync(value, { recursive: true, force: true });
    }
  }
});

describe('raw tick retention', () => {
  it('prunes raw_ticks older than a cutoff timestamp', () => {
    const baseDir = mkdtempSync(path.join(tmpdir(), 'fpho-retention-'));
    tempPaths.push(baseDir);

    const dbPath = path.join(baseDir, 'test.sqlite');
    runMigrations({ dbPath, migrationsDir: migrationDir });

    const db = new Database(dbPath);
    try {
      db.prepare(
        `
          INSERT INTO raw_ticks(pair, venue, ts, price_fp, size_fp, side, source)
          VALUES (?, ?, ?, ?, NULL, NULL, 'ws')
        `
      ).run('FLUXUSD', 'binance', 100, '10000000');
      db.prepare(
        `
          INSERT INTO raw_ticks(pair, venue, ts, price_fp, size_fp, side, source)
          VALUES (?, ?, ?, ?, NULL, NULL, 'ws')
        `
      ).run('FLUXUSD', 'kraken', 200, '20000000');
      db.prepare(
        `
          INSERT INTO raw_ticks(pair, venue, ts, price_fp, size_fp, side, source)
          VALUES (?, ?, ?, ?, NULL, NULL, 'ws')
        `
      ).run('FLUXUSD', 'gate', 300, '30000000');
    } finally {
      db.close();
    }

    const writer = new RawTickWriter(dbPath);
    try {
      const pruned = writer.pruneTicksBefore('FLUXUSD', 250);
      expect(pruned).toBe(2);
    } finally {
      writer.close();
    }

    const verifyDb = new Database(dbPath, { readonly: true });
    try {
      const remaining = verifyDb
        .prepare('SELECT ts FROM raw_ticks WHERE pair = ? ORDER BY ts ASC')
        .all('FLUXUSD') as Array<{ ts: number }>;
      expect(remaining).toEqual([{ ts: 300 }]);
    } finally {
      verifyDb.close();
    }
  });
});

