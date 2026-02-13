import type { NormalizedTick, VenueAdapter } from '@fpho/venues';

export interface IngestorConfig {
  dbPath: string;
  pair: string;
  enabledVenues: string[];
  batchSize: number;
  flushIntervalMs: number;
  healthPort: number;
}

export interface IngestorStats {
  queuedTicks: number;
  totalTicks: number;
  venueStats: Record<string, VenueRuntimeStats>;
}

export interface VenueRuntimeStats {
  lastTickTs: number | null;
  receivedTicks: number;
  disconnectCount: number;
  reconnectCount: number;
}

export interface IngestorDependencies {
  adapters: VenueAdapter[];
}

export type TickBatch = NormalizedTick[];
