import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { createApiServer, runMigrations } from '../src/index.js';

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

describe('api endpoints', () => {
  it('returns price_at for the correct minute bucket', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/price_at?pair=FLUXUSD&ts=1707350467'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      ts: 1707350467,
      minute_ts: 1707350460,
      reference_price_fp: '62900000',
      degraded: false
    });

    await app.close();
  });

  it('returns degraded fields when minute data is degraded', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/price_at?pair=FLUXUSD&ts=1707350525'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      minute_ts: 1707350520,
      reference_price_fp: null,
      degraded: true,
      degraded_reason: 'insufficient_venues'
    });

    await app.close();
  });

  it('returns stable ordering and pagination for minutes range', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/minutes?pair=FLUXUSD&start=1707350460&end=1707350580&limit=2&offset=1'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      limit: 2,
      offset: 1,
      items: [
        {
          minute_ts: 1707350520,
          reference_price_fp: null,
          degraded: true
        },
        {
          minute_ts: 1707350580,
          reference_price_fp: '62880000',
          degraded: false
        }
      ]
    });

    await app.close();
  });
});

async function createTestApp(): Promise<{ app: ReturnType<typeof createApiServer> }> {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-api-'));
  tempPaths.push(tempDir);

  const dbPath = path.join(tempDir, 'api.sqlite');
  runMigrations({ dbPath, migrationsDir: migrationDir });

  const app = createApiServer({ dbPath });

  await app.ready();

  await app.inject({
    method: 'GET',
    url: '/healthz'
  });

  const seedSql = `
    INSERT INTO minute_prices(pair, minute_ts, reference_price_fp, venues_used, degraded, degraded_reason)
    VALUES
      ('FLUXUSD', 1707350460, '62900000', 2, 0, NULL),
      ('FLUXUSD', 1707350520, NULL, 1, 1, 'insufficient_venues'),
      ('FLUXUSD', 1707350580, '62880000', 3, 0, NULL)
  `;

  await app.close();

  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath);
  db.exec(seedSql);
  db.close();

  const seededApp = createApiServer({ dbPath });
  await seededApp.ready();

  return {
    app: seededApp
  };
}
