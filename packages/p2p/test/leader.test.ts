import { describe, expect, it } from 'vitest';

import { electLeader } from '../src/index.js';

describe('leader election', () => {
  it('selects a stable leader for the same inputs', () => {
    const reporterIds = ['reporter-b', 'reporter-a', 'reporter-c'];
    const first = electLeader(reporterIds, 'set-1', 1707346800);
    const second = electLeader([...reporterIds].reverse(), 'set-1', 1707346800);

    expect(first).toBe(second);
    expect(first).toBe('reporter-c');
  });
});
