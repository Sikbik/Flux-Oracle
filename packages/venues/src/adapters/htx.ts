import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://api.huobi.pro/ws';

export class HtxAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'htx';

  readonly symbolMap = {
    FLUXUSD: 'fluxusdt'
  };

  constructor() {
    super(WS_URL);
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    const now = Date.now();
    return [
      { sub: `market.${venueSymbol}.trade.detail`, id: `trade-${now}` },
      { sub: `market.${venueSymbol}.ticker`, id: `ticker-${now}` }
    ];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for HTX: ${pair}`);
    }
    return symbol;
  }

  protected override handleControlMessage(payload: unknown): boolean {
    if (!isObject(payload) || typeof payload.ping !== 'number') {
      return false;
    }

    this.sendMessage({ pong: payload.ping });
    return true;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return [...parseHtxTradeMessage(payload), ...parseHtxTickerMessage(payload)];
  }
}

export function parseHtxTradeMessage(payload: unknown): NormalizationInput[] {
  if (
    !isObject(payload) ||
    typeof payload.ch !== 'string' ||
    !payload.ch.includes('trade.detail')
  ) {
    return [];
  }

  if (!isObject(payload.tick)) {
    return [];
  }

  const tick = payload.tick as Record<string, unknown>;
  const data = Array.isArray(tick.data) ? tick.data : [];

  return data
    .filter((entry) => isObject(entry))
    .flatMap((entry) => {
      const price = entry.price ?? entry.p ?? entry.close;
      if (price === undefined || price === null) {
        return [];
      }

      const ts = entry.ts ?? tick.ts ?? payload.ts ?? 0;
      return [
        {
          pair: 'FLUXUSD',
          venue: 'htx',
          ts: typeof ts === 'number' || typeof ts === 'string' ? ts : 0,
          price: String(price),
          size: entry.amount !== undefined ? String(entry.amount) : undefined,
          side: entry.direction !== undefined ? String(entry.direction) : null
        }
      ];
    });
}

export function parseHtxTickerMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || typeof payload.ch !== 'string' || !payload.ch.includes('.ticker')) {
    return [];
  }

  if (!isObject(payload.tick)) {
    return [];
  }

  const tick = payload.tick as Record<string, unknown>;
  const price = tick.close ?? tick.last ?? tick.price ?? tick.bid ?? tick.ask;
  if (price === undefined || price === null) {
    return [];
  }

  const ts = tick.ts ?? payload.ts ?? Date.now();
  return [
    {
      pair: 'FLUXUSD',
      venue: 'htx',
      ts: typeof ts === 'number' || typeof ts === 'string' ? ts : Date.now(),
      price: String(price),
      side: null
    }
  ];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
