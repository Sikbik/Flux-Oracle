const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 3600;

export function toMinuteTs(tsSeconds: number): number {
  return Math.floor(tsSeconds / MINUTE_SECONDS) * MINUTE_SECONDS;
}

export function toHourTs(tsSeconds: number): number {
  return Math.floor(tsSeconds / HOUR_SECONDS) * HOUR_SECONDS;
}

export function toWindowTs(tsSeconds: number, windowSeconds: number): number {
  if (
    !Number.isFinite(windowSeconds) ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds <= 0 ||
    windowSeconds % MINUTE_SECONDS !== 0
  ) {
    throw new Error(`windowSeconds must be a positive multiple of ${MINUTE_SECONDS}`);
  }

  return Math.floor(tsSeconds / windowSeconds) * windowSeconds;
}

export function minuteRange(hourTs: number): number[] {
  const start = toHourTs(hourTs);
  return Array.from({ length: 60 }, (_, index) => start + index * MINUTE_SECONDS);
}

export function minuteRangeWindow(windowTs: number, windowSeconds: number): number[] {
  const start = toWindowTs(windowTs, windowSeconds);
  const minutes = windowSeconds / MINUTE_SECONDS;

  return Array.from({ length: minutes }, (_, index) => start + index * MINUTE_SECONDS);
}
