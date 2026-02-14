import { describe, expect, it } from 'vitest';

import { WebSocketVenueAdapter } from '../src/wsAdapter.js';
import type { NormalizationInput, NormalizedTick } from '../src/types.js';

function handleSocketMessage(adapter: WebSocketVenueAdapter, raw: string): void {
  const handler = (adapter as unknown as { handleSocketMessage: (raw: string) => void })
    .handleSocketMessage;
  handler.call(adapter, raw);
}

class TestAdapter extends WebSocketVenueAdapter {
  readonly venueId = 'test';
  readonly symbolMap = { FLUXUSD: 'FLUXUSD' } as const;

  constructor(private readonly parseImpl: (payload: unknown) => NormalizationInput[]) {
    super('wss://example.invalid');
  }

  protected buildSubscribeMessages(): unknown[] {
    return [];
  }

  protected mapPairToVenueSymbol(pair: string): string {
    return pair;
  }

  protected parseMessage(payload: unknown): NormalizationInput[] {
    return this.parseImpl(payload);
  }
}

describe('WebSocketVenueAdapter', () => {
  it('emits error when parseMessage throws without crashing', () => {
    const adapter = new TestAdapter(() => {
      throw new Error('boom');
    });

    const errors: Error[] = [];
    const ticks: NormalizedTick[] = [];
    adapter.on('error', (error: Error) => errors.push(error));
    adapter.on('tick', (tick: NormalizedTick) => ticks.push(tick));

    expect(() => handleSocketMessage(adapter, '{"hello":"world"}')).not.toThrow();
    expect(errors).toHaveLength(1);
    expect(ticks).toHaveLength(0);
  });

  it('skips invalid ticks but still emits valid ticks', () => {
    const adapter = new TestAdapter(() => [
      { venue: 'test', pair: 'FLUXUSD', ts: 1707350467, price: 'not-a-number' },
      { venue: 'test', pair: 'FLUXUSD', ts: 1707350467, price: '0.1' }
    ]);

    const errors: Error[] = [];
    const ticks: NormalizedTick[] = [];
    adapter.on('error', (error: Error) => errors.push(error));
    adapter.on('tick', (tick: NormalizedTick) => ticks.push(tick));

    expect(() => handleSocketMessage(adapter, '{"type":"tick"}')).not.toThrow();
    expect(errors).toHaveLength(1);
    expect(ticks).toHaveLength(1);
    expect(ticks[0]).toMatchObject({ venue: 'test', pair: 'FLUXUSD', price: '10000000' });
  });
});
