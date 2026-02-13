export interface TxOutputScript {
  asm?: string;
  hex?: string;
}

export interface TxOutput {
  scriptPubKey?: TxOutputScript;
}

export function extractOpReturnPayloadHexes(outputs: readonly TxOutput[]): string[] {
  const payloads: string[] = [];

  for (const output of outputs) {
    const script = output.scriptPubKey;
    if (!script) {
      continue;
    }

    const fromAsm = script.asm ? extractPayloadFromAsm(script.asm) : null;
    if (fromAsm) {
      payloads.push(fromAsm);
      continue;
    }

    const fromHex = script.hex ? extractPayloadFromScriptHex(script.hex) : null;
    if (fromHex) {
      payloads.push(fromHex);
    }
  }

  return payloads;
}

function extractPayloadFromAsm(asm: string): string | null {
  const parts = asm.trim().split(/\s+/);
  if (parts.length < 2 || parts[0] !== 'OP_RETURN') {
    return null;
  }

  const candidate = parts[1];
  if (!candidate || !/^[0-9a-fA-F]+$/.test(candidate) || candidate.length % 2 !== 0) {
    return null;
  }

  return candidate.toLowerCase();
}

function extractPayloadFromScriptHex(scriptHex: string): string | null {
  const normalized = scriptHex.trim().toLowerCase();
  if (!normalized.startsWith('6a')) {
    return null;
  }

  if (normalized.length < 4) {
    return null;
  }

  let offset = 2;
  const opcode = Number.parseInt(normalized.slice(offset, offset + 2), 16);
  offset += 2;

  if (Number.isNaN(opcode)) {
    return null;
  }

  let payloadLength = 0;
  if (opcode <= 0x4b) {
    payloadLength = opcode;
  } else if (opcode === 0x4c) {
    payloadLength = Number.parseInt(normalized.slice(offset, offset + 2), 16);
    offset += 2;
  } else if (opcode === 0x4d) {
    const littleEndian = normalized.slice(offset, offset + 4);
    offset += 4;
    payloadLength = Number.parseInt(littleEndian.slice(2, 4) + littleEndian.slice(0, 2), 16);
  } else {
    return null;
  }

  if (Number.isNaN(payloadLength) || payloadLength < 0) {
    return null;
  }

  const payloadHexLength = payloadLength * 2;
  const payloadHex = normalized.slice(offset, offset + payloadHexLength);

  if (payloadHex.length !== payloadHexLength) {
    return null;
  }

  return payloadHex;
}
