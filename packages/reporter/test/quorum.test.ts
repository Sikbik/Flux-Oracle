import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import Database from 'better-sqlite3';
import {
  derivePublicKey,
  signMessage,
  type ProposeMessage,
  type ReporterRegistry
} from '@fpho/p2p';
import { runMigrations } from '@fpho/api';

import { persistHourSignatures, QuorumCoordinator } from '../src/index.js';

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

describe('quorum coordinator', () => {
  it('signs matching proposals and finalizes at threshold', async () => {
    const privateA = '6c17f725f4fcd6d7b2f3a5a8b4ef7d1f2e5a2260bc257f8fef4d4d357ca8f35e';
    const privateB = '7f2ea4ecf89758de6f4e6b932f85f88f84f2135ad7ef8bde0f4e5f5f38e30a0d';
    const privateC = '4f9858cb6f8da9fd4aa9c45f2e8d9932d18c1df2ad7d6851124c596cb8f1795e';

    const registry: ReporterRegistry = {
      version: 'v1',
      threshold: 2,
      reporters: [
        { id: 'reporter-a', publicKey: await derivePublicKey(privateA) },
        { id: 'reporter-b', publicKey: await derivePublicKey(privateB) },
        { id: 'reporter-c', publicKey: await derivePublicKey(privateC) }
      ]
    };

    const coordinator = new QuorumCoordinator({
      registry,
      reporterId: 'reporter-a',
      privateKeyHex: privateA
    });

    const proposal: ProposeMessage = {
      type: 'PROPOSE',
      reporterSetId: 'set-1',
      hourTs: 1707346800,
      reporterId: 'reporter-leader',
      nonce: 'nonce-1',
      sentAt: 1707346860,
      leaderId: 'reporter-leader',
      reportHash: 'hash-1'
    };

    const ownSig = await coordinator.signIfProposalMatches(proposal, 'hash-1');
    expect(ownSig).not.toBeNull();

    const mismatch = await coordinator.signIfProposalMatches(proposal, 'hash-2');
    expect(mismatch).toBeNull();

    const reporterBSig = await signMessage('fpho:1707346800:hash-1', privateB);
    const accepted = await coordinator.collectSignature({
      type: 'SIG',
      reporterSetId: 'set-1',
      hourTs: 1707346800,
      reporterId: 'reporter-b',
      nonce: 'nonce-b',
      sentAt: 1707346861,
      reportHash: 'hash-1',
      signature: reporterBSig
    });

    expect(accepted).toBe(true);
    expect(coordinator.hasThresholdQuorum()).toBe(true);

    const finalMessage = coordinator.buildFinalMessage({
      reporterSetId: 'set-1',
      hourTs: 1707346800,
      reportHash: 'hash-1',
      reporterId: 'reporter-leader',
      nonce: 'final-1',
      sentAt: 1707346862
    });

    expect(finalMessage).not.toBeNull();
    expect(finalMessage?.signatures['reporter-a']).toBeTypeOf('string');
    expect(finalMessage?.signatures['reporter-b']).toBeTypeOf('string');
  });

  it('persists final signatures into hour_reports', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-reporter-'));
    tempPaths.push(tempDir);

    const dbPath = path.join(tempDir, 'reporter.sqlite');
    runMigrations({ dbPath, migrationsDir: migrationDir });

    const db = new Database(dbPath);
    db.exec(`
      INSERT INTO hour_reports(
        pair, hour_ts, open_fp, high_fp, low_fp, close_fp,
        minute_root, report_hash, ruleset_version
      ) VALUES (
        'FLUXUSD', 1707346800, '62800000', '62900000', '62750000', '62750000',
        'root', 'hash-1', 'v1'
      )
    `);
    db.close();

    persistHourSignatures(dbPath, 'FLUXUSD', 1707346800, {
      'reporter-a': 'sig-a',
      'reporter-b': 'sig-b'
    });

    const verifyDb = new Database(dbPath, { readonly: true });
    try {
      const row = verifyDb
        .prepare('SELECT signatures_json FROM hour_reports WHERE pair = ? AND hour_ts = ?')
        .get('FLUXUSD', 1707346800) as { signatures_json: string | null };

      expect(row.signatures_json).toBe('{"reporter-a":"sig-a","reporter-b":"sig-b"}');
    } finally {
      verifyDb.close();
    }
  });
});
