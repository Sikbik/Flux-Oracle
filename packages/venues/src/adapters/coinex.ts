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
  if (!isObject(payload) || payload.method !== 'state.update' || !isObject(payload.data)) {
    return [];
  }

  const data = payload.data as Record<string, unknown>;
  if (!Array.isArray(data.state_list)) {
    return [];
  }

  return data.state_list
    .filter((entry) => isObject(entry))
    .flatMap((entry) => {
      const price = entry.last ?? entry.close ?? entry.open ?? entry.price;
      if (price === undefined || price === null) {
        return [];
      }

      return [
        {
          pair: 'FLUXUSD',
          venue: 'coinex',
          ts: Date.now(),
          price: String(price),
          side: null
        }
      ];
    });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
