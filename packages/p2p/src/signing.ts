import { ed25519 } from '@noble/curves/ed25519';

const encoder = new TextEncoder();

export async function derivePublicKey(privateKeyHex: string): Promise<string> {
  const privateKey = fromHex(privateKeyHex, 32, 'private key');
  const publicKey = ed25519.getPublicKey(privateKey);
  return toHex(publicKey);
}

export async function signMessage(
  message: string | Uint8Array,
  privateKeyHex: string
): Promise<string> {
  const privateKey = fromHex(privateKeyHex, 32, 'private key');
  const bytes = typeof message === 'string' ? encoder.encode(message) : message;
  const signature = ed25519.sign(bytes, privateKey);
  return toHex(signature);
}

export async function verifySignature(
  message: string | Uint8Array,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  const bytes = typeof message === 'string' ? encoder.encode(message) : message;
  const signature = fromHex(signatureHex, 64, 'signature');
  const publicKey = fromHex(publicKeyHex, 32, 'public key');

  return ed25519.verify(signature, bytes, publicKey);
}

function fromHex(value: string, expectedBytes: number, label: string): Uint8Array {
  const normalized = value.trim().toLowerCase();
  const expectedLength = expectedBytes * 2;
  if (!new RegExp(`^[0-9a-f]{${expectedLength}}$`).test(normalized)) {
    throw new Error(`invalid ${label} hex`);
  }

  return Uint8Array.from(Buffer.from(normalized, 'hex'));
}

function toHex(value: Uint8Array): string {
  return Buffer.from(value).toString('hex');
}
