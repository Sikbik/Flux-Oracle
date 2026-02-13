import { describe, expect, it } from 'vitest';

import { aggregateMinuteReferencePrice, medianFixedPoint } from '../src/index.js';

describe('minute reference median', () => {
  it('computes odd/even medians deterministically', () => {
    expect(medianFixedPoint(['1', '3', '2'])).toBe('2');
    expect(medianFixedPoint(['1', '3', '2', '4'])).toBe('2');
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
});
