import { describe, expect, it, vi } from 'vitest';

import { ExponentialBackoff, scheduleReconnect } from '../src/index.js';

describe('reconnect backoff', () => {
  it('increases delay exponentially and resets', () => {
    const backoff = new ExponentialBackoff({
      initialDelayMs: 100,
      maxDelayMs: 1000,
      factor: 2
    });

    expect(backoff.nextDelayMs()).toBe(100);
    expect(backoff.nextDelayMs()).toBe(200);
    expect(backoff.nextDelayMs()).toBe(400);
    expect(backoff.nextDelayMs()).toBe(800);
    expect(backoff.nextDelayMs()).toBe(1000);

    backoff.reset();
    expect(backoff.nextDelayMs()).toBe(100);
  });

  it('schedules callbacks using fake timers', () => {
    vi.useFakeTimers();
    const backoff = new ExponentialBackoff({ initialDelayMs: 50 });
    const callback = vi.fn();

    const timer = scheduleReconnect(backoff, callback);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(49);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    clearTimeout(timer);
    vi.useRealTimers();
  });
});
