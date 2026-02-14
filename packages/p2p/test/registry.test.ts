import { describe, expect, it } from 'vitest';

import {
  buildSignatureBitmap,
  computeReporterSetId,
  getReporterSetInfo,
  hasQuorum
} from '../src/index.js';

describe('reporter registry', () => {
  const registry = {
    version: 'v1',
    threshold: 2,
    reporters: [
      {
        id: 'reporter-b',
        publicKey: '5d82640769476f4a46ee6ae33f8b0e3ba3a53fe5b6f6aedf3b4d110296da062b'
      },
      {
        id: 'reporter-a',
        publicKey: 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a'
      },
      {
        id: 'reporter-c',
        publicKey: '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c'
      }
    ]
  };

  it('computes stable reporter_set_id independent of ordering', () => {
    const id = computeReporterSetId(registry);

    expect(id).toBe('10cfbdeb8a00d54569265490e126a196dc940bd2e52224fe9b868d0ac2702fb3');

    const reordered = {
      ...registry,
      reporters: [registry.reporters[2], registry.reporters[0], registry.reporters[1]]
    };

    expect(computeReporterSetId(reordered)).toBe(id);
  });

  it('exposes quorum metadata and threshold enforcement', () => {
    const info = getReporterSetInfo(registry);
    expect(info).toMatchObject({
      quorumSize: 3,
      threshold: 2
    });

    expect(
      hasQuorum(registry, {
        'reporter-a': 'sig-a',
        'reporter-b': 'sig-b'
      })
    ).toBe(true);

    expect(
      hasQuorum(registry, {
        'reporter-a': 'sig-a'
      })
    ).toBe(false);

    expect(
      hasQuorum(registry, {
        unknown: 'sig-unknown',
        'reporter-a': 'sig-a'
      })
    ).toBe(false);
  });

  it('builds signature bitmap based on registry ordering', () => {
    const bitmap = buildSignatureBitmap(registry, {
      'reporter-b': 'sig-b',
      'reporter-c': 'sig-c'
    });

    expect(bitmap).toBe(0b110);
  });
});
