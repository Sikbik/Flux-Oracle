import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { runTaxExport, taxUsageText } from '../src/tax.js';

const tempPaths: string[] = [];

afterEach(() => {
  while (tempPaths.length > 0) {
    const value = tempPaths.pop();
    if (value) {
      rmSync(value, { recursive: true, force: true });
    }
  }
});

describe('tax export command', () => {
  it('joins tx timestamps with price_at and writes CSV tax packs', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-tax-'));
    tempPaths.push(tempDir);

    const inputPath = path.join(tempDir, 'txs.json');
    const outputDir = path.join(tempDir, 'csv');

    writeFileSync(
      inputPath,
      JSON.stringify(
        [
          {
            txid: 'tx-income-1',
            timestamp: 1707346812,
            direction: 'in',
            amount: '2.00000000',
            asset: 'FLUX',
            note: 'mining'
          },
          {
            txid: 'tx-disposal-1',
            timestamp: 1707346899,
            direction: 'out',
            amount: '3.00000000',
            asset: 'FLUX',
            note: 'payment'
          }
        ],
        null,
        2
      )
    );

    const fetchImpl = buildPriceAtFetch({
      1707346812: {
        minute_ts: 1707346800,
        reference_price_fp: '150000000',
        degraded: false,
        degraded_reason: null
      },
      1707346899: {
        minute_ts: 1707346860,
        reference_price_fp: '200000000',
        degraded: false,
        degraded_reason: null
      }
    });

    const result = await runTaxExport(
      {
        baseUrl: 'http://localhost:3000',
        pair: 'FLUXUSD',
        inputPath,
        outputDir
      },
      {
        fetchImpl
      }
    );

    expect(result).toMatchObject({
      total: 2,
      incomeCount: 1,
      disposalCount: 1
    });

    const fullLedger = readFileSync(result.fullLedgerPath, 'utf8');
    expect(fullLedger).toContain(
      'tx-income-1,1707346812,1707346800,in,FLUX,2.00000000,1.50000000,3.00000000'
    );
    expect(fullLedger).toContain(
      'tx-disposal-1,1707346899,1707346860,out,FLUX,3.00000000,2.00000000,6.00000000'
    );

    const incomeCsv = readFileSync(result.incomePath, 'utf8');
    expect(incomeCsv).toContain('tx-income-1');
    expect(incomeCsv).not.toContain('tx-disposal-1');

    const disposalsCsv = readFileSync(result.disposalsPath, 'utf8');
    expect(disposalsCsv).toContain('tx-disposal-1');
    expect(disposalsCsv).not.toContain('tx-income-1');
  });

  it('exposes tax command usage text', () => {
    const usage = taxUsageText();
    expect(usage).toContain('Usage: fpho-tax-export');
    expect(usage).toContain('--out-dir');
  });
});

function buildPriceAtFetch(
  byTimestamp: Record<
    number,
    {
      minute_ts: number;
      reference_price_fp: string | null;
      degraded: boolean;
      degraded_reason: string | null;
    }
  >
): typeof fetch {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input.toString());
    if (url.pathname !== '/v1/price_at') {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
    }

    const tsParam = url.searchParams.get('ts');
    const timestamp = tsParam ? Number(tsParam) : NaN;
    const fixture = Number.isNaN(timestamp) ? undefined : byTimestamp[timestamp];

    if (!fixture) {
      return new Response(JSON.stringify({ error: 'missing_fixture' }), { status: 404 });
    }

    return new Response(
      JSON.stringify({
        pair: 'FLUXUSD',
        ts: timestamp,
        ...fixture
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }
    );
  };
}
