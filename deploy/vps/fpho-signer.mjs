import Database from 'better-sqlite3';

import { hashHourlyReport, hashWindowReport } from '../../packages/core/dist/index.js';
import { signMessage } from '../../packages/p2p/dist/index.js';
import {
  DEFAULT_SIM_REPORTER_KEYS,
  buildSimulationRegistry,
  persistHourSignatures,
  persistReporterSet,
  persistWindowSignatures
} from '../../packages/reporter/dist/index.js';

const dbPath = process.env.FPHO_DB_PATH ?? 'data/fpho.sqlite';
const pair = process.env.FPHO_PAIR ?? 'FLUXUSD';
const windowSeconds = Number(process.env.FPHO_WINDOW_SECONDS ?? '300');
const threshold = Number(process.env.FPHO_REPORTER_THRESHOLD ?? '2');

if (!Number.isFinite(windowSeconds) || windowSeconds <= 0) {
  throw new Error('FPHO_WINDOW_SECONDS must be a positive number');
}

if (!Number.isFinite(threshold) || threshold <= 0) {
  throw new Error('FPHO_REPORTER_THRESHOLD must be a positive number');
}

const privateKeysByReporterId = resolvePrivateKeys();
const registry = await buildSimulationRegistry(privateKeysByReporterId, threshold);
const reporterSetId = persistReporterSet(dbPath, registry);

const db = new Database(dbPath, { timeout: 5000 });
db.pragma('journal_mode = WAL');

const selectUnsignedHours = db.prepare(
  `
    SELECT
      pair,
      hour_ts,
      open_fp,
      high_fp,
      low_fp,
      close_fp,
      minute_root,
      report_hash,
      ruleset_version,
      available_minutes,
      degraded,
      reporter_set_id,
      signatures_json
    FROM hour_reports
    WHERE pair = ?
      AND close_fp IS NOT NULL
      AND (signatures_json IS NULL OR reporter_set_id IS NULL OR reporter_set_id != ?)
    ORDER BY hour_ts DESC
    LIMIT 4
  `
);

const selectUnsignedWindows = db.prepare(
  `
    SELECT
      pair,
      window_seconds,
      window_ts,
      open_fp,
      high_fp,
      low_fp,
      close_fp,
      minute_root,
      report_hash,
      ruleset_version,
      available_minutes,
      degraded,
      reporter_set_id,
      signatures_json
    FROM window_reports
    WHERE pair = ?
      AND window_seconds = ?
      AND close_fp IS NOT NULL
      AND (signatures_json IS NULL OR reporter_set_id IS NULL OR reporter_set_id != ?)
    ORDER BY window_ts DESC
    LIMIT 12
  `
);

async function runOnce() {
  const unsignedHours = selectUnsignedHours.all(pair, reporterSetId);
  const unsignedWindows = selectUnsignedWindows.all(pair, windowSeconds, reporterSetId);

  for (const row of unsignedHours) {
    const computed = hashHourlyReport(toHourlyPayload(row));
    if (computed !== row.report_hash) {
      console.error('[signer] hour hash mismatch', row.hour_ts, {
        stored: row.report_hash,
        computed
      });
      continue;
    }

    const signatures = await signAll(row.hour_ts, row.report_hash, privateKeysByReporterId);
    persistHourSignatures(dbPath, pair, row.hour_ts, signatures, reporterSetId);
    console.log('[signer] hour signed', row.hour_ts, `signers=${Object.keys(signatures).length}`);
  }

  for (const row of unsignedWindows) {
    const computed = hashWindowReport(toWindowPayload(row));
    if (computed !== row.report_hash) {
      console.error('[signer] window hash mismatch', `${row.window_seconds}:${row.window_ts}`, {
        stored: row.report_hash,
        computed
      });
      continue;
    }

    const signatures = await signAll(row.window_ts, row.report_hash, privateKeysByReporterId);
    persistWindowSignatures(
      dbPath,
      pair,
      row.window_seconds,
      row.window_ts,
      signatures,
      reporterSetId
    );
    console.log(
      '[signer] window signed',
      `${row.window_seconds}:${row.window_ts}`,
      `signers=${Object.keys(signatures).length}`
    );
  }

  if (unsignedHours.length === 0 && unsignedWindows.length === 0) {
    console.log('[signer] nothing to sign');
  }
}

await runOnce();
const timer = setInterval(() => {
  runOnce().catch((error) => {
    console.error('[signer] failed', error instanceof Error ? error.message : String(error));
  });
}, 30_000);

const shutdown = () => {
  clearInterval(timer);
  db.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function resolvePrivateKeys() {
  return {
    'reporter-1':
      process.env.FPHO_REPORTER_1_PRIVATE_KEY ?? DEFAULT_SIM_REPORTER_KEYS['reporter-1'],
    'reporter-2':
      process.env.FPHO_REPORTER_2_PRIVATE_KEY ?? DEFAULT_SIM_REPORTER_KEYS['reporter-2'],
    'reporter-3': process.env.FPHO_REPORTER_3_PRIVATE_KEY ?? DEFAULT_SIM_REPORTER_KEYS['reporter-3']
  };
}

function toHourlyPayload(row) {
  return {
    pair: row.pair,
    hour_ts: row.hour_ts.toString(),
    open_fp: row.open_fp,
    high_fp: row.high_fp,
    low_fp: row.low_fp,
    close_fp: row.close_fp,
    minute_root: row.minute_root,
    ruleset_version: row.ruleset_version,
    available_minutes: row.available_minutes.toString(),
    degraded: row.degraded === 1
  };
}

function toWindowPayload(row) {
  return {
    pair: row.pair,
    window_seconds: row.window_seconds.toString(),
    window_ts: row.window_ts.toString(),
    open_fp: row.open_fp,
    high_fp: row.high_fp,
    low_fp: row.low_fp,
    close_fp: row.close_fp,
    minute_root: row.minute_root,
    ruleset_version: row.ruleset_version,
    available_minutes: row.available_minutes.toString(),
    degraded: row.degraded === 1
  };
}

async function signAll(ts, reportHash, privateKeysByReporterId) {
  const signatures = {};

  for (const [reporterId, privateKey] of Object.entries(privateKeysByReporterId)) {
    signatures[reporterId] = await signMessage(signaturePayload(ts, reportHash), privateKey);
  }

  return signatures;
}

function signaturePayload(ts, reportHash) {
  return `fpho:${ts}:${reportHash}`;
}
