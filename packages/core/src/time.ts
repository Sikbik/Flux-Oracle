const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 3600;

export function toMinuteTs(tsSeconds: number): number {
  return Math.floor(tsSeconds / MINUTE_SECONDS) * MINUTE_SECONDS;
}

export function toHourTs(tsSeconds: number): number {
  return Math.floor(tsSeconds / HOUR_SECONDS) * HOUR_SECONDS;
}

export function minuteRange(hourTs: number): number[] {
  const start = toHourTs(hourTs);
  return Array.from({ length: 60 }, (_, index) => start + index * MINUTE_SECONDS);
}
