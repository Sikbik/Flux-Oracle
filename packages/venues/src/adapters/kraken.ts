import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://ws.kraken.com';

export class KrakenAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'kraken';

  readonly symbolMap = {
    FLUXUSD: 'FLUX/USD'
  };

  constructor() {
    super(WS_URL);
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    return [
      {
        event: 'subscribe',
        pair: [venueSymbol],
        subscription: { name: 'trade' }
      }
    ];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for Kraken: ${pair}`);
    }
    return symbol;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return parseKrakenTradeMessage(payload);
  }
}

export function parseKrakenTradeMessage(payload: unknown): NormalizationInput[] {
  if (!Array.isArray(payload) || payload.length < 4) {
    return [];
  }

  if (payload[2] !== 'trade' || !Array.isArray(payload[1])) {
    return [];
  }

  const firstTrade = payload[1][0];
  if (!Array.isArray(firstTrade) || firstTrade.length < 4) {
    return [];
  }

  return [
    {
      pair: 'FLUXUSD',
      venue: 'kraken',
      ts: Number(firstTrade[2]),
      price: String(firstTrade[0]),
      size: String(firstTrade[1]),
      side: firstTrade[3] === 's' ? 'sell' : 'buy'
    }
  ];
}
