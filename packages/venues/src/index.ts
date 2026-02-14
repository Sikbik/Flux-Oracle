export { BaseVenueAdapter } from './adapter.js';
export { ExponentialBackoff, scheduleReconnect } from './backoff.js';

export {
  BinanceAdapter,
  parseBinanceTickerMessage,
  parseBinanceTradeMessage
} from './adapters/binance.js';
export { CryptoComAdapter, parseCryptoComTradeMessage } from './adapters/cryptocom.js';
export { GateAdapter, parseGateTickerMessage, parseGateTradeMessage } from './adapters/gate.js';
export {
  KrakenAdapter,
  parseKrakenTickerMessage,
  parseKrakenTradeMessage
} from './adapters/kraken.js';
export {
  KuCoinAdapter,
  parseKuCoinTickerMessage,
  parseKuCoinTradeMessage
} from './adapters/kucoin.js';
export { MexcAdapter, parseMexcTradeMessage } from './adapters/mexc.js';

export {
  normalizePriceToFixed,
  normalizeRawTick,
  normalizeSide,
  normalizeSizeToFixed,
  normalizeTimestamp
} from './normalize.js';
export type { NormalizationInput, NormalizedTick, TickSide, VenueAdapter } from './types.js';
