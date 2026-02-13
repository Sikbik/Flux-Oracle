import Database from 'better-sqlite3';

import { decodeOpReturnPayload } from '@fpho/core';

import { extractOpReturnPayloadHexes, type TxOutput } from './parser.js';

export interface FluxBlock {
  hash: string;
  height: number;
  previousblockhash?: string;
  time?: number;
  tx: string[];
}

export interface FluxRawTransaction {
  txid: string;
  vout: TxOutput[];
}

export interface FluxChainReader {
  getBestHeight(): Promise<number>;
  getBlockHash(height: number): Promise<string>;
  getBlock(hash: string): Promise<FluxBlock>;
  getRawTransaction(txid: string): Promise<FluxRawTransaction>;
}

export interface IndexerScanOptions {
  dbPath: string;
  chain: FluxChainReader;
  pairById?: Readonly<Record<number, string>>;
  fromHeight?: number;
  toHeight?: number;
}

export interface IndexerScanResult {
  scannedFrom: number;
  scannedTo: number;
  anchorsUpserted: number;
  reorgDepth: number;
}

interface IndexerStateRow {
  last_height: number;
  last_block_hash: string | null;
}

const DEFAULT_PAIR_BY_ID: Readonly<Record<number, string>> = {
  1: 'FLUXUSD'
};

export async function scanAnchors(options: IndexerScanOptions): Promise<IndexerScanResult> {
  const db = new Database(options.dbPath);

  try {
    ensureIndexerStateRow(db);

    const pairById = options.pairById ?? DEFAULT_PAIR_BY_ID;
    const bestHeight = options.toHeight ?? (await options.chain.getBestHeight());

    const state = readIndexerState(db);

    let reorgDepth = 0;
    let stableHeight = state.last_height;
    let stableHash = state.last_block_hash;

    if (options.fromHeight === undefined) {
      while (stableHeight > 0 && stableHash) {
        const chainHashAtStableHeight = await options.chain.getBlockHash(stableHeight);
        if (chainHashAtStableHeight === stableHash) {
          break;
        }

        db.prepare('DELETE FROM anchors WHERE block_height >= ?').run(stableHeight);
        stableHeight -= 1;
        reorgDepth += 1;
        stableHash = stableHeight > 0 ? await options.chain.getBlockHash(stableHeight) : null;
      }
    }

    const scanFrom = Math.max(options.fromHeight ?? stableHeight + 1, 1);

    if (scanFrom > bestHeight) {
      writeIndexerState(db, stableHeight, stableHash);
      return {
        scannedFrom: scanFrom,
        scannedTo: bestHeight,
        anchorsUpserted: 0,
        reorgDepth
      };
    }

    let anchorsUpserted = 0;

    for (let height = scanFrom; height <= bestHeight; height += 1) {
      const blockHash = await options.chain.getBlockHash(height);
      const block = await options.chain.getBlock(blockHash);

      if (block.hash !== blockHash) {
        throw new Error(`block hash mismatch at height ${height}`);
      }

      for (const txid of block.tx) {
        const transaction = await options.chain.getRawTransaction(txid);
        const payloadHexes = extractOpReturnPayloadHexes(transaction.vout);

        for (const payloadHex of payloadHexes) {
          const decoded = tryDecodePayload(payloadHex);
          if (!decoded) {
            continue;
          }

          const pair = pairById[decoded.pairId];
          if (!pair) {
            continue;
          }

          db.prepare(
            `
              INSERT INTO anchors(
                txid,
                pair,
                hour_ts,
                report_hash,
                block_height,
                block_hash,
                confirmed,
                op_return_hex,
                created_at
              )
              VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
              ON CONFLICT(pair, hour_ts)
              DO UPDATE SET
                txid = excluded.txid,
                report_hash = excluded.report_hash,
                block_height = excluded.block_height,
                block_hash = excluded.block_hash,
                confirmed = excluded.confirmed,
                op_return_hex = excluded.op_return_hex,
                created_at = excluded.created_at
            `
          ).run(
            transaction.txid,
            pair,
            decoded.hourTs,
            decoded.reportHash,
            height,
            block.hash,
            payloadHex,
            block.time ?? Math.floor(Date.now() / 1000)
          );

          anchorsUpserted += 1;
        }
      }

      writeIndexerState(db, height, block.hash);
    }

    return {
      scannedFrom: scanFrom,
      scannedTo: bestHeight,
      anchorsUpserted,
      reorgDepth
    };
  } finally {
    db.close();
  }
}

function tryDecodePayload(payloadHex: string): {
  pairId: number;
  hourTs: number;
  reportHash: string;
} | null {
  try {
    const decoded = decodeOpReturnPayload(Buffer.from(payloadHex, 'hex'));
    return {
      pairId: decoded.pairId,
      hourTs: decoded.hourTs,
      reportHash: decoded.reportHash
    };
  } catch {
    return null;
  }
}

function ensureIndexerStateRow(db: Database.Database): void {
  db.prepare(
    `
      INSERT OR IGNORE INTO indexer_state(id, last_height, last_block_hash)
      VALUES (1, 0, NULL)
    `
  ).run();
}

function readIndexerState(db: Database.Database): IndexerStateRow {
  const row = db
    .prepare(
      `
        SELECT last_height, last_block_hash
        FROM indexer_state
        WHERE id = 1
      `
    )
    .get() as IndexerStateRow | undefined;

  if (!row) {
    return {
      last_height: 0,
      last_block_hash: null
    };
  }

  return row;
}

function writeIndexerState(
  db: Database.Database,
  lastHeight: number,
  lastBlockHash: string | null
): void {
  db.prepare(
    `
      INSERT INTO indexer_state(id, last_height, last_block_hash)
      VALUES (1, ?, ?)
      ON CONFLICT(id)
      DO UPDATE SET
        last_height = excluded.last_height,
        last_block_hash = excluded.last_block_hash
    `
  ).run(lastHeight, lastBlockHash);
}
