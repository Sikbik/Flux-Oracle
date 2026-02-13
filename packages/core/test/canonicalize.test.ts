import { describe, expect, it } from 'vitest';

import {
  assertNoNumbers,
  CanonicalizationError,
  canonicalizeJson,
  hashMinuteRecord
} from '../src/index.js';

describe('canonicalization', () => {
  it('produces stable output regardless of key order', () => {
    const a = {
      pair: 'FLUXUSD',
      minute_ts: '1707350400',
      reference_price_fp: '62890000',
      degraded: false
    };

    const b = {
      degraded: false,
      reference_price_fp: '62890000',
      minute_ts: '1707350400',
      pair: 'FLUXUSD'
    };

    expect(canonicalizeJson(a)).toBe(canonicalizeJson(b));
    expect(hashMinuteRecord(a)).toBe(hashMinuteRecord(b));
  });

  it('rejects numeric JSON values', () => {
    expect(() => assertNoNumbers({ minute_ts: 1707350400 })).toThrow(CanonicalizationError);
  });
});
