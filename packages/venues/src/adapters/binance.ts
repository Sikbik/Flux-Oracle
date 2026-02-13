import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://stream.binance.com:9443/ws';

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
        params: [`${venueSymbol.toLowerCase()}@trade`],
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
    return parseBinanceTradeMessage(payload);
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
