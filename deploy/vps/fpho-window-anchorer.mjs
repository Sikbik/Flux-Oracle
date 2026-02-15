import Database from 'better-sqlite3';

import { FluxRpcHttpTransport, anchorWindowReport } from '../../packages/anchor/dist/index.js';
import { DEFAULT_METHODOLOGY } from '../../packages/api/dist/index.js';

const dbPath = process.env.FPHO_DB_PATH ?? 'data/fpho.sqlite';
const pair = process.env.FPHO_PAIR ?? DEFAULT_METHODOLOGY.pair;
const windowSeconds = Number(process.env.FPHO_WINDOW_SECONDS ?? '300');
const graceSeconds = Number(process.env.FPHO_GRACE_SECONDS ?? DEFAULT_METHODOLOGY.graceSeconds);

const rpcEndpoint = process.env.FPHO_FLUX_RPC_ENDPOINT ?? 'http://127.0.0.1:16124';
const rpcUsername = process.env.FPHO_FLUX_RPC_USERNAME;
const rpcPassword = process.env.FPHO_FLUX_RPC_PASSWORD;

const fundingUtxoTxid = process.env.FPHO_ANCHOR_UTXO_TXID;
const fundingUtxoVoutRaw = process.env.FPHO_ANCHOR_UTXO_VOUT;
const fundingUtxoAmount = process.env.FPHO_ANCHOR_UTXO_AMOUNT;
const fundingUtxoAddress = process.env.FPHO_ANCHOR_UTXO_ADDRESS;
const fundingUtxoFee = process.env.FPHO_ANCHOR_UTXO_FEE;

if (!Number.isFinite(windowSeconds) || windowSeconds <= 0) {
  throw new Error('FPHO_WINDOW_SECONDS must be a positive number');
}

if (!Number.isFinite(graceSeconds) || graceSeconds < 0) {
  throw new Error('FPHO_GRACE_SECONDS must be a non-negative number');
}

const transport = new FluxRpcHttpTransport({
  endpoint: rpcEndpoint,
  username: rpcUsername,
  password: rpcPassword,
  timeoutMs: 30_000
});

const db = new Database(dbPath, { timeout: 5000 });
db.pragma('journal_mode = WAL');

const fundingUtxoState = db.prepare(
  `
    SELECT txid, vout, amount, address
    FROM anchor_utxo_state
    WHERE id = 1
    LIMIT 1
  `
);

const reportExists = db.prepare(
  `
    SELECT 1
    FROM window_reports
    WHERE pair = ?
      AND window_seconds = ?
      AND window_ts = ?
      AND close_fp IS NOT NULL
      AND reporter_set_id IS NOT NULL
    LIMIT 1
  `
);

const anchorExists = db.prepare(
  `
    SELECT 1
    FROM window_anchors
    WHERE pair = ?
      AND window_seconds = ?
      AND window_ts = ?
    LIMIT 1
  `
);

const findWindowToAnchor = () => {
  const nowTs = Math.floor(Date.now() / 1000);
  const baseWindow =
    Math.floor((nowTs - (windowSeconds + graceSeconds)) / windowSeconds) * windowSeconds;

  for (let offset = 0; offset < 6; offset += 1) {
    const windowTs = baseWindow - offset * windowSeconds;
    if (!reportExists.get(pair, windowSeconds, windowTs)) {
      continue;
    }

    if (anchorExists.get(pair, windowSeconds, windowTs)) {
      continue;
    }

    return windowTs;
  }

  return null;
};

const runOnce = async () => {
  // In lite mode we don't have wallet/addr indexing; when we use a rolling seed UTXO we must avoid
  // building long chains of unconfirmed transactions (many peers won't relay/mine them). So we only
  // broadcast when the current funding tx has left our mempool.
  if (fundingUtxoTxid && fundingUtxoVoutRaw && fundingUtxoAmount && fundingUtxoAddress) {
    const state = fundingUtxoState.get() ?? {};
    const txid = state.txid ?? fundingUtxoTxid;
    const vout = Number(state.vout ?? fundingUtxoVoutRaw);

    // NOTE: fluxd-rust lite mode may not support gettxout/getrawtransaction lookups for confirmed txids
    // without txindex. `getrawmempool` is enough to prevent unconfirmed chains: if the funding tx is
    // still in our mempool, we wait; once it leaves (confirmed or dropped), we'll attempt a spend.
    const mempool = await transport.call('getrawmempool', []);
    if (Array.isArray(mempool) && mempool.includes(txid)) {
      console.log('[anchorer] funding tx still in mempool; waiting', `${txid}:${vout}`);
      return;
    }
  }

  const windowTs = findWindowToAnchor();
  if (windowTs === null) {
    console.log('[anchorer] no unanchored windows ready');
    return;
  }

  console.log('[anchorer] anchoring', `${windowSeconds}:${windowTs}`);

  const result = await anchorWindowReport({
    dbPath,
    pair,
    windowSeconds,
    windowTs,
    fluxRpc: transport,
    fundingUtxo:
      fundingUtxoTxid && fundingUtxoVoutRaw && fundingUtxoAmount && fundingUtxoAddress
        ? {
            txid: fundingUtxoTxid,
            vout: Number(fundingUtxoVoutRaw),
            amount: fundingUtxoAmount,
            address: fundingUtxoAddress,
            fee: fundingUtxoFee
          }
        : undefined
  });

  console.log('[anchorer] anchored', `${windowSeconds}:${windowTs}`, result.txid);
};

await runOnce().catch((error) => {
  console.error('[anchorer] failed', error instanceof Error ? error.message : String(error));
});
const timer = setInterval(() => {
  runOnce().catch((error) => {
    console.error('[anchorer] failed', error instanceof Error ? error.message : String(error));
  });
}, 30_000);

const shutdown = () => {
  clearInterval(timer);
  db.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
