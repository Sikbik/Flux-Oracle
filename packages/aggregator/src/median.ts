import type { MinuteAggregationResult, VenueMinutePrice } from './types.js';

export function medianFixedPoint(values: readonly string[]): string {
  if (values.length === 0) {
    throw new Error('cannot compute median of empty set');
  }

  const sorted = values.map((value) => BigInt(value)).sort((a, b) => compareBigInt(a, b));
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    const value = sorted[middle];
    if (value === undefined) {
      throw new Error('missing median value');
    }
    return value.toString();
  }

  const left = sorted[middle - 1];
  const right = sorted[middle];
  if (left === undefined || right === undefined) {
    throw new Error('missing median values');
  }

  return ((left + right) / 2n).toString();
}

export function aggregateMinuteReferencePrice(
  prices: readonly VenueMinutePrice[],
  minVenuesPerMinute: number,
  outlierClipPct?: number
): MinuteAggregationResult {
  if (prices.length < minVenuesPerMinute) {
    return {
      referencePriceFp: null,
      venuesUsed: prices.length,
      degraded: true,
      degradedReason: 'insufficient_venues'
    };
  }

  const baseValues = prices.map((entry) => entry.priceFp);
  let values = baseValues;

  if (outlierClipPct && outlierClipPct > 0) {
    const baselineMedian = BigInt(medianFixedPoint(values));
    const clipped = values.filter((value) => {
      const current = BigInt(value);
      const delta = current > baselineMedian ? current - baselineMedian : baselineMedian - current;

      if (baselineMedian === 0n) {
        return current === 0n;
      }

      const ratioPct = Number((delta * 10000n) / baselineMedian) / 100;
      return ratioPct <= outlierClipPct;
    });

    if (clipped.length >= minVenuesPerMinute) {
      values = clipped;
    }
  }

  return {
    referencePriceFp: medianFixedPoint(values),
    venuesUsed: values.length,
    degraded: false,
    degradedReason: null
  };
}

function compareBigInt(a: bigint, b: bigint): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
