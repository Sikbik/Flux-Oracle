import {
  BinanceAdapter,
  CoinExAdapter,
  CryptoComAdapter,
  GateAdapter,
  HtxAdapter,
  KrakenAdapter,
  KuCoinAdapter,
  MexcAdapter,
  type VenueAdapter
} from '@fpho/venues';

const ADAPTER_FACTORIES: Record<string, () => VenueAdapter> = {
  binance: () => new BinanceAdapter(),
  kraken: () => new KrakenAdapter(),
  gate: () => new GateAdapter(),
  kucoin: () => new KuCoinAdapter(),
  mexc: () => new MexcAdapter(),
  crypto_com: () => new CryptoComAdapter(),
  coinex: () => new CoinExAdapter(),
  htx: () => new HtxAdapter()
};

export function createVenueAdapters(enabledVenues: string[]): VenueAdapter[] {
  return enabledVenues.map((venue) => {
    const factory = ADAPTER_FACTORIES[venue];
    if (!factory) {
      throw new Error(`unsupported venue in config: ${venue}`);
    }
    return factory();
  });
}
