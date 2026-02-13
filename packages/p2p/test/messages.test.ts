import { describe, expect, it } from 'vitest';

import { ReplayProtector, validateP2PMessage } from '../src/index.js';

const message = {
  type: 'SIG',
  reporterSetId: 'set-1',
  hourTs: 1707346800,
  reporterId: 'reporter-a',
  nonce: 'nonce-1',
  sentAt: 1707346860,
  reportHash: 'abc123',
  signature: 'sig'
} as const;

describe('p2p message validation and replay protection', () => {
  it('validates message schema', () => {
    expect(validateP2PMessage(message)).toBe(true);
    expect(validateP2PMessage({ ...message, type: 'BAD' })).toBe(false);
  });

  it('rejects replayed messages and expires cache by ttl', () => {
    const replay = new ReplayProtector(1000);

    expect(replay.accept(message, 0)).toBe(true);
    expect(replay.accept(message, 100)).toBe(false);
    expect(replay.accept(message, 1200)).toBe(true);
  });
});
