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
      },
      {
        event: 'subscribe',
        pair: [venueSymbol],
        subscription: { name: 'ticker' }
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
    return [...parseKrakenTradeMessage(payload), ...parseKrakenTickerMessage(payload)];
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

export function parseKrakenTickerMessage(payload: unknown): NormalizationInput[] {
  if (!Array.isArray(payload) || payload.length < 4) {
    return [];
  }

  if (payload[2] !== 'ticker' || !isObject(payload[1])) {
    return [];
  }

  const data = payload[1] as Record<string, unknown>;
  const close = Array.isArray(data.c) ? data.c[0] : undefined;
  if (close === undefined) {
    return [];
  }

  return [
    {
      pair: 'FLUXUSD',
      venue: 'kraken',
      ts: Date.now(),
      price: String(close),
      side: null
    }
  ];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
