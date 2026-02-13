const encoder = new TextEncoder();

export type CanonicalJson =
  | null
  | string
  | boolean
  | CanonicalJson[]
  | { [key: string]: CanonicalJson };

export class CanonicalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanonicalizationError';
  }
}

export function canonicalizeJson(value: CanonicalJson): string {
  return canonicalizeValue(value);
}

export function canonicalizeJsonToBytes(value: CanonicalJson): Uint8Array {
  return encoder.encode(canonicalizeJson(value));
}

function canonicalizeValue(value: CanonicalJson): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalizeValue(item)).join(',');
    return `[${items}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    const sorted = entries.sort(([a], [b]) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    });
    const members = sorted.map(
      ([key, memberValue]) => `${JSON.stringify(key)}:${canonicalizeValue(memberValue)}`
    );
    return `{${members.join(',')}}`;
  }

  throw new CanonicalizationError(`unsupported JSON type: ${typeof value}`);
}

export function assertNoNumbers(value: unknown, path = '$'): void {
  if (value === null) {
    return;
  }

  if (typeof value === 'number') {
    throw new CanonicalizationError(`numeric JSON values are forbidden at ${path}`);
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      assertNoNumbers(value[index], `${path}[${index}]`);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      assertNoNumbers(nested, `${path}.${key}`);
    }
    return;
  }

  throw new CanonicalizationError(`unsupported JSON value at ${path}`);
}
