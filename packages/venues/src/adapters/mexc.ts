import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://wbs.mexc.com/ws';

export class MexcAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'mexc';

  readonly symbolMap = {
    FLUXUSD: 'FLUXUSDT'
  };

  constructor() {
    super(WS_URL);
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    return [
      {
        method: 'SUBSCRIPTION',
        params: [`spot@public.deals.v3.api@${venueSymbol}`]
      }
    ];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for MEXC: ${pair}`);
    }
    return symbol;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return parseMexcTradeMessage(payload);
  }
}

export function parseMexcTradeMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || !isObject(payload.d) || !Array.isArray(payload.d.deals)) {
    return [];
  }

  return payload.d.deals
    .filter((entry) => isObject(entry))
    .map((entry) => ({
      pair: 'FLUXUSD',
      venue: 'mexc',
      ts: typeof entry.t === 'string' || typeof entry.t === 'number' ? entry.t : 0,
      price: String(entry.p),
      size: String(entry.v),
      side: Number(entry.S) === 1 ? 'buy' : 'sell'
    }));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
