import { describe, expect, it } from 'vitest';

import { minuteRange, toHourTs, toMinuteTs } from '../src/index.js';

describe('time helpers', () => {
  it('rounds to minute boundaries', () => {
    expect(toMinuteTs(59)).toBe(0);
    expect(toMinuteTs(60)).toBe(60);
    expect(toMinuteTs(119)).toBe(60);
  });

  it('rounds to hour boundaries', () => {
    expect(toHourTs(3599)).toBe(0);
    expect(toHourTs(3600)).toBe(3600);
    expect(toHourTs(7199)).toBe(3600);
  });

  it('returns an ordered hour minute range', () => {
    const values = minuteRange(3661);
    expect(values).toHaveLength(60);
    expect(values[0]).toBe(3600);
    expect(values[59]).toBe(7140);

    for (let index = 1; index < values.length; index += 1) {
      expect(values[index] - values[index - 1]).toBe(60);
    }
  });
});
