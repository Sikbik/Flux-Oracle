import { describe, expect, it } from 'vitest';

import {
  normalizePriceToFixed,
  normalizeRawTick,
  normalizeSide,
  normalizeTimestamp
} from '../src/index.js';

describe('normalization helpers', () => {
  it('normalizes timestamps into unix seconds', () => {
    expect(normalizeTimestamp(1707350467)).toBe(1707350467);
    expect(normalizeTimestamp(1707350467000)).toBe(1707350467);
    expect(normalizeTimestamp('1707350467')).toBe(1707350467);
    expect(normalizeTimestamp('2024-02-07T16:01:07.000Z')).toBe(1707321667);
  });

  it('normalizes price inputs to 1e8 fixed point', () => {
    expect(normalizePriceToFixed('0.62890000')).toBe('62890000');
    expect(normalizePriceToFixed(0.1)).toBe('10000000');
  });

  it('maps side aliases', () => {
    expect(normalizeSide('buy')).toBe('buy');
    expect(normalizeSide('bid')).toBe('buy');
    expect(normalizeSide('ask')).toBe('sell');
    expect(normalizeSide('random')).toBe('unknown');
    expect(normalizeSide(undefined)).toBeUndefined();
  });

  it('normalizes a raw tick object', () => {
    expect(
      normalizeRawTick({
        pair: 'FLUXUSD',
        venue: 'binance',
        ts: '1707350467',
        price: '0.62890000',
        size: '12.5',
        side: 'B'
      })
    ).toEqual({
      ts: 1707350467,
      venue: 'binance',
      pair: 'FLUXUSD',
      price: '62890000',
      size: '1250000000',
      side: 'buy'
    });
  });
});
