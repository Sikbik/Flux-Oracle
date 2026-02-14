import { describe, expect, it } from 'vitest';

import {
  aggregateMinuteReferencePrice,
  medianFixedPoint,
  weightedMedianFixedPoint
} from '../src/index.js';

describe('minute reference median', () => {
  it('computes odd/even medians deterministically', () => {
    expect(medianFixedPoint(['1', '3', '2'])).toBe('2');
    expect(medianFixedPoint(['1', '3', '2', '4'])).toBe('2');
  });

  it('computes weighted median using venue weights', () => {
    expect(
      weightedMedianFixedPoint([
        { value: '100', weight: 2 },
        { value: '200', weight: 1 },
        { value: '300', weight: 1 }
      ])
    ).toBe('100');
  });

  it('returns degraded when venues are insufficient', () => {
    const result = aggregateMinuteReferencePrice(
      [
        {
          venue: 'binance',
          priceFp: '62890000',
          tickCount: 10
        }
      ],
      2
    );

    expect(result).toEqual({
      referencePriceFp: null,
      venuesUsed: 1,
      degraded: true,
      degradedReason: 'insufficient_venues'
    });
  });

  it('clips outliers when threshold allows', () => {
    const result = aggregateMinuteReferencePrice(
      [
        { venue: 'binance', priceFp: '100', tickCount: 5 },
        { venue: 'kraken', priceFp: '101', tickCount: 5 },
        { venue: 'gate', priceFp: '500', tickCount: 5 }
      ],
      2,
      5
    );

    expect(result).toEqual({
      referencePriceFp: '100',
      venuesUsed: 2,
      degraded: false,
      degradedReason: null
    });
  });

  it('uses weighted median when weights are provided', () => {
    const result = aggregateMinuteReferencePrice(
      [
        { venue: 'binance', priceFp: '100', tickCount: 5 },
        { venue: 'kraken', priceFp: '105', tickCount: 5 },
        { venue: 'uniswap_v3_base', priceFp: '130', tickCount: 5 }
      ],
      2,
      undefined,
      {
        binance: 1,
        kraken: 1,
        uniswap_v3_base: 3
      }
    );

    expect(result).toEqual({
      referencePriceFp: '130',
      venuesUsed: 3,
      degraded: false,
      degradedReason: null
    });
  });
});
