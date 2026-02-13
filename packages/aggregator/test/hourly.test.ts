import { describe, expect, it } from 'vitest';

import { buildHourlyReportFromMinutes } from '../src/index.js';

describe('hourly report building', () => {
  it('computes OHLC and deterministic commitments', () => {
    const result = buildHourlyReportFromMinutes(
      'FLUXUSD',
      1707346800,
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
      hour_ts: '1707346800',
      open_fp: '62800000',
      high_fp: '62900000',
      low_fp: '62750000',
      close_fp: '62750000',
      ruleset_version: 'v1',
      available_minutes: '3',
      degraded: true
    });

    expect(result.minuteRoot).toBe(
      '1b3b143abec9f914dae81ebc54762631056850e77910e6b4b39d0d03a97a4d7e'
    );
    expect(result.reportHash).toBe(
      'c43278037dc25da4cac87d69be8a66db63ef76e4ca23fe547daba671189c77ef'
    );
  });
});
