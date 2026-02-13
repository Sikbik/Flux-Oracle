import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://ws-api-spot.kucoin.com';

export class KuCoinAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'kucoin';

  readonly symbolMap = {
    FLUXUSD: 'FLUX-USDT'
  };

  constructor() {
    super(WS_URL);
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    return [
      {
        id: Date.now().toString(),
        type: 'subscribe',
        topic: `/market/match:${venueSymbol}`,
        privateChannel: false,
        response: true
      }
    ];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for KuCoin: ${pair}`);
    }
    return symbol;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return parseKuCoinTradeMessage(payload);
  }
}

export function parseKuCoinTradeMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || payload.type !== 'message' || !isObject(payload.data)) {
    return [];
  }

  const time = Number(payload.data.time);
  const timestampMs = Number.isFinite(time) ? Math.floor(time / 1_000_000) : 0;

  return [
    {
      pair: 'FLUXUSD',
      venue: 'kucoin',
      ts: timestampMs,
      price: String(payload.data.price),
      size: String(payload.data.size),
      side: String(payload.data.side)
    }
  ];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
