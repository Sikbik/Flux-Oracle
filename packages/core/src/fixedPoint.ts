const SCALE_FACTOR = 100000000n;
const MAX_I64 = 9223372036854775807n;
const MIN_I64 = -9223372036854775808n;

const DECIMAL_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/;

export class FixedPointError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FixedPointError';
  }
}

export function fixedPointScale(): bigint {
  return SCALE_FACTOR;
}

export function parseDecimalToFixed(value: string): string {
  const normalized = value.trim();
  const match = DECIMAL_PATTERN.exec(normalized);

  if (!match) {
    throw new FixedPointError(`invalid decimal value: ${value}`);
  }

  const sign = match[1] === '-' ? -1n : 1n;
  const wholePart = match[2] ?? '0';
  const fracRaw = match[3] ?? '';

  if (fracRaw.length > 8) {
    throw new FixedPointError(`too many fractional digits: ${value}`);
  }

  const fracPadded = (fracRaw + '00000000').slice(0, 8);
  const whole = BigInt(wholePart);
  const fraction = BigInt(fracPadded);
  const scaled = sign * (whole * SCALE_FACTOR + fraction);

  assertI64Bounds(scaled);
  return scaled.toString();
}

export function formatFixedToDecimal(fixed: string): string {
  const normalized = fixed.trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new FixedPointError(`invalid fixed-point integer: ${fixed}`);
  }

  const value = BigInt(normalized);
  assertI64Bounds(value);

  const abs = value < 0n ? -value : value;
  const whole = abs / SCALE_FACTOR;
  const fraction = (abs % SCALE_FACTOR).toString().padStart(8, '0');
  const prefix = value < 0n ? '-' : '';

  return `${prefix}${whole.toString()}.${fraction}`;
}

function assertI64Bounds(value: bigint): void {
  if (value > MAX_I64 || value < MIN_I64) {
    throw new FixedPointError(`value exceeds int64 bounds: ${value.toString()}`);
  }
}
