export interface FluxRpcTransport {
  call<TResult>(method: string, params?: unknown[]): Promise<TResult>;
}

export interface FluxRpcHttpTransportOptions {
  endpoint: string;
  username?: string;
  password?: string;
  timeoutMs?: number;
}

export interface BroadcastOpReturnResult {
  txid: string;
  unsignedHex: string;
  fundedHex: string;
  signedHex: string;
  changeVout?: number;
}

export interface BroadcastOpReturnUtxoInput {
  txid: string;
  vout: number;
  changeAddress: string;
  changeAmount: string;
}

export interface BroadcastOpReturnHexOptions {
  utxo?: BroadcastOpReturnUtxoInput;
}

export class FluxRpcHttpTransport implements FluxRpcTransport {
  private readonly endpoint: URL;
  private readonly authHeader: string | null;
  private readonly timeoutMs: number;

  constructor(options: FluxRpcHttpTransportOptions) {
    this.endpoint = new URL(options.endpoint);
    this.timeoutMs = options.timeoutMs ?? 10_000;

    if (options.username && options.password) {
      const token = Buffer.from(`${options.username}:${options.password}`, 'utf8').toString(
        'base64'
      );
      this.authHeader = `Basic ${token}`;
    } else {
      this.authHeader = null;
    }
  }

  async call<TResult>(method: string, params: unknown[] = []): Promise<TResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authHeader ? { Authorization: this.authHeader } : {})
        },
        body: JSON.stringify({
          jsonrpc: '1.0',
          id: 'fpho-anchor',
          method,
          params
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`rpc call ${method} failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        result?: TResult;
        error?: { code?: number; message?: string } | null;
      };

      if (payload.error) {
        const message = payload.error.message ?? 'unknown rpc error';
        throw new Error(`rpc call ${method} failed: ${message}`);
      }

      if (payload.result === undefined) {
        throw new Error(`rpc call ${method} returned no result`);
      }

      return payload.result;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function broadcastOpReturnHex(
  transport: FluxRpcTransport,
  opReturnHex: string,
  options: BroadcastOpReturnHexOptions = {}
): Promise<BroadcastOpReturnResult> {
  const utxo = options.utxo;

  const inputs = utxo ? [{ txid: utxo.txid, vout: utxo.vout }] : [];
  const outputs: Record<string, unknown> = utxo
    ? { [utxo.changeAddress]: utxo.changeAmount, data: opReturnHex }
    : { data: opReturnHex };

  // Flux is a Zcash-derived chain with transaction expiry heights. If we let the daemon choose the
  // default (often "current height + ~20 blocks"), a low/zero-fee anchor tx can expire before it is
  // mined, stalling the UTXO chain. Setting expiryheight=0 disables expiry.
  const unsignedHex = await transport.call<string>('createrawtransaction', [inputs, outputs, 0, 0]);

  let fundedHex = unsignedHex;

  if (!utxo) {
    const funded = await transport.call<{ hex?: string }>('fundrawtransaction', [unsignedHex]);
    if (!funded.hex) {
      throw new Error('fundrawtransaction returned no hex');
    }
    fundedHex = funded.hex;
  }

  const signed = await transport.call<{ hex?: string; complete?: boolean }>('signrawtransaction', [
    fundedHex
  ]);

  if (!signed.hex || signed.complete !== true) {
    throw new Error('signrawtransaction did not return a complete signed tx');
  }

  let changeVout: number | undefined;
  if (utxo) {
    const decoded = await transport.call<{
      vout: Array<{
        n: number;
        value: number;
        scriptPubKey: { addresses?: string[] };
      }>;
    }>('decoderawtransaction', [signed.hex]);

    const match = decoded.vout.find((output) =>
      (output.scriptPubKey.addresses ?? []).includes(utxo.changeAddress)
    );

    if (!match) {
      throw new Error(`signed tx missing change output for ${utxo.changeAddress}`);
    }

    changeVout = match.n;
  }

  const txid = await transport.call<string>('sendrawtransaction', [signed.hex]);

  return {
    txid,
    unsignedHex,
    fundedHex,
    signedHex: signed.hex,
    changeVout
  };
}
