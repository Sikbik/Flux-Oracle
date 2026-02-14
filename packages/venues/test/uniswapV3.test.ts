import { describe, expect, it } from 'vitest';

import {
  UniswapV3Adapter,
  buildUniswapV3AdapterFromEnv,
  fetchUniswapV3PoolPrice
} from '../src/index.js';

function buildFetchResponse(payload: unknown, ok = true): Response {
  return new Response(JSON.stringify(payload), {
    status: ok ? 200 : 500,
    headers: { 'content-type': 'application/json' }
  });
}

describe('uniswap v3 adapter', () => {
  it('fetches pool price from graph response', async () => {
    const fetchImpl = async () =>
      buildFetchResponse({
        data: {
          pool: {
            token0Price: '0.1234',
            token1Price: '8.5'
          }
        }
      });

    const price = await fetchUniswapV3PoolPrice(
      'https://graph.example',
      '0xpool',
      'token1Price',
      fetchImpl as typeof fetch
    );

    expect(price).toBe('8.5');
  });

  it('emits normalized ticks on subscribe', async () => {
    const fetchImpl = async () =>
      buildFetchResponse({
        data: {
          pool: {
            token0Price: '1.2345',
            token1Price: '0.81'
          }
        }
      });

    const adapter = new UniswapV3Adapter({
      graphUrl: 'https://graph.example',
      poolId: '0xpool',
      pair: 'FLUXUSD',
      priceField: 'token0Price',
      pollIntervalMs: 10_000,
      fetchImpl: fetchImpl as typeof fetch
    });

    const tickPromise = new Promise<{ venue: string; pair: string; price: string }>((resolve) => {
      adapter.once('tick', (tick) => resolve(tick));
    });

    await adapter.connect();
    await adapter.subscribe('FLUXUSD');

    const tick = await tickPromise;
    expect(tick).toMatchObject({
      venue: 'uniswap_v3_base',
      pair: 'FLUXUSD',
      price: '123450000'
    });

    await adapter.disconnect();
  });

  it('requires graph + pool env vars', () => {
    expect(() => buildUniswapV3AdapterFromEnv({})).toThrow(
      'FPHO_UNISWAP_V3_GRAPH_URL and FPHO_UNISWAP_V3_POOL_ID are required'
    );
  });
});
