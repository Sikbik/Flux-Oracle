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
          channels: [`trade.${venueSymbol}`, `ticker.${venueSymbol}`]
        }
      }
    ];
  }

  protected override getSubscribeDelayMs(): number {
    return 1000;
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for Crypto.com: ${pair}`);
    }
    return symbol;
  }

  protected override handleControlMessage(payload: unknown): boolean {
    if (!isObject(payload) || payload.method !== 'public/heartbeat') {
      return false;
    }

    const id = payload.id;
    const heartbeatId = typeof id === 'string' || typeof id === 'number' ? id : Date.now();
    this.sendMessage({ id: heartbeatId, method: 'public/respond-heartbeat' });
    return true;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return [...parseCryptoComTradeMessage(payload), ...parseCryptoComTickerMessage(payload)];
  }
}

export function parseCryptoComTradeMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || !isObject(payload.result) || !Array.isArray(payload.result.data)) {
    return [];
  }

  return payload.result.data
    .filter((entry) => isObject(entry))
    .flatMap((entry) => {
      if (entry.p === undefined || entry.p === null) {
        return [];
      }

      const ts = entry.t ?? 0;
      return [
        {
          pair: 'FLUXUSD',
          venue: 'crypto_com',
          ts: typeof ts === 'string' || typeof ts === 'number' ? ts : 0,
          price: String(entry.p),
          size: entry.q === undefined ? undefined : String(entry.q),
          side: entry.s === undefined ? null : String(entry.s)
        }
      ];
    });
}

export function parseCryptoComTickerMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || !isObject(payload.result) || !Array.isArray(payload.result.data)) {
    return [];
  }

  return payload.result.data
    .filter((entry) => isObject(entry))
    .flatMap((entry) => {
      const price =
        entry.k ??
        entry.a ??
        entry.b ??
        entry.p ??
        entry.c ??
        entry.price ??
        entry.last ??
        entry.mark;
      if (price === undefined || price === null) {
        return [];
      }

      const ts = entry.t ?? entry.ts ?? Date.now();
      return [
        {
          pair: 'FLUXUSD',
          venue: 'crypto_com',
          ts: typeof ts === 'string' || typeof ts === 'number' ? ts : Date.now(),
          price: String(price),
          side: null
        }
      ];
    });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
