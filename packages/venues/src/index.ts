export { BaseVenueAdapter } from './adapter.js';
export { ExponentialBackoff, scheduleReconnect } from './backoff.js';

export { BinanceAdapter, parseBinanceTradeMessage } from './adapters/binance.js';
export { CryptoComAdapter, parseCryptoComTradeMessage } from './adapters/cryptocom.js';
export { GateAdapter, parseGateTradeMessage } from './adapters/gate.js';
export { KrakenAdapter, parseKrakenTradeMessage } from './adapters/kraken.js';
export { KuCoinAdapter, parseKuCoinTradeMessage } from './adapters/kucoin.js';
export { MexcAdapter, parseMexcTradeMessage } from './adapters/mexc.js';
export {
  UniswapV3Adapter,
  buildUniswapV3AdapterFromEnv,
  fetchUniswapV3PoolPrice,
  type UniswapV3PriceField
} from './adapters/uniswapV3.js';

export {
  normalizePriceToFixed,
  normalizeRawTick,
  normalizeSide,
  normalizeSizeToFixed,
  normalizeTimestamp
} from './normalize.js';
export type { NormalizationInput, NormalizedTick, TickSide, VenueAdapter } from './types.js';
