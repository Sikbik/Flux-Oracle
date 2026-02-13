import { describe, expect, it } from 'vitest';

import { hasQuorum } from '@fpho/p2p';

import {
  buildSimulationRegistry,
  DEFAULT_SIM_REPORTER_KEYS,
  simulateQuorumRound
} from '../src/index.js';

describe('quorum simulation', () => {
  it('builds a deterministic registry from simulation keys', async () => {
    const registry = await buildSimulationRegistry({
      ...DEFAULT_SIM_REPORTER_KEYS
    });

    expect(registry.reporters.map((entry) => entry.id)).toEqual([
      'reporter-1',
      'reporter-2',
      'reporter-3'
    ]);
    expect(registry.threshold).toBe(2);
  });

  it('produces FINAL message with quorum signatures', async () => {
    const result = await simulateQuorumRound({
      hourTs: 1707346800,
      reportHash: 'b'.repeat(64)
    });

    expect(result.finalMessage.type).toBe('FINAL');
    expect(result.finalMessage.reportHash).toBe('b'.repeat(64));
    expect(result.finalMessage.reporterId).toBe(result.leaderId);
    expect(
      hasQuorum(
        await buildSimulationRegistry({ ...DEFAULT_SIM_REPORTER_KEYS }),
        result.finalMessage.signatures
      )
    ).toBe(true);
  });
});
