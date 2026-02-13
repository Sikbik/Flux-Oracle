import { describe, expect, it } from 'vitest';

import {
  canonicalizeHourlyReport,
  canonicalizeMinuteRecord,
  hashHourlyReport,
  hashMinuteRecord
} from '../src/index.js';

describe('hash fixtures', () => {
  it('matches fixture hash for minute record', () => {
    const minuteRecord = {
      degraded: false,
      pair: 'FLUXUSD',
      reference_price_fp: '62890000',
      minute_ts: '1707350400',
      venues_used: ['binance', 'kraken', 'mexc']
    };

    const canonical = new TextDecoder().decode(canonicalizeMinuteRecord(minuteRecord));
    expect(canonical).toBe(
      '{"degraded":false,"minute_ts":"1707350400","pair":"FLUXUSD","reference_price_fp":"62890000","venues_used":["binance","kraken","mexc"]}'
    );
    expect(hashMinuteRecord(minuteRecord)).toBe(
      '976131b31fbbbaa3c76d7d4a9453a7fd653e146f6c9290209adaa75683d15a9c'
    );
  });

  it('matches fixture hash for hourly report', () => {
    const report = {
      close_fp: '62910000',
      high_fp: '63100000',
      hour_ts: '1707346800',
      low_fp: '62500000',
      minute_root: 'a8f77efb8d27dfcfecf9806e3f3465fbbf3ea1b4f13e1d2a08326c4b5334f5e5',
      open_fp: '62600000',
      pair: 'FLUXUSD',
      ruleset_version: 'v1'
    };

    const canonical = new TextDecoder().decode(canonicalizeHourlyReport(report));
    expect(canonical).toBe(
      '{"close_fp":"62910000","high_fp":"63100000","hour_ts":"1707346800","low_fp":"62500000","minute_root":"a8f77efb8d27dfcfecf9806e3f3465fbbf3ea1b4f13e1d2a08326c4b5334f5e5","open_fp":"62600000","pair":"FLUXUSD","ruleset_version":"v1"}'
    );
    expect(hashHourlyReport(report)).toBe(
      '12250056bae9dfd7d3dd0071b9b0be8daf7158ee633617aed4e7cf755171043b'
    );
  });
});
