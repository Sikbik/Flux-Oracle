import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://stream.binance.com:443/ws';

export class BinanceAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'binance';

  readonly symbolMap = {
    FLUXUSD: 'FLUXUSDT'
  };

  constructor() {
    super(WS_URL);
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    return [
      {
        method: 'SUBSCRIBE',
        params: [
          `${venueSymbol.toLowerCase()}@trade`,
          `${venueSymbol.toLowerCase()}@miniTicker`,
          `${venueSymbol.toLowerCase()}@bookTicker`
        ],
        id: Date.now()
      }
    ];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for Binance: ${pair}`);
    }
    return symbol;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return [
      ...parseBinanceTradeMessage(payload),
      ...parseBinanceTickerMessage(payload)
    ];
  }
}

export function parseBinanceTradeMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload)) {
    return [];
  }

  if (payload.e !== 'trade' || typeof payload.p !== 'string') {
    return [];
  }

  return [
    {
      pair: 'FLUXUSD',
      venue: 'binance',
      ts: typeof payload.T === 'number' ? payload.T : typeof payload.E === 'number' ? payload.E : 0,
      price: payload.p,
      size: typeof payload.q === 'string' || typeof payload.q === 'number' ? payload.q : undefined,
      side: payload.m ? 'sell' : 'buy'
    }
  ];
}

export function parseBinanceTickerMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload)) {
    return [];
  }

  const event = payload.e;
  const hasBookShape =
    event === undefined &&
    payload.s !== undefined &&
    payload.u !== undefined &&
    (payload.a !== undefined || payload.b !== undefined);

  if (
    !hasBookShape &&
    event !== '24hrMiniTicker' &&
    event !== '24hrTicker' &&
    event !== 'bookTicker'
  ) {
    return [];
  }

  const price =
    typeof payload.c === 'string' || typeof payload.c === 'number'
      ? payload.c
      : typeof payload.a === 'string' || typeof payload.a === 'number'
        ? payload.a
        : typeof payload.b === 'string' || typeof payload.b === 'number'
          ? payload.b
          : undefined;

  if (price === undefined || price === null) {
    return [];
  }

  return [
    {
      pair: 'FLUXUSD',
      venue: 'binance',
      ts: typeof payload.E === 'number' ? payload.E : Date.now(),
      price,
      side: null
    }
  ];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
