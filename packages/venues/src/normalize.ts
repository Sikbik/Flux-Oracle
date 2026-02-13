import { parseDecimalToFixed } from '@fpho/core';

import type { NormalizationInput, NormalizedTick, TickSide } from './types.js';

export function normalizeTimestamp(value: string | number | Date): number {
  const resolved = resolveTimestampMs(value);
  return Math.floor(resolved / 1000);
}

export function normalizePriceToFixed(value: string | number): string {
  if (typeof value === 'string') {
    return parseDecimalToFixed(value);
  }

  if (!Number.isFinite(value)) {
    throw new Error(`invalid numeric price value: ${value}`);
  }

  return parseDecimalToFixed(value.toFixed(8));
}

export function normalizeSizeToFixed(value: string | number | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizePriceToFixed(value);
}

export function normalizeSide(value: string | null | undefined): TickSide | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'buy' || normalized === 'bid' || normalized === 'b') {
    return 'buy';
  }

  if (normalized === 'sell' || normalized === 'ask' || normalized === 's') {
    return 'sell';
  }

  return 'unknown';
}

export function normalizeRawTick(input: NormalizationInput): NormalizedTick {
  return {
    ts: normalizeTimestamp(input.ts),
    venue: input.venue,
    pair: input.pair,
    price: normalizePriceToFixed(input.price),
    size: normalizeSizeToFixed(input.size),
    side: normalizeSide(input.side)
  };
}

function resolveTimestampMs(value: string | number | Date): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return normalizeEpochValue(numeric);
    }

    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }

    throw new Error(`invalid timestamp string: ${value}`);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return normalizeEpochValue(value);
  }

  throw new Error(`invalid timestamp value: ${value}`);
}

function normalizeEpochValue(value: number): number {
  if (value > 1_000_000_000_000) {
    return value;
  }

  return value * 1000;
}
