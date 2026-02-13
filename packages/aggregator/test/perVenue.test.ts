import { describe, expect, it } from 'vitest';

import { lastTradeInMinute } from '../src/index.js';

describe('per-venue minute materialization', () => {
  it('picks last trade in minute and includes tick count', () => {
    const result = lastTradeInMinute('binance', [
      { id: 1, venue: 'binance', ts: 1707350461, price_fp: '62880000' },
      { id: 2, venue: 'binance', ts: 1707350465, price_fp: '62890000' },
      { id: 3, venue: 'binance', ts: 1707350465, price_fp: '62900000' }
    ]);

    expect(result).toEqual({
      venue: 'binance',
      priceFp: '62900000',
      tickCount: 3
    });
  });
});
