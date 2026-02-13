export interface MinuteFinalizerConfig {
  dbPath: string;
  pair: string;
  venues: string[];
  graceSeconds: number;
  minVenuesPerMinute: number;
  outlierClipPct?: number;
}

export interface RawTickRow {
  id: number;
  ts: number;
  price_fp: string;
  venue: string;
}

export interface VenueMinutePrice {
  venue: string;
  priceFp: string;
  tickCount: number;
}

export interface MinuteAggregationResult {
  referencePriceFp: string | null;
  venuesUsed: number;
  degraded: boolean;
  degradedReason: string | null;
}
