import { describe, expect, it } from 'vitest';

import {
  FixedPointError,
  fixedPointScale,
  formatFixedToDecimal,
  parseDecimalToFixed
} from '../src/index.js';

describe('fixed-point helpers', () => {
  it('uses 1e8 scale', () => {
    expect(fixedPointScale()).toBe(100000000n);
  });

  it('round-trips decimal values', () => {
    const samples = ['0', '1', '1.2', '0.00000001', '1234.56789', '-42.50000000'];

    for (const sample of samples) {
      const fixed = parseDecimalToFixed(sample);
      const decimal = formatFixedToDecimal(fixed);
      expect(parseDecimalToFixed(decimal)).toBe(fixed);
    }
  });

  it('parses and formats deterministically', () => {
    expect(parseDecimalToFixed('0.62890000')).toBe('62890000');
    expect(parseDecimalToFixed('-0.1')).toBe('-10000000');
    expect(formatFixedToDecimal('62890000')).toBe('0.62890000');
    expect(formatFixedToDecimal('-10000000')).toBe('-0.10000000');
  });

  it('rejects invalid decimals and overflow values', () => {
    expect(() => parseDecimalToFixed('not-a-number')).toThrow(FixedPointError);
    expect(() => parseDecimalToFixed('1.123456789')).toThrow(FixedPointError);
    expect(() => parseDecimalToFixed('92233720369.00000000')).toThrow(FixedPointError);
    expect(() => parseDecimalToFixed('-92233720369.00000000')).toThrow(FixedPointError);
  });
});
