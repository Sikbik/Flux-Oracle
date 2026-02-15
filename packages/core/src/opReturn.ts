const MAGIC = 'FPHO';
const MAGIC_BYTES = Buffer.from(MAGIC, 'ascii');

const VERSION_V1 = 1;
const VERSION_V2 = 2;
const PAYLOAD_V1_SIZE_BYTES = 54;
const PAYLOAD_V2_SIZE_BYTES = 58;
const MAX_TARGET_BYTES = 80;

const MAX_I64 = 9223372036854775807n;
const MIN_I64 = -9223372036854775808n;

export interface OpReturnPayload {
  version?: number;
  pairId: number;
  hourTs: number;
  windowSeconds?: number;
  closeFp: string;
  reportHash: string;
  sigBitmap: number;
}

export class OpReturnCodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpReturnCodecError';
  }
}

export function encodeOpReturnPayload(payload: OpReturnPayload): Uint8Array {
  const version =
    payload.version ?? (payload.windowSeconds !== undefined ? VERSION_V2 : VERSION_V1);

  assertUInt8(payload.pairId, 'pairId');
  assertUInt32(payload.hourTs, 'hourTs');
  assertUInt32(payload.sigBitmap, 'sigBitmap');

  const closeFp = parseI64(payload.closeFp, 'closeFp');
  const reportHashBytes = parseReportHash(payload.reportHash);

  if (version === VERSION_V1) {
    if (payload.windowSeconds !== undefined) {
      throw new OpReturnCodecError('windowSeconds not supported in version 1 payloads');
    }

    const bytes = new Uint8Array(PAYLOAD_V1_SIZE_BYTES);
    const view = new DataView(bytes.buffer);

    bytes.set(MAGIC_BYTES, 0);
    view.setUint8(4, version);
    view.setUint8(5, payload.pairId);
    view.setUint32(6, payload.hourTs, false);
    view.setBigInt64(10, closeFp, false);
    bytes.set(reportHashBytes, 18);
    view.setUint32(50, payload.sigBitmap, false);

    if (bytes.length > MAX_TARGET_BYTES) {
      throw new OpReturnCodecError(`payload too large: ${bytes.length} bytes`);
    }

    return bytes;
  }

  if (version === VERSION_V2) {
    if (payload.windowSeconds === undefined) {
      throw new OpReturnCodecError('windowSeconds required for version 2 payloads');
    }

    assertUInt32(payload.windowSeconds, 'windowSeconds');

    const bytes = new Uint8Array(PAYLOAD_V2_SIZE_BYTES);
    const view = new DataView(bytes.buffer);

    bytes.set(MAGIC_BYTES, 0);
    view.setUint8(4, version);
    view.setUint8(5, payload.pairId);
    view.setUint32(6, payload.hourTs, false);
    view.setUint32(10, payload.windowSeconds, false);
    view.setBigInt64(14, closeFp, false);
    bytes.set(reportHashBytes, 22);
    view.setUint32(54, payload.sigBitmap, false);

    if (bytes.length > MAX_TARGET_BYTES) {
      throw new OpReturnCodecError(`payload too large: ${bytes.length} bytes`);
    }

    return bytes;
  }

  throw new OpReturnCodecError(`unsupported version: ${version}`);
}

export function decodeOpReturnPayload(bytes: Uint8Array): OpReturnPayload {
  if (bytes.length < 6) {
    throw new OpReturnCodecError(`invalid payload length: ${bytes.length}`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const magic = Buffer.from(bytes.subarray(0, 4)).toString('ascii');
  if (magic !== MAGIC) {
    throw new OpReturnCodecError(`invalid magic: ${magic}`);
  }

  const version = view.getUint8(4);
  if (version === VERSION_V1) {
    if (bytes.length !== PAYLOAD_V1_SIZE_BYTES) {
      throw new OpReturnCodecError(`invalid payload length: ${bytes.length}`);
    }

    const pairId = view.getUint8(5);
    const hourTs = view.getUint32(6, false);
    const closeFp = view.getBigInt64(10, false).toString();
    const reportHash = Buffer.from(bytes.subarray(18, 50)).toString('hex');
    const sigBitmap = view.getUint32(50, false);

    return {
      version,
      pairId,
      hourTs,
      closeFp,
      reportHash,
      sigBitmap
    };
  }

  if (version === VERSION_V2) {
    if (bytes.length !== PAYLOAD_V2_SIZE_BYTES) {
      throw new OpReturnCodecError(`invalid payload length: ${bytes.length}`);
    }

    const pairId = view.getUint8(5);
    const hourTs = view.getUint32(6, false);
    const windowSeconds = view.getUint32(10, false);
    const closeFp = view.getBigInt64(14, false).toString();
    const reportHash = Buffer.from(bytes.subarray(22, 54)).toString('hex');
    const sigBitmap = view.getUint32(54, false);

    return {
      version,
      pairId,
      hourTs,
      windowSeconds,
      closeFp,
      reportHash,
      sigBitmap
    };
  }

  throw new OpReturnCodecError(`unsupported version: ${version}`);
}

export function payloadSizeBytes(version = VERSION_V1): number {
  if (version === VERSION_V1) {
    return PAYLOAD_V1_SIZE_BYTES;
  }

  if (version === VERSION_V2) {
    return PAYLOAD_V2_SIZE_BYTES;
  }

  throw new OpReturnCodecError(`unsupported version: ${version}`);
}

function assertUInt8(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xff) {
    throw new OpReturnCodecError(`${field} must be a uint8`);
  }
}

function assertUInt32(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new OpReturnCodecError(`${field} must be a uint32`);
  }
}

function parseI64(value: string, field: string): bigint {
  if (!/^-?\d+$/.test(value)) {
    throw new OpReturnCodecError(`${field} must be an integer string`);
  }

  const parsed = BigInt(value);
  if (parsed > MAX_I64 || parsed < MIN_I64) {
    throw new OpReturnCodecError(`${field} must fit int64`);
  }

  return parsed;
}

function parseReportHash(reportHash: string): Uint8Array {
  const normalized = reportHash.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new OpReturnCodecError('reportHash must be 32-byte hex');
  }

  return Buffer.from(normalized, 'hex');
}
