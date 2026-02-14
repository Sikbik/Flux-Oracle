import type { IngestorConfig } from './types.js';

const DEFAULT_DB_PATH = 'data/fpho.sqlite';
const DEFAULT_PAIR = 'FLUXUSD';
const DEFAULT_ENABLED_VENUES = ['binance', 'kraken', 'gate', 'kucoin', 'mexc', 'crypto_com'];
const DEFAULT_HEALTH_HOST = '0.0.0.0';

export function loadIngestorConfigFromEnv(env: NodeJS.ProcessEnv = process.env): IngestorConfig {
  const rawVenues = env.FPHO_ENABLED_VENUES;
  const enabledVenues = rawVenues
    ? rawVenues
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0)
    : DEFAULT_ENABLED_VENUES;

  return {
    dbPath: env.FPHO_DB_PATH ?? DEFAULT_DB_PATH,
    pair: env.FPHO_PAIR ?? DEFAULT_PAIR,
    enabledVenues,
    batchSize: parsePositiveInt(env.FPHO_INGESTOR_BATCH_SIZE, 200),
    flushIntervalMs: parsePositiveInt(env.FPHO_INGESTOR_FLUSH_INTERVAL_MS, 1_000),
    healthHost: env.FPHO_INGESTOR_HEALTH_HOST ?? DEFAULT_HEALTH_HOST,
    healthPort: parseNonNegativeInt(env.FPHO_INGESTOR_HEALTH_PORT, 8081)
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`invalid positive integer value: ${value}`);
  }

  return parsed;
}

function parseNonNegativeInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`invalid non-negative integer value: ${value}`);
  }

  return parsed;
}
