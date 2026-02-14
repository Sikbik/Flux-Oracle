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

export function weightedMedianFixedPoint(
  values: Array<{ value: string; weight: number }>
): string {
  if (values.length === 0) {
    throw new Error('cannot compute weighted median of empty set');
  }

  const normalized = values
    .map((entry) => ({
      value: BigInt(entry.value),
      weight: entry.weight
    }))
    .filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0);

  if (normalized.length === 0) {
    throw new Error('weighted median requires positive weights');
  }

  const sorted = normalized.sort((left, right) =>
    left.value === right.value ? 0 : left.value < right.value ? -1 : 1
  );

  const totalWeight = sorted.reduce((sum, entry) => sum + entry.weight, 0);
  const threshold = totalWeight / 2;
  let cumulative = 0;

  for (const entry of sorted) {
    cumulative += entry.weight;
    if (cumulative >= threshold) {
      return entry.value.toString();
    }
  }

  return sorted[sorted.length - 1]?.value.toString() ?? '0';
}

export function aggregateMinuteReferencePrice(
  prices: readonly VenueMinutePrice[],
  minVenuesPerMinute: number,
  outlierClipPct?: number,
  weightsByVenue?: Record<string, number>
): MinuteAggregationResult {
  const weightedEntries = prices
    .map((entry) => ({
      venue: entry.venue,
      priceFp: entry.priceFp,
      weight: weightsByVenue?.[entry.venue] ?? 1
    }))
    .filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0);

  if (weightedEntries.length < minVenuesPerMinute) {
    return {
      referencePriceFp: null,
      venuesUsed: weightedEntries.length,
      degraded: true,
      degradedReason: 'insufficient_venues'
    };
  }

  const baseValues = weightedEntries.map((entry) => entry.priceFp);
  let values = baseValues;
  let filteredEntries = weightedEntries;

  if (outlierClipPct && outlierClipPct > 0) {
    const baselineMedian = weightsByVenue
      ? BigInt(
          weightedMedianFixedPoint(
            weightedEntries.map((entry) => ({ value: entry.priceFp, weight: entry.weight }))
          )
        )
      : BigInt(medianFixedPoint(values));
    const clipped = filteredEntries.filter((entry) => {
      const value = entry.priceFp;
      const current = BigInt(value);
      const delta = current > baselineMedian ? current - baselineMedian : baselineMedian - current;

      if (baselineMedian === 0n) {
        return current === 0n;
      }

      const ratioPct = Number((delta * 10000n) / baselineMedian) / 100;
      return ratioPct <= outlierClipPct;
    });

    if (clipped.length >= minVenuesPerMinute) {
      filteredEntries = clipped;
      values = clipped.map((entry) => entry.priceFp);
    }
  }

  return {
    referencePriceFp: weightsByVenue
      ? weightedMedianFixedPoint(
          filteredEntries.map((entry) => ({ value: entry.priceFp, weight: entry.weight }))
        )
      : medianFixedPoint(values),
    venuesUsed: filteredEntries.length,
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
