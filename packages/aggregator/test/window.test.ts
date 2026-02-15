import { describe, expect, it } from 'vitest';

import { buildWindowReportFromMinutes } from '../src/index.js';

describe('window report building', () => {
  it('computes OHLC and deterministic commitments', () => {
    const result = buildWindowReportFromMinutes(
      'FLUXUSD',
      1707346800,
      600,
      [
        {
          minuteTs: 1707346800,
          referencePriceFp: '62800000',
          venuesUsed: 3,
          degraded: false,
          degradedReason: null
        },
        {
          minuteTs: 1707346860,
          referencePriceFp: '62900000',
          venuesUsed: 3,
          degraded: false,
          degradedReason: null
        },
        {
          minuteTs: 1707346920,
          referencePriceFp: '62750000',
          venuesUsed: 3,
          degraded: false,
          degradedReason: null
        }
      ],
      'v1'
    );

    expect(result.report).toMatchObject({
      pair: 'FLUXUSD',
      window_ts: '1707346800',
      window_seconds: '600',
      open_fp: '62800000',
      high_fp: '62900000',
      low_fp: '62750000',
      close_fp: '62750000',
      ruleset_version: 'v1',
      available_minutes: '3',
      degraded: true
    });

    expect(result.minuteRoot).toBe(
      'b51c0ddcebeee628172d9d1b4f1aaea4d561990e3bfa463135f6d4a2270c72c6'
    );
    expect(result.reportHash).toBe(
      'd035ed8e24d594d317747966e3048652213d6d613d28e647c2a6dbe0cdec8269'
    );
  });
});
