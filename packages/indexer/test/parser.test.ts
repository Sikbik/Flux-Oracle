import { describe, expect, it } from 'vitest';

import { encodeOpReturnPayload } from '@fpho/core';

import { extractOpReturnPayloadHexes } from '../src/index.js';

describe('op_return parser', () => {
  it('extracts payload hex from asm and script hex fixtures', () => {
    const payloadHex = Buffer.from(
      encodeOpReturnPayload({
        pairId: 1,
        hourTs: 1707346800,
        closeFp: '62750000',
        reportHash: 'a'.repeat(64),
        sigBitmap: 3
      })
    ).toString('hex');

    const outputs = [
      { scriptPubKey: { asm: `OP_RETURN ${payloadHex}` } },
      { scriptPubKey: { hex: `6a36${payloadHex}` } },
      { scriptPubKey: { asm: 'OP_DUP OP_HASH160 deadbeef OP_EQUALVERIFY OP_CHECKSIG' } }
    ];

    expect(extractOpReturnPayloadHexes(outputs)).toEqual([payloadHex, payloadHex]);
  });
});
