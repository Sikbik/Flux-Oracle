import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { runMigrations } from '@fpho/api';

import { MinuteFinalizer } from '../src/index.js';

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

describe('minute finalizer integration', () => {
  it('materializes venue_minute_prices and minute_prices from raw ticks', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-agg-'));
    tempPaths.push(tempDir);

    const dbPath = path.join(tempDir, 'agg.sqlite');
    runMigrations({ dbPath, migrationsDir: migrationDir });

    const db = new Database(dbPath);
    db.prepare(
      `
        INSERT INTO raw_ticks(pair, venue, ts, price_fp, size_fp, side, source)
        VALUES
          ('FLUXUSD', 'binance', 1707350467, '62890000', '10', 'buy', 'ws'),
          ('FLUXUSD', 'binance', 1707350479, '62910000', '11', 'buy', 'ws'),
          ('FLUXUSD', 'kraken', 1707350469, '62870000', '9', 'sell', 'ws'),
          ('FLUXUSD', 'kraken', 1707350499, '62890000', '12', 'buy', 'ws')
      `
    ).run();
    db.close();

    const finalizer = new MinuteFinalizer({
      dbPath,
      pair: 'FLUXUSD',
      venues: ['binance', 'kraken', 'mexc'],
      graceSeconds: 0,
      minVenuesPerMinute: 2,
      outlierClipPct: 10
    });

    const result = finalizer.finalizeMinute(1707350460, 1707350521);
    finalizer.close();

    expect(result.finalized).toBe(true);
    expect(result.perVenueCount).toBe(2);
    expect(result.aggregated.referencePriceFp).toBe('62900000');
    expect(result.aggregated.degraded).toBe(false);

    const verifyDb = new Database(dbPath, { readonly: true });
    try {
      const venueRows = verifyDb
        .prepare(
          'SELECT venue, price_fp, tick_count FROM venue_minute_prices WHERE pair = ? AND minute_ts = ? ORDER BY venue'
        )
        .all('FLUXUSD', 1707350460) as Array<{
        venue: string;
        price_fp: string;
        tick_count: number;
      }>;

      expect(venueRows).toEqual([
        { venue: 'binance', price_fp: '62910000', tick_count: 2 },
        { venue: 'kraken', price_fp: '62890000', tick_count: 2 }
      ]);

      const minuteRow = verifyDb
        .prepare(
          'SELECT reference_price_fp, venues_used, degraded, degraded_reason FROM minute_prices WHERE pair = ? AND minute_ts = ?'
        )
        .get('FLUXUSD', 1707350460) as {
        reference_price_fp: string | null;
        venues_used: number;
        degraded: number;
        degraded_reason: string | null;
      };

      expect(minuteRow).toEqual({
        reference_price_fp: '62900000',
        venues_used: 2,
        degraded: 0,
        degraded_reason: null
      });
    } finally {
      verifyDb.close();
    }
  });

  it('snaps non-aligned minute timestamps to minute boundaries', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-agg-'));
    tempPaths.push(tempDir);

    const dbPath = path.join(tempDir, 'agg.sqlite');
    runMigrations({ dbPath, migrationsDir: migrationDir });

    const db = new Database(dbPath);
    db.prepare(
      `
        INSERT INTO raw_ticks(pair, venue, ts, price_fp, size_fp, side, source)
        VALUES
          ('FLUXUSD', 'binance', 1707350467, '62890000', '10', 'buy', 'ws'),
          ('FLUXUSD', 'kraken', 1707350469, '62870000', '9', 'sell', 'ws')
      `
    ).run();
    db.close();

    const finalizer = new MinuteFinalizer({
      dbPath,
      pair: 'FLUXUSD',
      venues: ['binance', 'kraken'],
      graceSeconds: 0,
      minVenuesPerMinute: 2,
      outlierClipPct: 10
    });

    const result = finalizer.finalizeMinute(1707350467, 1707350521);
    finalizer.close();

    expect(result.minuteTs).toBe(1707350460);

    const verifyDb = new Database(dbPath, { readonly: true });
    try {
      const minuteRow = verifyDb
        .prepare(
          'SELECT minute_ts FROM minute_prices WHERE pair = ? ORDER BY minute_ts LIMIT 1'
        )
        .get('FLUXUSD') as { minute_ts: number };

      expect(minuteRow.minute_ts).toBe(1707350460);
    } finally {
      verifyDb.close();
    }
  });
});
