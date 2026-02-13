import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://stream.crypto.com/exchange/v1/market';

export class CryptoComAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'crypto_com';

  readonly symbolMap = {
    FLUXUSD: 'FLUX_USDT'
  };

  constructor() {
    super(WS_URL);
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    return [
      {
        id: Date.now(),
        method: 'subscribe',
        params: {
          channels: [`trade.${venueSymbol}`]
        }
      }
    ];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for Crypto.com: ${pair}`);
    }
    return symbol;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return parseCryptoComTradeMessage(payload);
  }
}

export function parseCryptoComTradeMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || !isObject(payload.result) || !Array.isArray(payload.result.data)) {
    return [];
  }

  return payload.result.data
    .filter((entry) => isObject(entry))
    .map((entry) => ({
      pair: 'FLUXUSD',
      venue: 'crypto_com',
      ts: typeof entry.t === 'string' || typeof entry.t === 'number' ? entry.t : 0,
      price: String(entry.p),
      size: String(entry.q),
      side: String(entry.s)
    }));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
