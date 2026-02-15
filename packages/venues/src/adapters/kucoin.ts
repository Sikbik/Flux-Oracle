import type { NormalizationInput } from '../types.js';
import { WebSocketVenueAdapter } from '../wsAdapter.js';

const WS_URL = 'wss://ws-api-spot.kucoin.com';
const BULLET_URL = 'https://api.kucoin.com/api/v1/bullet-public';

export class KuCoinAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'kucoin';

  readonly symbolMap = {
    FLUXUSD: 'FLUX-USDT'
  };

  private pingIntervalMs: number | null = null;

  private connectId = 0;

  private readonly fetcher: typeof fetch;

  constructor(options?: { fetcher?: typeof fetch }) {
    super(WS_URL);
    this.fetcher = options?.fetcher ?? fetch;
  }

  protected buildSubscribeMessages(venueSymbol: string): unknown[] {
    return [
      {
        id: Date.now().toString(),
        type: 'subscribe',
        topic: `/market/ticker:${venueSymbol}`,
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
    return [...parseKuCoinTradeMessage(payload), ...parseKuCoinTickerMessage(payload)];
  }

  protected override getPingIntervalMs(): number | null {
    return this.pingIntervalMs;
  }

  protected override buildPingMessage(): unknown | null {
    return {
      id: Date.now().toString(),
      type: 'ping'
    };
  }

  protected override async resolveWsUrl(): Promise<string> {
    const response = await this.fetcher(BULLET_URL, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`KuCoin bullet-public failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: {
        token?: string;
        instanceServers?: Array<{ endpoint?: string; pingInterval?: number }>;
      };
    };

    const token = payload.data?.token;
    const server = payload.data?.instanceServers?.[0];
    const endpoint = server?.endpoint;
    if (!token || !endpoint) {
      throw new Error('KuCoin bullet-public response missing token or endpoint');
    }

    if (server?.pingInterval !== undefined) {
      const interval =
        typeof server.pingInterval === 'number' ? server.pingInterval : Number(server.pingInterval);
      if (Number.isFinite(interval)) {
        this.pingIntervalMs = interval;
      }
    }

    this.connectId += 1;
    const url = new URL(endpoint);
    url.searchParams.set('token', token);
    url.searchParams.set('connectId', this.connectId.toString());
    return url.toString();
  }
}

export function parseKuCoinTradeMessage(payload: unknown): NormalizationInput[] {
  if (
    !isObject(payload) ||
    payload.type !== 'message' ||
    payload.subject !== 'trade.l3match' ||
    !isObject(payload.data)
  ) {
    return [];
  }

  const price = payload.data.price;
  if (price === undefined || price === null) {
    return [];
  }

  return [
    {
      pair: 'FLUXUSD',
      venue: 'kucoin',
      ts: resolveKuCoinTimestampMs(payload.data.time),
      price: String(price),
      size: payload.data.size !== undefined ? String(payload.data.size) : undefined,
      side: payload.data.side !== undefined ? String(payload.data.side) : null
    }
  ];
}

export function parseKuCoinTickerMessage(payload: unknown): NormalizationInput[] {
  if (
    !isObject(payload) ||
    payload.type !== 'message' ||
    payload.subject !== 'trade.ticker' ||
    !isObject(payload.data)
  ) {
    return [];
  }

  const price = payload.data.price;
  if (price === undefined || price === null) {
    return [];
  }

  return [
    {
      pair: 'FLUXUSD',
      venue: 'kucoin',
      ts: resolveKuCoinTimestampMs(payload.data.time ?? Date.now()),
      price: String(price),
      side: null
    }
  ];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolveKuCoinTimestampMs(value: unknown): number {
  const time = Number(value);
  if (!Number.isFinite(time)) {
    return 0;
  }

  if (time > 1_000_000_000_000_000) {
    return Math.floor(time / 1_000_000);
  }

  if (time > 1_000_000_000_000) {
    return time;
  }

  return time * 1000;
}
