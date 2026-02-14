import { describe, expect, it } from 'vitest';

import {
  buildMerkleRoot,
  encodeOpReturnPayload,
  hashHourlyReport,
  hashMinuteRecord,
  minuteRange,
  type HourlyReport,
  type MinuteRecord
} from '@fpho/core';
import {
  buildSignatureBitmap,
  computeReporterSetId,
  derivePublicKey,
  signMessage,
  type ReporterRegistry
} from '@fpho/p2p';

import { runVerifyCommand, usageText } from '../src/index.js';

const privateKeys = {
  'reporter-1': '6c17f725f4fcd6d7b2f3a5a8b4ef7d1f2e5a2260bc257f8fef4d4d357ca8f35e',
  'reporter-2': '7f2ea4ecf89758de6f4e6b932f85f88f84f2135ad7ef8bde0f4e5f5f38e30a0d',
  'reporter-3': '4f9858cb6f8da9fd4aa9c45f2e8d9932d18c1df2ad7d6851124c596cb8f1795e'
};

describe('fpho-verify command', () => {
  it('validates anchor/report/signatures and optional minute root', async () => {
    const hourTs = 1707346800;
    const pair = 'FLUXUSD';
    const closeFp = '62750000';

    const minutes = buildMinuteItems(hourTs, closeFp);
    const minuteRoot = computeMinuteRoot(pair, hourTs, minutes);
    const report: HourlyReport = {
      pair,
      hour_ts: hourTs.toString(),
      open_fp: closeFp,
      high_fp: closeFp,
      low_fp: closeFp,
      close_fp: closeFp,
      minute_root: minuteRoot,
      ruleset_version: 'v1',
      available_minutes: '60',
      degraded: false
    };
    const reportHash = hashHourlyReport(report);
    const registry = await buildRegistry();
    const signatures = {
      'reporter-1': await signMessage(`fpho:${hourTs}:${reportHash}`, privateKeys['reporter-1']),
      'reporter-2': await signMessage(`fpho:${hourTs}:${reportHash}`, privateKeys['reporter-2'])
    };
    const sigBitmap = buildSignatureBitmap(registry, signatures);
    const reporterSetId = computeReporterSetId(registry);
    const opReturnHex = Buffer.from(
      encodeOpReturnPayload({
        pairId: 1,
        hourTs,
        closeFp,
        reportHash,
        sigBitmap
      })
    ).toString('hex');

    const fetchImpl = buildFixtureFetch({
      anchorsPayload: {
        items: [
          {
            txid: 'txid-1',
            report_hash: reportHash,
            op_return_hex: opReturnHex
          }
        ]
      },
      reportPayload: {
        report,
        report_hash: reportHash,
        signatures,
        reporter_set_id: reporterSetId
      },
      minutesPayload: { items: minutes }
    });

    const result = await runVerifyCommand(
      {
        baseUrl: 'http://localhost:3000',
        pair,
        hourTs,
        registry,
        checkMinuteRoot: true
      },
      {
        fetchImpl
      }
    );

    expect(result.ok).toBe(true);
    expect(result.validSigners).toEqual(['reporter-1', 'reporter-2']);
    expect(result.checks).toMatchObject({
      anchor_found: true,
      report_hash_match: true,
      report_hash_valid: true,
      reporter_set_match: true,
      op_return_match: true,
      quorum_valid: true,
      minute_root_match: true
    });
  });

  it('fails verification when quorum signatures are insufficient', async () => {
    const hourTs = 1707346800;
    const pair = 'FLUXUSD';
    const closeFp = '62750000';

    const minutes = buildMinuteItems(hourTs, closeFp);
    const minuteRoot = computeMinuteRoot(pair, hourTs, minutes);
    const report: HourlyReport = {
      pair,
      hour_ts: hourTs.toString(),
      open_fp: closeFp,
      high_fp: closeFp,
      low_fp: closeFp,
      close_fp: closeFp,
      minute_root: minuteRoot,
      ruleset_version: 'v1',
      available_minutes: '60',
      degraded: false
    };
    const reportHash = hashHourlyReport(report);
    const registry = await buildRegistry();
    const signatures = {
      'reporter-1': await signMessage(`fpho:${hourTs}:${reportHash}`, privateKeys['reporter-1']),
      'reporter-2': await signMessage(`fpho:${hourTs}:different`, privateKeys['reporter-2'])
    };
    const opReturnHex = Buffer.from(
      encodeOpReturnPayload({
        pairId: 1,
        hourTs,
        closeFp,
        reportHash,
        sigBitmap: buildSignatureBitmap(registry, signatures)
      })
    ).toString('hex');

    const fetchImpl = buildFixtureFetch({
      anchorsPayload: {
        items: [
          {
            txid: 'txid-2',
            report_hash: reportHash,
            op_return_hex: opReturnHex
          }
        ]
      },
      reportPayload: {
        report,
        report_hash: reportHash,
        signatures,
        reporter_set_id: computeReporterSetId(registry)
      },
      minutesPayload: { items: minutes }
    });

    const result = await runVerifyCommand(
      {
        baseUrl: 'http://localhost:3000',
        pair,
        hourTs,
        registry,
        checkMinuteRoot: true
      },
      {
        fetchImpl
      }
    );

    expect(result.ok).toBe(false);
    expect(result.checks.quorum_valid).toBe(false);
  });

  it('fails verification when reporter set id mismatches registry', async () => {
    const hourTs = 1707346800;
    const pair = 'FLUXUSD';
    const closeFp = '62750000';

    const minutes = buildMinuteItems(hourTs, closeFp);
    const minuteRoot = computeMinuteRoot(pair, hourTs, minutes);
    const report: HourlyReport = {
      pair,
      hour_ts: hourTs.toString(),
      open_fp: closeFp,
      high_fp: closeFp,
      low_fp: closeFp,
      close_fp: closeFp,
      minute_root: minuteRoot,
      ruleset_version: 'v1',
      available_minutes: '60',
      degraded: false
    };
    const reportHash = hashHourlyReport(report);
    const registry = await buildRegistry();
    const signatures = {
      'reporter-1': await signMessage(`fpho:${hourTs}:${reportHash}`, privateKeys['reporter-1']),
      'reporter-2': await signMessage(`fpho:${hourTs}:${reportHash}`, privateKeys['reporter-2'])
    };
    const opReturnHex = Buffer.from(
      encodeOpReturnPayload({
        pairId: 1,
        hourTs,
        closeFp,
        reportHash,
        sigBitmap: buildSignatureBitmap(registry, signatures)
      })
    ).toString('hex');

    const fetchImpl = buildFixtureFetch({
      anchorsPayload: {
        items: [
          {
            txid: 'txid-3',
            report_hash: reportHash,
            op_return_hex: opReturnHex
          }
        ]
      },
      reportPayload: {
        report,
        report_hash: reportHash,
        signatures,
        reporter_set_id: 'mismatched-set-id'
      },
      minutesPayload: { items: minutes }
    });

    const result = await runVerifyCommand(
      {
        baseUrl: 'http://localhost:3000',
        pair,
        hourTs,
        registry,
        checkMinuteRoot: true
      },
      {
        fetchImpl
      }
    );

    expect(result.ok).toBe(false);
    expect(result.checks.reporter_set_match).toBe(false);
  });

  it('exposes CLI help text', () => {
    const usage = usageText();
    expect(usage).toContain('Usage: fpho-verify');
    expect(usage).toContain('--check-minute-root');
  });
});

function buildMinuteItems(
  hourTs: number,
  priceFp: string
): Array<{
  minute_ts: number;
  reference_price_fp: string | null;
  venues_used: number;
  degraded: boolean;
  degraded_reason: string | null;
}> {
  return minuteRange(hourTs).map((minuteTs) => ({
    minute_ts: minuteTs,
    reference_price_fp: priceFp,
    venues_used: 3,
    degraded: false,
    degraded_reason: null
  }));
}

function computeMinuteRoot(
  pair: string,
  hourTs: number,
  minutes: ReturnType<typeof buildMinuteItems>
): string {
  const minuteMap = new Map(minutes.map((entry) => [entry.minute_ts, entry]));

  const minuteRecords = minuteRange(hourTs).map((minuteTs) => {
    const minute = minuteMap.get(minuteTs);
    return {
      pair,
      minute_ts: minuteTs.toString(),
      reference_price_fp: minute?.reference_price_fp ?? null,
      venues_used: (minute?.venues_used ?? 0).toString(),
      degraded: minute?.degraded ?? true,
      degraded_reason: minute?.degraded_reason ?? 'missing_minute'
    } satisfies MinuteRecord;
  });

  return buildMerkleRoot(minuteRecords.map((record) => hashMinuteRecord(record)));
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

function buildFixtureFetch(fixtures: {
  anchorsPayload: unknown;
  reportPayload: unknown;
  minutesPayload: unknown;
}): typeof fetch {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input.toString());

    if (url.pathname === '/v1/anchors') {
      return new Response(JSON.stringify(fixtures.anchorsPayload), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (url.pathname.startsWith('/v1/report/')) {
      return new Response(JSON.stringify(fixtures.reportPayload), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (url.pathname === '/v1/minutes') {
      return new Response(JSON.stringify(fixtures.minutesPayload), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  };
}
