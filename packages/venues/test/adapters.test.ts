import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  CryptoComAdapter,
  MexcAdapter,
  normalizeRawTick,
  parseBinanceTickerMessage,
  parseBinanceTradeMessage,
  parseCoinExTradeMessage,
  parseCryptoComTickerMessage,
  parseCryptoComTradeMessage,
  parseGateTickerMessage,
  parseGateTradeMessage,
  parseHtxTickerMessage,
  parseHtxTradeMessage,
  parseKrakenTickerMessage,
  parseKrakenTradeMessage,
  parseKuCoinTickerMessage,
  parseKuCoinTradeMessage,
  parseMexcTradeMessage
} from '../src/index.js';

function loadFixture(name: string): unknown {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

describe('adapter parsers', () => {
  it('parses binance trade fixture', () => {
    const ticks = parseBinanceTradeMessage(loadFixture('binance-trade.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'binance',
      pair: 'FLUXUSD',
      price: '62890000',
      side: 'buy'
    });
  });

  it('parses binance ticker message', () => {
    const ticks = parseBinanceTickerMessage({
      e: '24hrMiniTicker',
      E: 1707350467000,
      s: 'FLUXUSDT',
      c: '0.6289'
    });
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'binance',
      pair: 'FLUXUSD',
      price: '62890000'
    });
  });

  it('parses kraken trade fixture', () => {
    const ticks = parseKrakenTradeMessage(loadFixture('kraken-trade.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'kraken',
      pair: 'FLUXUSD',
      price: '62890000',
      side: 'buy'
    });
  });

  it('parses kraken ticker message', () => {
    const ticks = parseKrakenTickerMessage([1, { c: ['0.6289', '1.0'] }, 'ticker', 'FLUX/USD']);
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'kraken',
      pair: 'FLUXUSD',
      price: '62890000'
    });
  });

  it('parses gate trade fixture', () => {
    const ticks = parseGateTradeMessage(loadFixture('gate-trade.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'gate',
      pair: 'FLUXUSD',
      price: '62890000',
      side: 'buy'
    });
  });

  it('parses gate ticker message', () => {
    const ticks = parseGateTickerMessage({
      channel: 'spot.tickers',
      result: { last: '0.6289', time_ms: 1707350467000 }
    });
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'gate',
      pair: 'FLUXUSD',
      price: '62890000'
    });
  });

  it('parses kucoin trade fixture', () => {
    const ticks = parseKuCoinTradeMessage(loadFixture('kucoin-trade.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'kucoin',
      pair: 'FLUXUSD',
      price: '62890000',
      side: 'buy'
    });
  });

  it('parses kucoin ticker message', () => {
    const ticks = parseKuCoinTickerMessage({
      type: 'message',
      subject: 'trade.ticker',
      topic: '/market/ticker:FLUX-USDT',
      data: { price: '0.6289', time: 1707350467000 }
    });
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'kucoin',
      pair: 'FLUXUSD',
      price: '62890000'
    });
  });

  it('parses mexc trade fixture', () => {
    const ticks = parseMexcTradeMessage(loadFixture('mexc-trade.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'mexc',
      pair: 'FLUXUSD',
      price: '62890000',
      side: 'sell'
    });
  });

  it('polls mexc rest ticker', async () => {
    const fetcher = (async () => ({
      ok: true,
      json: async () => ({ price: '0.6289' })
    })) as typeof fetch;

    const adapter = new MexcAdapter({ fetcher, pollIntervalMs: 60_000 });
    const tickPromise = new Promise((resolve) => adapter.once('tick', resolve));

    await adapter.connect();
    await adapter.subscribe('FLUXUSD');

    const tick = (await tickPromise) as { venue: string; pair: string; price: string };
    expect(tick).toMatchObject({
      venue: 'mexc',
      pair: 'FLUXUSD',
      price: '62890000'
    });

    await adapter.disconnect();
  });

  it('parses crypto.com trade fixture', () => {
    const ticks = parseCryptoComTradeMessage(loadFixture('cryptocom-trade.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'crypto_com',
      pair: 'FLUXUSD',
      price: '62890000',
      side: 'buy'
    });
  });

  it('parses crypto.com ticker message', () => {
    const ticks = parseCryptoComTickerMessage({
      id: 22,
      method: 'subscribe',
      code: 0,
      result: {
        data: [
          {
            i: 'FLUX_USDT',
            c: '0.6288',
            k: '0.6294',
            a: '0.6290',
            b: '0.6285',
            t: 1707350467000
          }
        ]
      }
    });
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'crypto_com',
      pair: 'FLUXUSD',
      price: '62940000'
    });
  });

  it('parses coinex trade fixture', () => {
    const ticks = parseCoinExTradeMessage(loadFixture('coinex-trade.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'coinex',
      pair: 'FLUXUSD',
      price: '62890000'
    });
  });

  it('parses htx trade fixture', () => {
    const ticks = parseHtxTradeMessage(loadFixture('htx-trade.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'htx',
      pair: 'FLUXUSD',
      price: '62890000',
      side: 'buy'
    });
  });

  it('parses htx ticker message', () => {
    const ticks = parseHtxTickerMessage(loadFixture('htx-ticker.json'));
    expect(ticks).toHaveLength(1);
    expect(normalizeRawTick(ticks[0])).toMatchObject({
      venue: 'htx',
      pair: 'FLUXUSD',
      price: '62910000'
    });
  });

  it('responds to crypto.com heartbeat frames', () => {
    class TestAdapter extends CryptoComAdapter {
      sent: unknown[] = [];

      public handle(payload: unknown): boolean {
        return this.handleControlMessage(payload);
      }

      protected override sendMessage(message: unknown): void {
        this.sent.push(message);
      }
    }

    const adapter = new TestAdapter();
    const handled = adapter.handle({ id: 42, method: 'public/heartbeat' });

    expect(handled).toBe(true);
    expect(adapter.sent).toEqual([{ id: 42, method: 'public/respond-heartbeat' }]);
  });
});
