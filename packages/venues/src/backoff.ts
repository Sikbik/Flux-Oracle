export interface BackoffOptions {
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
}

export class ExponentialBackoff {
  private attempts = 0;

  private readonly initialDelayMs: number;

  private readonly maxDelayMs: number;

  private readonly factor: number;

  constructor(options: BackoffOptions = {}) {
    this.initialDelayMs = options.initialDelayMs ?? 500;
    this.maxDelayMs = options.maxDelayMs ?? 30_000;
    this.factor = options.factor ?? 2;
  }

  nextDelayMs(): number {
    const delay = Math.min(this.initialDelayMs * this.factor ** this.attempts, this.maxDelayMs);
    this.attempts += 1;
    return delay;
  }

  reset(): void {
    this.attempts = 0;
  }
}

export function scheduleReconnect(
  backoff: ExponentialBackoff,
  callback: () => void
): NodeJS.Timeout {
  const delay = backoff.nextDelayMs();
  return setTimeout(callback, delay);
}
