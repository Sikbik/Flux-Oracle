import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://socket.coinex.com/v2/spot/';

export class CoinExAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'coinex';

  readonly symbolMap = {
    FLUXUSD: 'FLUXUSDT'
  };

  constructor() {
    super(WS_URL);
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    return [
      {
        id: Date.now(),
        method: 'state.subscribe',
        params: {
          market_list: [venueSymbol],
          limit: 10,
          interval: 1000
        }
      }
    ];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for CoinEx: ${pair}`);
    }
    return symbol;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return parseCoinExTradeMessage(payload);
  }
}

export function parseCoinExTradeMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || payload.method !== 'state.update' || !isObject(payload.params)) {
    return [];
  }

  const params = payload.params as Record<string, unknown>;
  if (!Array.isArray(params.data)) {
    return [];
  }

  return params.data
    .filter((entry) => Array.isArray(entry))
    .map((entry) => {
      const ts = entry[1];
      const price = entry[2];
      const size = entry[3];
      const side = entry[4];

      return {
        pair: 'FLUXUSD',
        venue: 'coinex',
        ts: typeof ts === 'string' || typeof ts === 'number' ? ts : 0,
        price: String(price),
        size: size === undefined ? undefined : String(size),
        side: side === undefined ? null : String(side)
      };
    });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
