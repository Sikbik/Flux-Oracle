export interface MethodologyDefinition {
  pair: string;
  venues: string[];
  perVenueRule: string;
  referenceRule: string;
  minVenuesPerMinute: number;
  outlierClipPct: number;
  degradedPolicy: string;
  graceSeconds: number;
  fmvRuleStatement: string;
  auditCitationSteps: string[];
}

export const DEFAULT_METHODOLOGY: MethodologyDefinition = {
  pair: 'FLUXUSD',
  venues: ['binance', 'kraken', 'gate', 'kucoin', 'mexc', 'crypto_com'],
  perVenueRule: 'last_trade_in_minute',
  referenceRule: 'median_across_venues',
  minVenuesPerMinute: 2,
  outlierClipPct: 10,
  degradedPolicy: 'strict_null_on_insufficient_venues',
  graceSeconds: 15,
  fmvRuleStatement:
    'FMV for a transaction timestamp is the FLUXUSD minute bucket reference_price_fp returned by /v1/price_at for that UTC second.',
  auditCitationSteps: [
    'Record the pair, hour_ts, report_hash, and anchor txid for each pricing reference.',
    'Retain the hourly report JSON and matching OP_RETURN payload decode output.',
    'Include quorum signature verification output tied to the reporter_set_id used for that hour.'
  ]
};
