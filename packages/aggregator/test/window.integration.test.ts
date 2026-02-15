import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { runMigrations } from '@fpho/api';

import { WindowReportFinalizer } from '../src/index.js';

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

describe('window report persistence', () => {
  it('persists window_reports with minute_root and report_hash', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-window-'));
    tempPaths.push(tempDir);

    const dbPath = path.join(tempDir, 'window.sqlite');
    runMigrations({ dbPath, migrationsDir: migrationDir });

    const db = new Database(dbPath);
    db.exec(`
      INSERT INTO minute_prices(pair, minute_ts, reference_price_fp, venues_used, degraded, degraded_reason)
      VALUES
        ('FLUXUSD', 1707346800, '62800000', 3, 0, NULL),
        ('FLUXUSD', 1707346860, '62900000', 3, 0, NULL),
        ('FLUXUSD', 1707346920, '62750000', 3, 0, NULL)
    `);
    db.close();

    const finalizer = new WindowReportFinalizer({
      dbPath,
      pair: 'FLUXUSD',
      windowSeconds: 600,
      rulesetVersion: 'v1'
    });

    const result = finalizer.finalizeWindow(1707346800);
    finalizer.close();

    const verifyDb = new Database(dbPath, { readonly: true });
    try {
      const row = verifyDb
        .prepare(
          `
            SELECT
              open_fp,
              high_fp,
              low_fp,
              close_fp,
              minute_root,
              report_hash,
              ruleset_version,
              available_minutes,
              degraded,
              reporter_set_id
            FROM window_reports
            WHERE pair = ?
              AND window_seconds = ?
              AND window_ts = ?
          `
        )
        .get('FLUXUSD', 600, 1707346800) as {
        open_fp: string | null;
        high_fp: string | null;
        low_fp: string | null;
        close_fp: string | null;
        minute_root: string;
        report_hash: string;
        ruleset_version: string;
        available_minutes: number;
        degraded: number;
        reporter_set_id: string | null;
      };

      expect(row).toEqual({
        open_fp: '62800000',
        high_fp: '62900000',
        low_fp: '62750000',
        close_fp: '62750000',
        minute_root: result.minuteRoot,
        report_hash: result.reportHash,
        ruleset_version: 'v1',
        available_minutes: 3,
        degraded: 1,
        reporter_set_id: null
      });
    } finally {
      verifyDb.close();
    }
  });
});
