import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { encodeOpReturnPayload, hashHourlyReport, type HourlyReport } from '@fpho/core';
import {
  buildSignatureBitmap,
  computeReporterSetId,
  derivePublicKey,
  signMessage,
  type ReporterRegistry
} from '@fpho/p2p';

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
  it('serves the live dashboard UI', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('Flux Oracle');

    await app.close();
  });

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

  it('returns per-venue minute price breakdown', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/minute/FLUXUSD/1707350460/venues'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      minute_ts: 1707350460,
      venues: [
        expect.objectContaining({ venue: 'binance', price_fp: '62900000', tick_count: 4 }),
        expect.objectContaining({ venue: 'gate', price_fp: '62920000', tick_count: 3 })
      ],
      missing_venues: expect.arrayContaining(['kraken'])
    });

    await app.close();
  });

  it('returns anchored hour summaries in stable order', async () => {
    const { app, reportHash } = await createTestApp();

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
          report_hash: reportHash,
          anchored: true,
          anchor_txid: 'txid-123'
        }
      ]
    });

    await app.close();
  });

  it('returns anchors endpoint rows with payload fixture', async () => {
    const { app, reportHash } = await createTestApp();

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
          report_hash: reportHash,
          confirmed: true
        }
      ]
    });

    await app.close();
  });

  it('returns full report payload by pair/hour', async () => {
    const { app, reportHash, reporterSetId } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/report/FLUXUSD/1707346800'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      hour_ts: 1707346800,
      report: {
        pair: 'FLUXUSD',
        hour_ts: '1707346800',
        close_fp: '62750000',
        minute_root: 'd'.repeat(64),
        available_minutes: '60',
        degraded: false
      },
      report_hash: reportHash,
      reporter_set_id: reporterSetId,
      signatures: expect.any(Object),
      anchor: {
        txid: 'txid-123',
        report_hash: reportHash,
        confirmed: true
      }
    });

    await app.close();
  });

  it('verifies anchored report fixtures', async () => {
    const { app, reportHash, reporterSetId } = await createTestApp();

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
        report_hash_valid: true,
        op_return_present: true,
        op_return_decoded: true,
        op_return_pair_match: true,
        op_return_hour_match: true,
        op_return_close_match: true,
        op_return_report_hash_match: true,
        op_return_sig_bitmap_match: true,
        quorum_valid: true,
        minute_root_match: true
      },
      report_hash: reportHash,
      reporter_set_id: reporterSetId,
      anchor: {
        txid: 'txid-123',
        confirmed: true
      }
    });

    await app.close();
  });

  it('returns FMV and audit citation guidance in methodology endpoint', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/methodology'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      pair: 'FLUXUSD',
      fmvRuleStatement: expect.stringContaining('FMV'),
      auditCitationSteps: expect.any(Array)
    });

    await app.close();
  });
});

const privateKeys = {
  'reporter-1': '6c17f725f4fcd6d7b2f3a5a8b4ef7d1f2e5a2260bc257f8fef4d4d357ca8f35e',
  'reporter-2': '7f2ea4ecf89758de6f4e6b932f85f88f84f2135ad7ef8bde0f4e5f5f38e30a0d',
  'reporter-3': '4f9858cb6f8da9fd4aa9c45f2e8d9932d18c1df2ad7d6851124c596cb8f1795e'
};

async function createTestApp(): Promise<{
  app: ReturnType<typeof createApiServer>;
  reportHash: string;
  reporterSetId: string;
}> {
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

  const registry = await buildRegistry();
  const reporterSetId = computeReporterSetId(registry);
  const reportPayload: HourlyReport = {
    pair: 'FLUXUSD',
    hour_ts: '1707346800',
    open_fp: '62800000',
    high_fp: '62900000',
    low_fp: '62750000',
    close_fp: '62750000',
    minute_root: 'd'.repeat(64),
    ruleset_version: 'v1',
    available_minutes: '60',
    degraded: false
  };
  const reportHash = hashHourlyReport(reportPayload);
  const signatures = {
    'reporter-1': await signMessage(`fpho:1707346800:${reportHash}`, privateKeys['reporter-1']),
    'reporter-2': await signMessage(`fpho:1707346800:${reportHash}`, privateKeys['reporter-2'])
  };
  const sigBitmap = buildSignatureBitmap(registry, signatures);
  const opReturnHex = Buffer.from(
    encodeOpReturnPayload({
      pairId: 1,
      hourTs: 1707346800,
      closeFp: '62750000',
      reportHash,
      sigBitmap
    })
  ).toString('hex');

  const seedSql = `
    INSERT INTO minute_prices(pair, minute_ts, reference_price_fp, venues_used, degraded, degraded_reason)
    VALUES
      ('FLUXUSD', 1707350460, '62900000', 2, 0, NULL),
      ('FLUXUSD', 1707350520, NULL, 1, 1, 'insufficient_venues'),
      ('FLUXUSD', 1707350580, '62880000', 3, 0, NULL);

    INSERT INTO venue_minute_prices(pair, venue, minute_ts, price_fp, tick_count, source, updated_at)
    VALUES
      ('FLUXUSD', 'binance', 1707350460, '62900000', 4, 'ws', unixepoch()),
      ('FLUXUSD', 'gate', 1707350460, '62920000', 3, 'ws', unixepoch());

    INSERT INTO reporter_sets(reporter_set_id, reporters_json, threshold, created_at)
    VALUES (
      '${reporterSetId}',
      '${JSON.stringify(registry)}',
      ${registry.threshold},
      unixepoch()
    );

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
      available_minutes,
      degraded,
      reporter_set_id,
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
      '${reportHash}',
      'v1',
      60,
      0,
      '${reporterSetId}',
      '${JSON.stringify(signatures)}',
      unixepoch()
    );

    INSERT INTO anchors(
      txid,
      pair,
      hour_ts,
      report_hash,
      reporter_set_id,
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
      '${reportHash}',
      '${reporterSetId}',
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
    app: seededApp,
    reportHash,
    reporterSetId
  };
}

async function buildRegistry(): Promise<ReporterRegistry> {
  return {
    version: 'v1',
    threshold: 2,
    reporters: [
      {
        id: 'reporter-1',
        publicKey: await derivePublicKey(privateKeys['reporter-1'])
      },
      {
        id: 'reporter-2',
        publicKey: await derivePublicKey(privateKeys['reporter-2'])
      },
      {
        id: 'reporter-3',
        publicKey: await derivePublicKey(privateKeys['reporter-3'])
      }
    ]
  };
}
