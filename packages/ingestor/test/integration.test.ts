import Database from 'better-sqlite3';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { runMigrations } from '@fpho/api';
import type { NormalizedTick, VenueAdapter } from '@fpho/venues';

import { IngestorService } from '../src/service.js';

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

describe('ingestor integration', () => {
  it('writes emitted adapter ticks into raw_ticks and exposes health stats', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-ingestor-'));
    tempPaths.push(tempDir);

    const dbPath = path.join(tempDir, 'ingestor.sqlite');
    runMigrations({ dbPath, migrationsDir: migrationDir });

    const adapter = new MockAdapter();

    const service = new IngestorService(
      {
        dbPath,
        pair: 'FLUXUSD',
        enabledVenues: ['mock'],
        batchSize: 2,
        flushIntervalMs: 10_000,
        healthPort: 0
      },
      {
        adapters: [adapter]
      }
    );

    await service.start();

    adapter.emit('tick', {
      ts: 1707350467,
      venue: 'mock',
      pair: 'FLUXUSD',
      price: '62890000',
      size: '100000000',
      side: 'buy'
    } satisfies NormalizedTick);

    adapter.emit('tick', {
      ts: 1707350468,
      venue: 'mock',
      pair: 'FLUXUSD',
      price: '62891000',
      size: '110000000',
      side: 'sell'
    } satisfies NormalizedTick);

    adapter.emit('disconnect');
    adapter.emit('reconnect');

    const db = new Database(dbPath, { readonly: true });
    try {
      const rows = db
        .prepare('SELECT pair, venue, ts, price_fp, side FROM raw_ticks ORDER BY ts ASC')
        .all() as Array<{
        pair: string;
        venue: string;
        ts: number;
        price_fp: string;
        side: string;
      }>;

      expect(rows).toEqual([
        {
          pair: 'FLUXUSD',
          venue: 'mock',
          ts: 1707350467,
          price_fp: '62890000',
          side: 'buy'
        },
        {
          pair: 'FLUXUSD',
          venue: 'mock',
          ts: 1707350468,
          price_fp: '62891000',
          side: 'sell'
        }
      ]);
    } finally {
      db.close();
    }

    const port = service.getHealthPort();
    expect(port).not.toBeNull();

    const response = await fetch(`http://127.0.0.1:${port}/healthz`);
    const payload = (await response.json()) as {
      ok: boolean;
      stats: {
        venueStats: Record<string, { disconnectCount: number; reconnectCount: number }>;
      };
    };

    expect(payload.ok).toBe(true);
    expect(payload.stats.venueStats.mock.disconnectCount).toBe(1);
    expect(payload.stats.venueStats.mock.reconnectCount).toBe(1);

    await service.stop();
  });
});

class MockAdapter extends EventEmitter implements VenueAdapter {
  readonly venueId = 'mock';

  readonly symbolMap = {
    FLUXUSD: 'MOCK_FLUX_USD'
  };

  async connect(): Promise<void> {
    // no-op
  }

  async disconnect(): Promise<void> {
    // no-op
  }

  async subscribe(pair: string): Promise<void> {
    void pair;
  }
}
