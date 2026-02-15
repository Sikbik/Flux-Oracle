import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { runMigrations } from '@fpho/api';

import { HourlyReportFinalizer, WindowReportFinalizer } from '../src/index.js';

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

describe('report finalizers', () => {
  it('preserves hour signatures when report_hash is unchanged and clears them on change', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-hour-sig-'));
    tempPaths.push(tempDir);

    const dbPath = path.join(tempDir, 'hour.sqlite');
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

    const finalizer = new HourlyReportFinalizer({
      dbPath,
      pair: 'FLUXUSD',
      rulesetVersion: 'v1'
    });

    const first = finalizer.finalizeHour(1707346800);

    const signDb = new Database(dbPath);
    signDb
      .prepare(
        `
          UPDATE hour_reports
          SET reporter_set_id = ?, signatures_json = ?
          WHERE pair = ?
            AND hour_ts = ?
        `
      )
      .run('reporter-set-1', JSON.stringify({ 'reporter-1': 'sig-1' }), 'FLUXUSD', 1707346800);
    signDb.close();

    const second = finalizer.finalizeHour(1707346800);
    expect(second.reportHash).toBe(first.reportHash);

    const verifySame = new Database(dbPath, { readonly: true });
    try {
      const row = verifySame
        .prepare(
          `
            SELECT reporter_set_id, signatures_json
            FROM hour_reports
            WHERE pair = ?
              AND hour_ts = ?
          `
        )
        .get('FLUXUSD', 1707346800) as {
        reporter_set_id: string | null;
        signatures_json: string | null;
      };

      expect(row).toEqual({
        reporter_set_id: 'reporter-set-1',
        signatures_json: JSON.stringify({ 'reporter-1': 'sig-1' })
      });
    } finally {
      verifySame.close();
    }

    const mutateDb = new Database(dbPath);
    mutateDb
      .prepare(
        `
          UPDATE minute_prices
          SET reference_price_fp = ?
          WHERE pair = ?
            AND minute_ts = ?
        `
      )
      .run('62850000', 'FLUXUSD', 1707346920);
    mutateDb.close();

    const third = finalizer.finalizeHour(1707346800);
    expect(third.reportHash).not.toBe(first.reportHash);

    finalizer.close();

    const verifyChanged = new Database(dbPath, { readonly: true });
    try {
      const row = verifyChanged
        .prepare(
          `
            SELECT report_hash, reporter_set_id, signatures_json
            FROM hour_reports
            WHERE pair = ?
              AND hour_ts = ?
          `
        )
        .get('FLUXUSD', 1707346800) as {
        report_hash: string;
        reporter_set_id: string | null;
        signatures_json: string | null;
      };

      expect(row.report_hash).toBe(third.reportHash);
      expect(row.reporter_set_id).toBeNull();
      expect(row.signatures_json).toBeNull();
    } finally {
      verifyChanged.close();
    }
  });

  it('preserves window signatures when report_hash is unchanged and clears them on change', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'fpho-window-sig-'));
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

    const first = finalizer.finalizeWindow(1707346800);

    const signDb = new Database(dbPath);
    signDb
      .prepare(
        `
          UPDATE window_reports
          SET reporter_set_id = ?, signatures_json = ?
          WHERE pair = ?
            AND window_seconds = ?
            AND window_ts = ?
        `
      )
      .run('reporter-set-1', JSON.stringify({ 'reporter-1': 'sig-1' }), 'FLUXUSD', 600, 1707346800);
    signDb.close();

    const second = finalizer.finalizeWindow(1707346800);
    expect(second.reportHash).toBe(first.reportHash);

    const verifySame = new Database(dbPath, { readonly: true });
    try {
      const row = verifySame
        .prepare(
          `
            SELECT reporter_set_id, signatures_json
            FROM window_reports
            WHERE pair = ?
              AND window_seconds = ?
              AND window_ts = ?
          `
        )
        .get('FLUXUSD', 600, 1707346800) as {
        reporter_set_id: string | null;
        signatures_json: string | null;
      };

      expect(row).toEqual({
        reporter_set_id: 'reporter-set-1',
        signatures_json: JSON.stringify({ 'reporter-1': 'sig-1' })
      });
    } finally {
      verifySame.close();
    }

    const mutateDb = new Database(dbPath);
    mutateDb
      .prepare(
        `
          UPDATE minute_prices
          SET reference_price_fp = ?
          WHERE pair = ?
            AND minute_ts = ?
        `
      )
      .run('62850000', 'FLUXUSD', 1707346920);
    mutateDb.close();

    const third = finalizer.finalizeWindow(1707346800);
    expect(third.reportHash).not.toBe(first.reportHash);

    finalizer.close();

    const verifyChanged = new Database(dbPath, { readonly: true });
    try {
      const row = verifyChanged
        .prepare(
          `
            SELECT report_hash, reporter_set_id, signatures_json
            FROM window_reports
            WHERE pair = ?
              AND window_seconds = ?
              AND window_ts = ?
          `
        )
        .get('FLUXUSD', 600, 1707346800) as {
        report_hash: string;
        reporter_set_id: string | null;
        signatures_json: string | null;
      };

      expect(row.report_hash).toBe(third.reportHash);
      expect(row.reporter_set_id).toBeNull();
      expect(row.signatures_json).toBeNull();
    } finally {
      verifyChanged.close();
    }
  });
});
