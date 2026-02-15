import { describe, expect, it } from 'vitest';

import {
  decodeOpReturnPayload,
  encodeOpReturnPayload,
  OpReturnCodecError,
  payloadSizeBytes
} from '../src/index.js';

describe('op_return payload codec', () => {
  it('round-trips payloads and stays under target size', () => {
    const encoded = encodeOpReturnPayload({
      pairId: 1,
      hourTs: 1707346800,
      closeFp: '62910000',
      reportHash: '12250056bae9dfd7d3dd0071b9b0be8daf7158ee633617aed4e7cf755171043b',
      sigBitmap: 7
    });

    expect(payloadSizeBytes()).toBeLessThanOrEqual(80);
    expect(encoded.length).toBe(payloadSizeBytes());

    expect(decodeOpReturnPayload(encoded)).toEqual({
      version: 1,
      pairId: 1,
      hourTs: 1707346800,
      closeFp: '62910000',
      reportHash: '12250056bae9dfd7d3dd0071b9b0be8daf7158ee633617aed4e7cf755171043b',
      sigBitmap: 7
    });
  });

  it('supports version 2 payloads with explicit windowSeconds', () => {
    const encoded = encodeOpReturnPayload({
      version: 2,
      pairId: 1,
      hourTs: 1707346800,
      windowSeconds: 600,
      closeFp: '62910000',
      reportHash: '12250056bae9dfd7d3dd0071b9b0be8daf7158ee633617aed4e7cf755171043b',
      sigBitmap: 7
    });

    expect(payloadSizeBytes(2)).toBeLessThanOrEqual(80);
    expect(encoded.length).toBe(payloadSizeBytes(2));

    expect(decodeOpReturnPayload(encoded)).toEqual({
      version: 2,
      pairId: 1,
      hourTs: 1707346800,
      windowSeconds: 600,
      closeFp: '62910000',
      reportHash: '12250056bae9dfd7d3dd0071b9b0be8daf7158ee633617aed4e7cf755171043b',
      sigBitmap: 7
    });
  });

  it('fails on invalid magic or version', () => {
    const encoded = encodeOpReturnPayload({
      pairId: 1,
      hourTs: 1707346800,
      closeFp: '62910000',
      reportHash: '12250056bae9dfd7d3dd0071b9b0be8daf7158ee633617aed4e7cf755171043b',
      sigBitmap: 7
    });

    const badMagic = Uint8Array.from(encoded);
    badMagic[0] = 0x58;
    expect(() => decodeOpReturnPayload(badMagic)).toThrow(OpReturnCodecError);

    const badVersion = Uint8Array.from(encoded);
    badVersion[4] = 2;
    expect(() => decodeOpReturnPayload(badVersion)).toThrow(OpReturnCodecError);
  });
});
