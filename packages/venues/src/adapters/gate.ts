import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://api.gateio.ws/ws/v4/';

export class GateAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'gate';

  readonly symbolMap = {
    FLUXUSD: 'FLUX_USDT'
  };

  constructor() {
    super(WS_URL);
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    return [
      {
        time: Math.floor(Date.now() / 1000),
        channel: 'spot.trades',
        event: 'subscribe',
        payload: [venueSymbol]
      },
      {
        time: Math.floor(Date.now() / 1000),
        channel: 'spot.tickers',
        event: 'subscribe',
        payload: [venueSymbol]
      }
    ];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for Gate: ${pair}`);
    }
    return symbol;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return [...parseGateTradeMessage(payload), ...parseGateTickerMessage(payload)];
  }
}

export function parseGateTradeMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || payload.channel !== 'spot.trades') {
    return [];
  }

  const result = Array.isArray(payload.result) ? payload.result : [];
  return result
    .filter((entry) => isObject(entry))
    .map((entry) => ({
      pair: 'FLUXUSD',
      venue: 'gate',
      ts:
        typeof entry.create_time_ms === 'string' || typeof entry.create_time_ms === 'number'
          ? entry.create_time_ms
          : typeof entry.create_time === 'number'
            ? entry.create_time
            : 0,
      price: String(entry.price),
      size: String(entry.amount),
      side: String(entry.side)
    }));
}

export function parseGateTickerMessage(payload: unknown): NormalizationInput[] {
  if (!isObject(payload) || payload.channel !== 'spot.tickers') {
    return [];
  }

  const result = Array.isArray(payload.result)
    ? payload.result
    : payload.result
      ? [payload.result]
      : [];

  return result
    .filter((entry) => isObject(entry))
    .flatMap((entry) => {
      const price =
        entry.last ?? entry.last_price ?? entry.close ?? entry.price ?? entry.price_last;
      if (price === undefined || price === null) {
        return [];
      }

      return [
        {
          pair: 'FLUXUSD',
          venue: 'gate',
          ts:
            typeof entry.time_ms === 'number' || typeof entry.time_ms === 'string'
              ? entry.time_ms
              : typeof entry.time === 'number'
                ? entry.time * 1000
                : typeof entry.timestamp === 'number'
                  ? entry.timestamp * 1000
                  : Date.now(),
          price: String(price),
          side: null
        }
      ];
    });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
