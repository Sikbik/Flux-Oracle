import { describe, expect, it } from 'vitest';

import { derivePublicKey, signMessage, verifySignature } from '../src/index.js';

describe('ed25519 signing primitives', () => {
  it('derives stable public key and signs/verifies fixtures', async () => {
    const privateKey = '6c17f725f4fcd6d7b2f3a5a8b4ef7d1f2e5a2260bc257f8fef4d4d357ca8f35e';
    const message =
      'fpho-hour-report-hash:1400d75f04162cf252fc0bf0f8cef0fb95ce9a95d4f8cfb58b0e2a6f07a7f0dd';

    const publicKey = await derivePublicKey(privateKey);
    const signature = await signMessage(message, privateKey);

    expect(publicKey).toBe('5d82640769476f4a46ee6ae33f8b0e3ba3a53fe5b6f6aedf3b4d110296da062b');
    expect(signature).toBe(
      'e1ba900796735164eb92ef1363da9ae2002ebd6be52f36634e8fa3f0271ce577c45d85f7afb87a2cdf3d7b4c82a5d3f6119a6849770deeaca51c94fb723b8e08'
    );

    await expect(verifySignature(message, signature, publicKey)).resolves.toBe(true);
  });

  it('fails verification when payload is tampered', async () => {
    const privateKey = '6c17f725f4fcd6d7b2f3a5a8b4ef7d1f2e5a2260bc257f8fef4d4d357ca8f35e';
    const message = 'report-hash:abc123';
    const tamperedMessage = 'report-hash:abc124';

    const publicKey = await derivePublicKey(privateKey);
    const signature = await signMessage(message, privateKey);

    await expect(verifySignature(tamperedMessage, signature, publicKey)).resolves.toBe(false);
  });
});
