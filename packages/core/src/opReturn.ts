const MAGIC = 'FPHO';
const MAGIC_BYTES = Buffer.from(MAGIC, 'ascii');

const VERSION = 1;
const PAYLOAD_SIZE_BYTES = 54;
const MAX_TARGET_BYTES = 80;

const MAX_I64 = 9223372036854775807n;
const MIN_I64 = -9223372036854775808n;

export interface OpReturnPayload {
  version?: number;
  pairId: number;
  hourTs: number;
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
  const version = payload.version ?? VERSION;
  if (version !== VERSION) {
    throw new OpReturnCodecError(`unsupported version: ${version}`);
  }

  assertUInt8(payload.pairId, 'pairId');
  assertUInt32(payload.hourTs, 'hourTs');
  assertUInt32(payload.sigBitmap, 'sigBitmap');

  const closeFp = parseI64(payload.closeFp, 'closeFp');
  const reportHashBytes = parseReportHash(payload.reportHash);

  const bytes = new Uint8Array(PAYLOAD_SIZE_BYTES);
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

export function decodeOpReturnPayload(bytes: Uint8Array): OpReturnPayload {
  if (bytes.length !== PAYLOAD_SIZE_BYTES) {
    throw new OpReturnCodecError(`invalid payload length: ${bytes.length}`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const magic = Buffer.from(bytes.subarray(0, 4)).toString('ascii');
  if (magic !== MAGIC) {
    throw new OpReturnCodecError(`invalid magic: ${magic}`);
  }

  const version = view.getUint8(4);
  if (version !== VERSION) {
    throw new OpReturnCodecError(`unsupported version: ${version}`);
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

export function payloadSizeBytes(): number {
  return PAYLOAD_SIZE_BYTES;
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
