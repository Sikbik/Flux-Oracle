import { describe, expect, it } from 'vitest';

import { buildMerkleRoot } from '../src/index.js';

describe('merkle root', () => {
  it('matches fixture root for known leaves', () => {
    const leaves = [
      '1111111111111111111111111111111111111111111111111111111111111111',
      '2222222222222222222222222222222222222222222222222222222222222222',
      '3333333333333333333333333333333333333333333333333333333333333333'
    ];

    expect(buildMerkleRoot(leaves)).toBe(
      'e046522f24b39f1a9a2cf96bebcd386df477f282d7ac9b61d0ca59d8fe8f81b6'
    );
  });

  it('changes when any leaf changes', () => {
    const a = buildMerkleRoot([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    ]);

    const b = buildMerkleRoot([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'
    ]);

    expect(a).not.toBe(b);
  });
});
