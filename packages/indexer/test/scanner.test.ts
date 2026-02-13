import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import Database from 'better-sqlite3';
import { encodeOpReturnPayload } from '@fpho/core';
import { runMigrations } from '@fpho/api';

import {
  scanAnchors,
  type FluxBlock,
  type FluxChainReader,
  type FluxRawTransaction
} from '../src/index.js';

const migrationDir = fileURLToPath(new URL('../../../db/migrations', import.meta.url));

const tempPaths: string[] = [];

afterEach(() => {
  while (tempPaths.length > 0) {
    const value = tempPaths.pop();
    if (value) {
      rmSync(value, { recursive: true, force: true });
    }
  }
});

describe('indexer scanner', () => {
  it('stores decoded anchors and rewinds on basic reorg', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-indexer-'));
    tempPaths.push(tempDir);

    const dbPath = path.join(tempDir, 'indexer.sqlite');
    runMigrations({ dbPath, migrationsDir: migrationDir });

    const firstPayload = makePayloadHex('a'.repeat(64));
    const secondPayload = makePayloadHex('b'.repeat(64));

    const chain = new FixtureChain(
      [
        {
          hash: 'block-a1',
          height: 1,
          previousblockhash: 'genesis',
          tx: ['tx-a1'],
          time: 1707346890
        }
      ],
      {
        'tx-a1': {
          txid: 'tx-a1',
          vout: [{ scriptPubKey: { hex: `6a36${firstPayload}` } }]
        }
      }
    );

    const firstScan = await scanAnchors({
      dbPath,
      chain
    });

    expect(firstScan).toMatchObject({
      scannedFrom: 1,
      scannedTo: 1,
      anchorsUpserted: 1,
      reorgDepth: 0
    });

    chain.setData(
      [
        {
          hash: 'block-b1',
          height: 1,
          previousblockhash: 'genesis',
          tx: ['tx-b1'],
          time: 1707346950
        }
      ],
      {
        'tx-b1': {
          txid: 'tx-b1',
          vout: [{ scriptPubKey: { asm: `OP_RETURN ${secondPayload}` } }]
        }
      }
    );

    const secondScan = await scanAnchors({
      dbPath,
      chain
    });

    expect(secondScan).toMatchObject({
      scannedFrom: 1,
      scannedTo: 1,
      anchorsUpserted: 1,
      reorgDepth: 1
    });

    const db = new Database(dbPath, { readonly: true });
    try {
      const anchors = db
        .prepare(
          `
            SELECT txid, hour_ts, report_hash, block_height, block_hash, confirmed
            FROM anchors
            ORDER BY hour_ts ASC
          `
        )
        .all() as Array<{
        txid: string;
        hour_ts: number;
        report_hash: string;
        block_height: number | null;
        block_hash: string | null;
        confirmed: number;
      }>;

      expect(anchors).toEqual([
        {
          txid: 'tx-b1',
          hour_ts: 1707346800,
          report_hash: 'b'.repeat(64),
          block_height: 1,
          block_hash: 'block-b1',
          confirmed: 1
        }
      ]);
    } finally {
      db.close();
    }
  });
});

class FixtureChain implements FluxChainReader {
  private blockByHeight = new Map<number, FluxBlock>();
  private txById = new Map<string, FluxRawTransaction>();

  constructor(blocks: FluxBlock[], transactions: Record<string, FluxRawTransaction>) {
    this.setData(blocks, transactions);
  }

  setData(blocks: FluxBlock[], transactions: Record<string, FluxRawTransaction>): void {
    this.blockByHeight = new Map(blocks.map((block) => [block.height, block]));
    this.txById = new Map(Object.entries(transactions));
  }

  async getBestHeight(): Promise<number> {
    return Math.max(...this.blockByHeight.keys());
  }

  async getBlockHash(height: number): Promise<string> {
    const block = this.blockByHeight.get(height);
    if (!block) {
      throw new Error(`missing block at height ${height}`);
    }

    return block.hash;
  }

  async getBlock(hash: string): Promise<FluxBlock> {
    for (const block of this.blockByHeight.values()) {
      if (block.hash === hash) {
        return block;
      }
    }

    throw new Error(`missing block with hash ${hash}`);
  }

  async getRawTransaction(txid: string): Promise<FluxRawTransaction> {
    const tx = this.txById.get(txid);
    if (!tx) {
      throw new Error(`missing tx ${txid}`);
    }

    return tx;
  }
}

function makePayloadHex(reportHash: string): string {
  return Buffer.from(
    encodeOpReturnPayload({
      pairId: 1,
      hourTs: 1707346800,
      closeFp: '62750000',
      reportHash,
      sigBitmap: 3
    })
  ).toString('hex');
}
