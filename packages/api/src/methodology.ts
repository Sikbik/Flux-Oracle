export interface MethodologyDefinition {
  pair: string;
  venues: string[];
  perVenueRule: string;
  referenceRule: string;
  minVenuesPerMinute: number;
  outlierClipPct: number;
  degradedPolicy: string;
  graceSeconds: number;
}

export const DEFAULT_METHODOLOGY: MethodologyDefinition = {
  pair: 'FLUXUSD',
  venues: ['binance', 'kraken', 'gate', 'kucoin', 'mexc', 'crypto_com'],
  perVenueRule: 'last_trade_in_minute',
  referenceRule: 'median_across_venues',
  minVenuesPerMinute: 2,
  outlierClipPct: 10,
  degradedPolicy: 'strict_null_on_insufficient_venues',
  graceSeconds: 15
};
