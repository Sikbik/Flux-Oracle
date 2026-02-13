import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/index.js';

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

describe('database migrations', () => {
  it('applies schema migration and supports minimal read/write', () => {
    const baseDir = mkdtempSync(path.join(tmpdir(), 'fpho-db-'));
    tempPaths.push(baseDir);

    const dbPath = path.join(baseDir, 'test.sqlite');
    const applied = runMigrations({ dbPath, migrationsDir: migrationDir });

    expect(applied).toContain('0001_phase02_schema.sql');

    const db = new Database(dbPath);
    try {
      const tableRows = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as Array<{ name: string }>;

      const tables = tableRows.map((row) => row.name);
      expect(tables).toEqual(
        expect.arrayContaining([
          'anchors',
          'hour_reports',
          'minute_prices',
          'raw_ticks',
          'reporter_sets',
          'schema_migrations',
          'venue_minute_prices'
        ])
      );

      db.prepare(
        'INSERT INTO raw_ticks(pair, venue, ts, price_fp, size_fp, side) VALUES (?, ?, ?, ?, ?, ?)'
      ).run('FLUXUSD', 'binance', 1707350467, '62895000', '120000000', 'buy');

      const countResult = db
        .prepare('SELECT COUNT(*) AS count FROM raw_ticks WHERE pair = ?')
        .get('FLUXUSD') as { count: number };

      expect(countResult.count).toBe(1);
    } finally {
      db.close();
    }
  });
});
