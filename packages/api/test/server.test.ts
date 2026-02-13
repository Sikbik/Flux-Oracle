import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { encodeOpReturnPayload } from '@fpho/core';

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

  it('returns anchored hour summaries in stable order', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/hours?pair=FLUXUSD&start=1707346800&end=1707346800&limit=10&offset=0'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      items: [
        {
          hour_ts: 1707346800,
          report_hash: 'a'.repeat(64),
          anchored: true,
          anchor_txid: 'txid-123'
        }
      ]
    });

    await app.close();
  });

  it('returns anchors endpoint rows with payload fixture', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/anchors?pair=FLUXUSD&start_hour=1707346800&end_hour=1707346800'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      items: [
        {
          txid: 'txid-123',
          hour_ts: 1707346800,
          report_hash: 'a'.repeat(64),
          confirmed: true
        }
      ]
    });

    await app.close();
  });

  it('returns full report payload by pair/hour', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/report/FLUXUSD/1707346800'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      hour_ts: 1707346800,
      report: {
        close_fp: '62750000',
        report_hash: 'a'.repeat(64),
        signatures: {
          'reporter-a': 'sig-a',
          'reporter-b': 'sig-b',
          'reporter-c': 'sig-c'
        }
      },
      anchor: {
        txid: 'txid-123',
        report_hash: 'a'.repeat(64),
        confirmed: true
      }
    });

    await app.close();
  });

  it('verifies anchored report fixtures', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/verify/FLUXUSD/1707346800'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      hour_ts: 1707346800,
      verified: true,
      checks: {
        report_hash_match: true,
        op_return_present: true,
        op_return_decoded: true,
        op_return_pair_match: true,
        op_return_hour_match: true,
        op_return_close_match: true,
        op_return_report_hash_match: true,
        op_return_sig_bitmap_match: true
      },
      anchor: {
        txid: 'txid-123',
        confirmed: true
      }
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

  const opReturnHex = Buffer.from(
    encodeOpReturnPayload({
      pairId: 1,
      hourTs: 1707346800,
      closeFp: '62750000',
      reportHash: 'a'.repeat(64),
      sigBitmap: 7
    })
  ).toString('hex');

  const seedSql = `
    INSERT INTO minute_prices(pair, minute_ts, reference_price_fp, venues_used, degraded, degraded_reason)
    VALUES
      ('FLUXUSD', 1707350460, '62900000', 2, 0, NULL),
      ('FLUXUSD', 1707350520, NULL, 1, 1, 'insufficient_venues'),
      ('FLUXUSD', 1707350580, '62880000', 3, 0, NULL);

    INSERT INTO hour_reports(
      pair,
      hour_ts,
      open_fp,
      high_fp,
      low_fp,
      close_fp,
      minute_root,
      report_hash,
      ruleset_version,
      signatures_json,
      created_at
    ) VALUES (
      'FLUXUSD',
      1707346800,
      '62800000',
      '62900000',
      '62750000',
      '62750000',
      '${'d'.repeat(64)}',
      '${'a'.repeat(64)}',
      'v1',
      '${JSON.stringify({
        'reporter-a': 'sig-a',
        'reporter-b': 'sig-b',
        'reporter-c': 'sig-c'
      })}',
      unixepoch()
    );

    INSERT INTO anchors(
      txid,
      pair,
      hour_ts,
      report_hash,
      block_height,
      block_hash,
      confirmed,
      ipfs_cid,
      ipfs_mirror_url,
      op_return_hex,
      created_at
    ) VALUES (
      'txid-123',
      'FLUXUSD',
      1707346800,
      '${'a'.repeat(64)}',
      123456,
      'block-hash-1',
      1,
      'bafytestcid',
      'https://gateway.example/ipfs/bafytestcid',
      '${opReturnHex}',
      unixepoch()
    );
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
