import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  normalizeRawTick,
  parseBinanceTradeMessage,
  parseCryptoComTradeMessage,
  parseGateTradeMessage,
  parseKrakenTradeMessage,
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
});
