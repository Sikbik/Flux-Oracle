import Database from 'better-sqlite3';

import {
  buildMerkleRoot,
  hashHourlyReport,
  hashMinuteRecord,
  minuteRange,
  type HourlyReport,
  type MinuteRecord
} from '@fpho/core';

export interface MinutePriceInput {
  minuteTs: number;
  referencePriceFp: string | null;
  venuesUsed: number;
  degraded: boolean;
  degradedReason: string | null;
}

export interface HourlyBuildResult {
  report: HourlyReportPayload;
  reportHash: string;
  minuteRecords: MinuteRecord[];
  minuteHashes: string[];
  minuteRoot: string;
}

export interface HourlyReportPayload {
  pair: string;
  hour_ts: string;
  open_fp: string | null;
  high_fp: string | null;
  low_fp: string | null;
  close_fp: string | null;
  minute_root: string;
  ruleset_version: string;
  available_minutes: string;
  degraded: boolean;
}

export interface HourlyFinalizerConfig {
  dbPath: string;
  pair: string;
  rulesetVersion: string;
}

export function buildHourlyReportFromMinutes(
  pair: string,
  hourTs: number,
  minutes: readonly MinutePriceInput[],
  rulesetVersion: string
): HourlyBuildResult {
  const minuteMap = new Map(minutes.map((entry) => [entry.minuteTs, entry]));

  const minuteRecords = minuteRange(hourTs).map((minuteTs) => {
    const minute = minuteMap.get(minuteTs);

    return {
      pair,
      minute_ts: minuteTs.toString(),
      reference_price_fp: minute?.referencePriceFp ?? null,
      venues_used: (minute?.venuesUsed ?? 0).toString(),
      degraded: minute?.degraded ?? true,
      degraded_reason: minute?.degradedReason ?? 'missing_minute'
    } satisfies MinuteRecord;
  });

  const minuteHashes = minuteRecords.map((entry) => hashMinuteRecord(entry));
  const minuteRoot = buildMerkleRoot(minuteHashes);

  const resolvedMinuteValues = minuteRecords
    .map((entry) => {
      const minuteTs = Number(entry.minute_ts);
      const referencePriceFp =
        typeof entry.reference_price_fp === 'string' ? entry.reference_price_fp : null;
      return {
        minuteTs,
        referencePriceFp
      };
    })
    .filter((entry) => entry.referencePriceFp !== null) as Array<{
    minuteTs: number;
    referencePriceFp: string;
  }>;

  resolvedMinuteValues.sort((left, right) => left.minuteTs - right.minuteTs);

  const open = resolvedMinuteValues[0]?.referencePriceFp ?? null;
  const close = resolvedMinuteValues[resolvedMinuteValues.length - 1]?.referencePriceFp ?? null;
  const high =
    resolvedMinuteValues.length === 0
      ? null
      : maxFixedPoint(resolvedMinuteValues.map((entry) => entry.referencePriceFp));
  const low =
    resolvedMinuteValues.length === 0
      ? null
      : minFixedPoint(resolvedMinuteValues.map((entry) => entry.referencePriceFp));

  const degraded = resolvedMinuteValues.length < 60;

  const report = {
    pair,
    hour_ts: hourTs.toString(),
    open_fp: open,
    high_fp: high,
    low_fp: low,
    close_fp: close,
    minute_root: minuteRoot,
    ruleset_version: rulesetVersion,
    available_minutes: resolvedMinuteValues.length.toString(),
    degraded
  } satisfies HourlyReportPayload;

  return {
    report,
    reportHash: hashHourlyReport(report as unknown as HourlyReport),
    minuteRecords,
    minuteHashes,
    minuteRoot
  };
}

export class HourlyReportFinalizer {
  private readonly db: Database.Database;

  constructor(private readonly config: HourlyFinalizerConfig) {
    this.db = new Database(config.dbPath, { timeout: 5000 });
    this.db.pragma('journal_mode = WAL');
  }

  close(): void {
    this.db.close();
  }

  finalizeHour(hourTs: number): HourlyBuildResult {
    const minuteRows = this.db
      .prepare(
        `
          SELECT minute_ts, reference_price_fp, venues_used, degraded, degraded_reason
          FROM minute_prices
          WHERE pair = ?
            AND minute_ts >= ?
            AND minute_ts < ?
        `
      )
      .all(this.config.pair, hourTs, hourTs + 3600) as Array<{
      minute_ts: number;
      reference_price_fp: string | null;
      venues_used: number;
      degraded: number;
      degraded_reason: string | null;
    }>;

    const build = buildHourlyReportFromMinutes(
      this.config.pair,
      hourTs,
      minuteRows.map((entry) => ({
        minuteTs: entry.minute_ts,
        referencePriceFp: entry.reference_price_fp,
        venuesUsed: entry.venues_used,
        degraded: entry.degraded === 1,
        degradedReason: entry.degraded_reason
      })),
      this.config.rulesetVersion
    );

    this.db
      .prepare(
        `
          INSERT INTO hour_reports(
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
            signatures_json,
            reporter_set_id,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, unixepoch())
          ON CONFLICT(pair, hour_ts)
          DO UPDATE SET
            open_fp = excluded.open_fp,
            high_fp = excluded.high_fp,
            low_fp = excluded.low_fp,
            close_fp = excluded.close_fp,
            minute_root = excluded.minute_root,
            report_hash = excluded.report_hash,
            ruleset_version = excluded.ruleset_version,
            available_minutes = excluded.available_minutes,
            degraded = excluded.degraded,
            signatures_json = excluded.signatures_json,
            reporter_set_id = excluded.reporter_set_id,
            created_at = excluded.created_at
        `
      )
      .run(
        this.config.pair,
        hourTs,
        nullableString(build.report.open_fp),
        nullableString(build.report.high_fp),
        nullableString(build.report.low_fp),
        nullableString(build.report.close_fp),
        build.minuteRoot,
        build.reportHash,
        this.config.rulesetVersion,
        Number(build.report.available_minutes),
        build.report.degraded ? 1 : 0
      );

    return build;
  }
}

function maxFixedPoint(values: readonly string[]): string {
  const first = values[0];
  if (first === undefined) {
    throw new Error('cannot compute max for empty values');
  }

  let best = BigInt(first);

  for (const value of values) {
    const current = BigInt(value);
    if (current > best) {
      best = current;
    }
  }

  return best.toString();
}

function minFixedPoint(values: readonly string[]): string {
  const first = values[0];
  if (first === undefined) {
    throw new Error('cannot compute min for empty values');
  }

  let best = BigInt(first);

  for (const value of values) {
    const current = BigInt(value);
    if (current < best) {
      best = current;
    }
  }

  return best.toString();
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
