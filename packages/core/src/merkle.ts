import { sha256 } from './hash.js';

const EMPTY_HASH = sha256(new Uint8Array());

const HEX_32_BYTE = /^[0-9a-f]{64}$/;

export function buildMerkleRoot(leaves: readonly string[]): string {
  if (leaves.length === 0) {
    return EMPTY_HASH;
  }

  let level = leaves.map(normalizeHashHex);

  while (level.length > 1) {
    const nextLevel: string[] = [];

    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      if (!left) {
        throw new Error('unexpected empty merkle level');
      }
      const right = level[index + 1] ?? left;
      const combined = concatHex(left, right);
      nextLevel.push(sha256(combined));
    }

    level = nextLevel;
  }

  const root = level[0];
  if (!root) {
    throw new Error('missing merkle root');
  }

  return root;
}

function normalizeHashHex(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!HEX_32_BYTE.test(normalized)) {
    throw new Error(`invalid 32-byte hex hash: ${value}`);
  }
  return normalized;
}

function concatHex(left: string, right: string): Uint8Array {
  const leftBytes = Buffer.from(left, 'hex');
  const rightBytes = Buffer.from(right, 'hex');
  return Buffer.concat([leftBytes, rightBytes]);
}
