import { BaseVenueAdapter } from '../adapter.js';
import { normalizeRawTick } from '../normalize.js';
import type { NormalizationInput } from '../types.js';

const DEFAULT_POLL_INTERVAL_MS = 15_000;

export type UniswapV3PriceField = 'token0Price' | 'token1Price';

export interface UniswapV3AdapterOptions {
  graphUrl: string;
  poolId: string;
  pair: string;
  priceField?: UniswapV3PriceField;
  pollIntervalMs?: number;
  fetchImpl?: typeof fetch;
}

export class UniswapV3Adapter extends BaseVenueAdapter {
  readonly venueId = 'uniswap_v3_base';
  readonly symbolMap: Readonly<Record<string, string>>;

  private readonly graphUrl: string;
  private readonly poolId: string;
  private readonly pair: string;
  private readonly priceField: UniswapV3PriceField;
  private readonly pollIntervalMs: number;
  private readonly fetchImpl: typeof fetch;

  private pollTimer: NodeJS.Timeout | null = null;
  private activePair: string | null = null;

  constructor(options: UniswapV3AdapterOptions) {
    super();

    if (!options.graphUrl) {
      throw new Error('uniswap v3 adapter requires graphUrl');
    }
    if (!options.poolId) {
      throw new Error('uniswap v3 adapter requires poolId');
    }

    this.graphUrl = options.graphUrl;
    this.poolId = options.poolId.toLowerCase();
    this.pair = options.pair;
    this.priceField = options.priceField ?? 'token1Price';
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.symbolMap = {
      [options.pair]: this.poolId
    };
  }

  async connect(): Promise<void> {
    // No-op: polling starts on subscribe.
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
  }

  async subscribe(pair: string): Promise<void> {
    const poolId = this.symbolMap[pair];
    if (!poolId) {
      throw new Error(`unsupported pair for Uniswap v3: ${pair}`);
    }

    this.activePair = pair;
    await this.startPolling();
  }

  private async startPolling(): Promise<void> {
    if (this.pollTimer) {
      return;
    }

    await this.pollOnce();

    this.pollTimer = setInterval(() => {
      void this.pollOnce();
    }, this.pollIntervalMs);
  }

  private stopPolling(): void {
    if (!this.pollTimer) {
      return;
    }

    clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  private async pollOnce(): Promise<void> {
    if (!this.activePair) {
      return;
    }

    try {
      const price = await fetchUniswapV3PoolPrice(
        this.graphUrl,
        this.poolId,
        this.priceField,
        this.fetchImpl
      );

      const tick = normalizeRawTick({
        pair: this.activePair,
        venue: this.venueId,
        ts: Date.now(),
        price
      } satisfies NormalizationInput);

      this.emitTick(tick);
    } catch {
      // Ignore polling errors to avoid crashing the ingestor.
    }
  }
}

export function buildUniswapV3AdapterFromEnv(
  env: NodeJS.ProcessEnv = process.env
): UniswapV3Adapter {
  const graphUrl = env.FPHO_UNISWAP_V3_GRAPH_URL;
  const poolId = env.FPHO_UNISWAP_V3_POOL_ID;
  const pair = env.FPHO_UNISWAP_V3_PAIR ?? 'FLUXUSD';
  const priceField = env.FPHO_UNISWAP_V3_PRICE_FIELD as UniswapV3PriceField | undefined;
  const pollIntervalMs = parsePositiveInt(env.FPHO_UNISWAP_V3_POLL_INTERVAL_MS);

  if (!graphUrl || !poolId) {
    throw new Error('FPHO_UNISWAP_V3_GRAPH_URL and FPHO_UNISWAP_V3_POOL_ID are required');
  }

  return new UniswapV3Adapter({
    graphUrl,
    poolId,
    pair,
    priceField,
    pollIntervalMs
  });
}

export async function fetchUniswapV3PoolPrice(
  graphUrl: string,
  poolId: string,
  priceField: UniswapV3PriceField,
  fetchImpl: typeof fetch
): Promise<string> {
  const query = `query ($poolId: ID!) { pool(id: $poolId) { token0Price token1Price } }`;

  const response = await fetchImpl(graphUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: {
        poolId: poolId.toLowerCase()
      }
    })
  });

  if (!response.ok) {
    throw new Error(`uniswap v3 graph request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    data?: { pool?: Record<string, unknown> | null };
    errors?: Array<{ message: string }>;
  };

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0]?.message ?? 'uniswap v3 graph error');
  }

  const pool = payload.data?.pool;
  if (!pool || typeof pool !== 'object') {
    throw new Error('uniswap v3 pool not found');
  }

  const priceValue = pool[priceField];
  if (typeof priceValue !== 'string') {
    throw new Error(`uniswap v3 ${priceField} is missing or invalid`);
  }

  return priceValue;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`invalid positive integer value: ${value}`);
  }

  return parsed;
}
