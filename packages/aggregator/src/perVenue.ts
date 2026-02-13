import type { RawTickRow, VenueMinutePrice } from './types.js';

export function lastTradeInMinute(
  venue: string,
  ticks: readonly RawTickRow[]
): VenueMinutePrice | null {
  if (ticks.length === 0) {
    return null;
  }

  const sorted = [...ticks].sort((left, right) => {
    if (left.ts !== right.ts) {
      return right.ts - left.ts;
    }

    return right.id - left.id;
  });

  const last = sorted[0];
  if (!last) {
    return null;
  }

  return {
    venue,
    priceFp: last.price_fp,
    tickCount: ticks.length
  };
}
