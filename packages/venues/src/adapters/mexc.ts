import { BaseVenueAdapter } from '../adapter.js';
import { normalizeRawTick } from '../normalize.js';
import type { NormalizationInput } from '../types.js';

const REST_URL = 'https://api.mexc.com/api/v3/ticker/price';

export class MexcAdapter extends BaseVenueAdapter {
  readonly venueId = 'mexc';

  readonly symbolMap = {
    FLUXUSD: 'FLUXUSDT'
  };

  private pollTimer: NodeJS.Timeout | undefined;

  private readonly pollIntervalMs: number;

  private readonly fetcher: typeof fetch;

  private pollInFlight = false;

  private currentPair: string | null = null;

  private venueSymbol: string | null = null;

  constructor(options?: { pollIntervalMs?: number; fetcher?: typeof fetch }) {
    super();
    this.pollIntervalMs = options?.pollIntervalMs ?? 5000;
    this.fetcher = options?.fetcher ?? fetch;
  }

  async connect(): Promise<void> {
    // REST polling has no persistent connection.
  }

  async disconnect(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  async subscribe(pair: string): Promise<void> {
    this.currentPair = pair;
    this.venueSymbol = this.mapPairToVenueSymbol(pair);

    if (!this.pollTimer) {
      this.pollTimer = setInterval(() => {
        void this.pollOnce().catch((error) => {
          this.emit('error', error);
        });
      }, this.pollIntervalMs);
    }

    void this.pollOnce().catch((error) => {
      this.emit('error', error);
    });
  }

  private mapPairToVenueSymbol(pair: string): string {
    const symbol = this.symbolMap[pair as keyof typeof this.symbolMap];
    if (!symbol) {
      throw new Error(`unsupported pair for MEXC: ${pair}`);
    }
    return symbol;
  }

  private async pollOnce(): Promise<void> {
    if (!this.currentPair || !this.venueSymbol || this.pollInFlight) {
      return;
    }

    this.pollInFlight = true;
    try {
      const response = await this.fetcher(
        `${REST_URL}?symbol=${encodeURIComponent(this.venueSymbol)}`
      );
      if (!response.ok) {
        throw new Error(`MEXC ticker failed: ${response.status}`);
      }

      const payload = (await response.json()) as { price?: string | number };
      const price = payload.price;
      if (price === undefined) {
        throw new Error('MEXC ticker response missing price');
      }

      this.emitTick(
        normalizeRawTick({
          pair: this.currentPair,
          venue: this.venueId,
          ts: Date.now(),
          price,
          side: null
        })
      );
    } finally {
      this.pollInFlight = false;
    }
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
