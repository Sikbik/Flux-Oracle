import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import Database from 'better-sqlite3';
import { decodeOpReturnPayload } from '@fpho/core';
import { runMigrations } from '@fpho/api';

import { anchorHourReport, buildSignatureBitmap } from '../src/index.js';
import type { FluxRpcTransport } from '../src/index.js';

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

describe('anchor service', () => {
  it('publishes report metadata and stores anchored tx details', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-anchor-'));
    tempPaths.push(tempDir);

    const dbPath = path.join(tempDir, 'anchor.sqlite');
    runMigrations({ dbPath, migrationsDir: migrationDir });

    seedHourReport(dbPath);

    const rpcCalls: Array<{ method: string; params?: unknown[] }> = [];
    const rpcTransport: FluxRpcTransport = {
      async call(method: string, params?: unknown[]) {
        rpcCalls.push({ method, params: params as unknown[] | undefined });

        if (method === 'createrawtransaction') {
          return 'raw-tx' as unknown;
        }
        if (method === 'fundrawtransaction') {
          return { hex: 'funded-tx' } as unknown;
        }
        if (method === 'signrawtransactionwithwallet') {
          return { hex: 'signed-tx', complete: true } as unknown;
        }
        if (method === 'sendrawtransaction') {
          return 'txid-123' as unknown;
        }

        throw new Error(`unexpected rpc method: ${method}`);
      }
    };

    const ipfsPayloads: unknown[] = [];
    const result = await anchorHourReport({
      dbPath,
      pair: 'FLUXUSD',
      hourTs: 1707346800,
      fluxRpc: rpcTransport,
      ipfsPublisher: {
        async addJson(payload: unknown) {
          ipfsPayloads.push(payload);
          return { cid: 'bafytestcid' };
        }
      },
      ipfsGatewayBaseUrl: 'https://gateway.example/ipfs',
      pairIdMap: { FLUXUSD: 7 }
    });

    expect(result.txid).toBe('txid-123');
    expect(result.ipfsCid).toBe('bafytestcid');
    expect(result.ipfsMirrorUrl).toBe('https://gateway.example/ipfs/bafytestcid');
    expect(rpcCalls.map((entry) => entry.method)).toEqual([
      'createrawtransaction',
      'fundrawtransaction',
      'signrawtransactionwithwallet',
      'sendrawtransaction'
    ]);

    const decodedPayload = decodeOpReturnPayload(Buffer.from(result.opReturnHex, 'hex'));
    expect(decodedPayload).toMatchObject({
      pairId: 7,
      hourTs: 1707346800,
      closeFp: '62750000',
      reportHash: 'a'.repeat(64),
      sigBitmap: 7
    });

    expect(ipfsPayloads).toHaveLength(1);

    const db = new Database(dbPath, { readonly: true });
    try {
      const row = db
        .prepare(
          `
            SELECT txid, report_hash, ipfs_cid, ipfs_mirror_url, op_return_hex, confirmed
            FROM anchors
            WHERE pair = ?
              AND hour_ts = ?
          `
        )
        .get('FLUXUSD', 1707346800) as
        | {
            txid: string;
            report_hash: string;
            ipfs_cid: string | null;
            ipfs_mirror_url: string | null;
            op_return_hex: string | null;
            confirmed: number;
          }
        | undefined;

      expect(row).toMatchObject({
        txid: 'txid-123',
        report_hash: 'a'.repeat(64),
        ipfs_cid: 'bafytestcid',
        ipfs_mirror_url: 'https://gateway.example/ipfs/bafytestcid',
        op_return_hex: result.opReturnHex,
        confirmed: 0
      });
    } finally {
      db.close();
    }
  });

  it('builds deterministic signature bitmaps from signature sets', () => {
    const bitmap = buildSignatureBitmap(
      JSON.stringify({
        'reporter-c': 'sig-c',
        'reporter-a': 'sig-a',
        'reporter-b': 'sig-b'
      })
    );

    expect(bitmap).toBe(7);
    expect(buildSignatureBitmap(null)).toBe(0);
  });
});

function seedHourReport(dbPath: string): void {
  const db = new Database(dbPath);
  try {
    db.prepare(
      `
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
      `
    ).run(
      'FLUXUSD',
      1707346800,
      '62800000',
      '62900000',
      '62750000',
      '62750000',
      'd'.repeat(64),
      'a'.repeat(64),
      'v1',
      JSON.stringify({
        'reporter-a': 'sig-a',
        'reporter-b': 'sig-b',
        'reporter-c': 'sig-c'
      })
    );
  } finally {
    db.close();
  }
}
