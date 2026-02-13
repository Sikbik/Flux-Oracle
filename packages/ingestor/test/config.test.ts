import { describe, expect, it } from 'vitest';

import { loadIngestorConfigFromEnv } from '../src/config.js';
import { createVenueAdapters } from '../src/factory.js';

describe('ingestor config and factory', () => {
  it('loads defaults from environment', () => {
    const config = loadIngestorConfigFromEnv({});
    expect(config.dbPath).toBe('data/fpho.sqlite');
    expect(config.pair).toBe('FLUXUSD');
    expect(config.enabledVenues).toContain('binance');
    expect(config.batchSize).toBe(200);
    expect(config.flushIntervalMs).toBe(1000);
  });

  it('parses explicit environment overrides', () => {
    const config = loadIngestorConfigFromEnv({
      FPHO_DB_PATH: '/tmp/fpho.sqlite',
      FPHO_PAIR: 'FLUXUSD',
      FPHO_ENABLED_VENUES: 'binance,kraken',
      FPHO_INGESTOR_BATCH_SIZE: '10',
      FPHO_INGESTOR_FLUSH_INTERVAL_MS: '500',
      FPHO_INGESTOR_HEALTH_PORT: '9090'
    });

    expect(config).toEqual({
      dbPath: '/tmp/fpho.sqlite',
      pair: 'FLUXUSD',
      enabledVenues: ['binance', 'kraken'],
      batchSize: 10,
      flushIntervalMs: 500,
      healthPort: 9090
    });
  });

  it('creates adapters for configured venues', () => {
    const adapters = createVenueAdapters(['binance', 'kraken', 'gate']);
    expect(adapters).toHaveLength(3);
    expect(adapters.map((adapter) => adapter.venueId)).toEqual(['binance', 'kraken', 'gate']);
  });
});
