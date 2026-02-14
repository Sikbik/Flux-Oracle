import Database from 'better-sqlite3';
import Fastify, { type FastifyInstance } from 'fastify';

import {
  buildMerkleRoot,
  decodeOpReturnPayload,
  hashHourlyReport,
  hashMinuteRecord,
  minuteRange,
  toMinuteTs,
  type HourlyReport,
  type MinuteRecord
} from '@fpho/core';
import { buildSignatureBitmap, hasQuorum, verifySignature, type ReporterRegistry } from '@fpho/p2p';

import { DEFAULT_METHODOLOGY, type MethodologyDefinition } from './methodology.js';
import { DASHBOARD_HTML } from './ui.js';

export interface ApiServerOptions {
  dbPath: string;
  methodology?: MethodologyDefinition;
}

export function createApiServer(options: ApiServerOptions): FastifyInstance {
  const app = Fastify({ logger: false });
  const db = new Database(options.dbPath, { readonly: true, timeout: 5000 });
  const startedAt = Date.now();
  const methodology = options.methodology ?? DEFAULT_METHODOLOGY;

  app.addHook('onClose', async () => {
    db.close();
  });

  app.get('/', async (_request, reply) => {
    reply.header('content-type', 'text/html; charset=utf-8');
    return DASHBOARD_HTML;
  });

  app.get('/ui', async (_request, reply) => {
    reply.header('content-type', 'text/html; charset=utf-8');
    return DASHBOARD_HTML;
  });

  app.get('/docs', async () => {
    return {
      name: 'FPHO API',
      endpoints: [
        'GET /v1/price_at',
        'GET /v1/minutes',
        'GET /v1/minute/:pair/:minute_ts/venues',
        'GET /v1/anchors',
        'GET /v1/hours',
        'GET /v1/report/:pair/:hour_ts',
        'GET /v1/verify/:pair/:hour_ts',
        'GET /v1/methodology',
        'GET /healthz',
        'GET /metrics'
      ]
    };
  });

  app.get('/v1/price_at', async (request, reply) => {
    const { pair = methodology.pair, ts } = request.query as {
      pair?: string;
      ts?: string;
    };

    if (!ts || Number.isNaN(Number(ts))) {
      reply.code(400);
      return {
        error: 'invalid_ts'
      };
    }

    const timestamp = Number(ts);
    const minuteTs = toMinuteTs(timestamp);

    const row = db
      .prepare(
        `
          SELECT reference_price_fp, venues_used, degraded, degraded_reason
          FROM minute_prices
          WHERE pair = ?
            AND minute_ts = ?
          LIMIT 1
        `
      )
      .get(pair, minuteTs) as
      | {
          reference_price_fp: string | null;
          venues_used: number;
          degraded: number;
          degraded_reason: string | null;
        }
      | undefined;

    if (!row) {
      reply.code(404);
      return {
        error: 'price_not_found',
        pair,
        minute_ts: minuteTs
      };
    }

    return {
      pair,
      ts: timestamp,
      minute_ts: minuteTs,
      reference_price_fp: row.reference_price_fp,
      venues_used: row.venues_used,
      degraded: row.degraded === 1,
      degraded_reason: row.degraded_reason
    };
  });

  app.get('/v1/minutes', async (request, reply) => {
    const {
      pair = methodology.pair,
      start,
      end,
      limit = '100',
      offset = '0'
    } = request.query as {
      pair?: string;
      start?: string;
      end?: string;
      limit?: string;
      offset?: string;
    };

    if (!start || !end || Number.isNaN(Number(start)) || Number.isNaN(Number(end))) {
      reply.code(400);
      return {
        error: 'invalid_range'
      };
    }

    const startTs = Number(start);
    const endTs = Number(end);
    const resolvedLimit = Math.min(Math.max(Number(limit), 1), 1000);
    const resolvedOffset = Math.max(Number(offset), 0);

    if (startTs > endTs || Number.isNaN(resolvedLimit) || Number.isNaN(resolvedOffset)) {
      reply.code(400);
      return {
        error: 'invalid_pagination_or_range'
      };
    }

    const rows = db
      .prepare(
        `
          SELECT minute_ts, reference_price_fp, venues_used, degraded, degraded_reason
          FROM minute_prices
          WHERE pair = ?
            AND minute_ts >= ?
            AND minute_ts <= ?
          ORDER BY minute_ts ASC
          LIMIT ?
          OFFSET ?
        `
      )
      .all(pair, startTs, endTs, resolvedLimit, resolvedOffset) as Array<{
      minute_ts: number;
      reference_price_fp: string | null;
      venues_used: number;
      degraded: number;
      degraded_reason: string | null;
    }>;

    return {
      pair,
      start: startTs,
      end: endTs,
      limit: resolvedLimit,
      offset: resolvedOffset,
      items: rows.map((row) => ({
        minute_ts: row.minute_ts,
        reference_price_fp: row.reference_price_fp,
        venues_used: row.venues_used,
        degraded: row.degraded === 1,
        degraded_reason: row.degraded_reason
      }))
    };
  });

  app.get('/v1/minute/:pair/:minute_ts/venues', async (request, reply) => {
    const params = request.params as { pair?: string; minute_ts?: string };

    if (!params.pair || !params.minute_ts || Number.isNaN(Number(params.minute_ts))) {
      reply.code(400);
      return { error: 'invalid_minute_key' };
    }

    const pair = params.pair;
    const minuteTs = Number(params.minute_ts);

    const rows = db
      .prepare(
        `
          SELECT venue, price_fp, tick_count, source
          FROM venue_minute_prices
          WHERE pair = ?
            AND minute_ts = ?
          ORDER BY venue ASC
        `
      )
      .all(pair, minuteTs) as Array<{
      venue: string;
      price_fp: string | null;
      tick_count: number;
      source: string | null;
    }>;

    const venuesSeen = new Set(rows.map((row) => row.venue));
    const missing = methodology.venues.filter((venue) => !venuesSeen.has(venue));

    return {
      pair,
      minute_ts: minuteTs,
      venues: rows,
      missing_venues: missing
    };
  });

  app.get('/v1/anchors', async (request, reply) => {
    const {
      pair = methodology.pair,
      start_hour,
      end_hour,
      limit = '100',
      offset = '0'
    } = request.query as {
      pair?: string;
      start_hour?: string;
      end_hour?: string;
      limit?: string;
      offset?: string;
    };

    const resolvedLimit = Math.min(Math.max(Number(limit), 1), 1000);
    const resolvedOffset = Math.max(Number(offset), 0);
    const startHourTs = start_hour !== undefined ? Number(start_hour) : null;
    const endHourTs = end_hour !== undefined ? Number(end_hour) : null;

    if (
      Number.isNaN(resolvedLimit) ||
      Number.isNaN(resolvedOffset) ||
      (startHourTs !== null && Number.isNaN(startHourTs)) ||
      (endHourTs !== null && Number.isNaN(endHourTs)) ||
      (startHourTs !== null && endHourTs !== null && startHourTs > endHourTs)
    ) {
      reply.code(400);
      return { error: 'invalid_pagination_or_range' };
    }

    let sql = `
      SELECT
        txid,
        pair,
        hour_ts,
        report_hash,
        block_height,
        block_hash,
        confirmed,
        ipfs_cid,
        ipfs_mirror_url,
        op_return_hex
      FROM anchors
      WHERE pair = ?
    `;
    const params: unknown[] = [pair];

    if (startHourTs !== null) {
      sql += ' AND hour_ts >= ?';
      params.push(startHourTs);
    }

    if (endHourTs !== null) {
      sql += ' AND hour_ts <= ?';
      params.push(endHourTs);
    }

    sql += ' ORDER BY hour_ts ASC LIMIT ? OFFSET ?';
    params.push(resolvedLimit, resolvedOffset);

    const rows = db.prepare(sql).all(...params) as Array<{
      txid: string;
      pair: string;
      hour_ts: number;
      report_hash: string;
      block_height: number | null;
      block_hash: string | null;
      confirmed: number;
      ipfs_cid: string | null;
      ipfs_mirror_url: string | null;
      op_return_hex: string | null;
    }>;

    return {
      pair,
      start_hour: startHourTs,
      end_hour: endHourTs,
      limit: resolvedLimit,
      offset: resolvedOffset,
      items: rows.map((row) => ({
        txid: row.txid,
        pair: row.pair,
        hour_ts: row.hour_ts,
        report_hash: row.report_hash,
        block_height: row.block_height,
        block_hash: row.block_hash,
        confirmed: row.confirmed === 1,
        ipfs_cid: row.ipfs_cid,
        ipfs_mirror_url: row.ipfs_mirror_url,
        op_return_hex: row.op_return_hex
      }))
    };
  });

  app.get('/v1/hours', async (request, reply) => {
    const {
      pair = methodology.pair,
      start,
      end,
      limit = '100',
      offset = '0'
    } = request.query as {
      pair?: string;
      start?: string;
      end?: string;
      limit?: string;
      offset?: string;
    };

    if (!start || !end || Number.isNaN(Number(start)) || Number.isNaN(Number(end))) {
      reply.code(400);
      return {
        error: 'invalid_range'
      };
    }

    const startTs = Number(start);
    const endTs = Number(end);
    const resolvedLimit = Math.min(Math.max(Number(limit), 1), 1000);
    const resolvedOffset = Math.max(Number(offset), 0);

    if (startTs > endTs || Number.isNaN(resolvedLimit) || Number.isNaN(resolvedOffset)) {
      reply.code(400);
      return {
        error: 'invalid_pagination_or_range'
      };
    }

    const rows = db
      .prepare(
        `
          SELECT
            h.hour_ts,
            h.open_fp,
            h.high_fp,
            h.low_fp,
            h.close_fp,
            h.minute_root,
            h.report_hash,
            h.ruleset_version,
            h.available_minutes,
            h.degraded,
            h.reporter_set_id,
            h.signatures_json,
            a.txid AS anchor_txid,
            a.confirmed AS anchor_confirmed
          FROM hour_reports h
          LEFT JOIN anchors a
            ON a.pair = h.pair
            AND a.hour_ts = h.hour_ts
          WHERE h.pair = ?
            AND h.hour_ts >= ?
            AND h.hour_ts <= ?
          ORDER BY h.hour_ts ASC
          LIMIT ?
          OFFSET ?
        `
      )
      .all(pair, startTs, endTs, resolvedLimit, resolvedOffset) as Array<{
      hour_ts: number;
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
      signatures_json: string | null;
      anchor_txid: string | null;
      anchor_confirmed: number | null;
    }>;

    return {
      pair,
      start: startTs,
      end: endTs,
      limit: resolvedLimit,
      offset: resolvedOffset,
      items: rows.map((row) => ({
        hour_ts: row.hour_ts,
        open_fp: row.open_fp,
        high_fp: row.high_fp,
        low_fp: row.low_fp,
        close_fp: row.close_fp,
        minute_root: row.minute_root,
        report_hash: row.report_hash,
        ruleset_version: row.ruleset_version,
        available_minutes: row.available_minutes,
        degraded: row.degraded === 1,
        reporter_set_id: row.reporter_set_id,
        signatures_count: countSignatures(row.signatures_json),
        anchored: row.anchor_txid !== null,
        anchor_txid: row.anchor_txid,
        anchor_confirmed: row.anchor_confirmed === 1
      }))
    };
  });

  app.get('/v1/report/:pair/:hour_ts', async (request, reply) => {
    const params = request.params as { pair?: string; hour_ts?: string };

    if (!params.pair || !params.hour_ts || Number.isNaN(Number(params.hour_ts))) {
      reply.code(400);
      return { error: 'invalid_report_key' };
    }

    const pair = params.pair;
    const hourTs = Number(params.hour_ts);

    const report = db
      .prepare(
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
            signatures_json,
            created_at
          FROM hour_reports
          WHERE pair = ?
            AND hour_ts = ?
          LIMIT 1
        `
      )
      .get(pair, hourTs) as
      | {
          pair: string;
          hour_ts: number;
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
          signatures_json: string | null;
          created_at: number;
        }
      | undefined;

    if (!report) {
      reply.code(404);
      return {
        error: 'report_not_found',
        pair,
        hour_ts: hourTs
      };
    }

    const anchor = db
      .prepare(
        `
          SELECT
            txid,
            report_hash,
            block_height,
            block_hash,
            confirmed,
            ipfs_cid,
            ipfs_mirror_url,
            op_return_hex
          FROM anchors
          WHERE pair = ?
            AND hour_ts = ?
          LIMIT 1
        `
      )
      .get(pair, hourTs) as
      | {
          txid: string;
          report_hash: string;
          block_height: number | null;
          block_hash: string | null;
          confirmed: number;
          ipfs_cid: string | null;
          ipfs_mirror_url: string | null;
          op_return_hex: string | null;
        }
      | undefined;

    return {
      pair,
      hour_ts: hourTs,
      report: buildHourlyReportPayload(report),
      report_hash: report.report_hash,
      reporter_set_id: report.reporter_set_id,
      signatures: parseSignatures(report.signatures_json),
      created_at: report.created_at,
      anchor: anchor
        ? {
            txid: anchor.txid,
            report_hash: anchor.report_hash,
            block_height: anchor.block_height,
            block_hash: anchor.block_hash,
            confirmed: anchor.confirmed === 1,
            ipfs_cid: anchor.ipfs_cid,
            ipfs_mirror_url: anchor.ipfs_mirror_url,
            op_return_hex: anchor.op_return_hex
          }
        : null
    };
  });

  app.get('/v1/verify/:pair/:hour_ts', async (request, reply) => {
    const params = request.params as { pair?: string; hour_ts?: string };
    const query = request.query as { check_minute_root?: string };

    if (!params.pair || !params.hour_ts || Number.isNaN(Number(params.hour_ts))) {
      reply.code(400);
      return { error: 'invalid_report_key' };
    }

    const pair = params.pair;
    const hourTs = Number(params.hour_ts);
    const checkMinuteRoot =
      query.check_minute_root === '1' || query.check_minute_root === 'true';

    const report = db
      .prepare(
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
            AND hour_ts = ?
          LIMIT 1
        `
      )
      .get(pair, hourTs) as
      | {
          pair: string;
          hour_ts: number;
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
          signatures_json: string | null;
        }
      | undefined;

    if (!report) {
      reply.code(404);
      return {
        error: 'report_not_found',
        pair,
        hour_ts: hourTs
      };
    }

    const anchor = db
      .prepare(
        `
          SELECT txid, report_hash, confirmed, op_return_hex
          FROM anchors
          WHERE pair = ?
            AND hour_ts = ?
          LIMIT 1
        `
      )
      .get(pair, hourTs) as
      | {
          txid: string;
          report_hash: string;
          confirmed: number;
          op_return_hex: string | null;
        }
      | undefined;

    if (!anchor) {
      reply.code(404);
      return {
        error: 'anchor_not_found',
        pair,
        hour_ts: hourTs
      };
    }

    if (!report.reporter_set_id) {
      reply.code(422);
      return {
        error: 'reporter_set_missing',
        pair,
        hour_ts: hourTs
      };
    }

    let registry: ReporterRegistry;
    try {
      registry = loadReporterRegistry(db, report.reporter_set_id);
    } catch {
      reply.code(422);
      return {
        error: 'reporter_set_not_found',
        pair,
        hour_ts: hourTs
      };
    }

    const reportPayload = buildHourlyReportPayload(report);
    const computedReportHash = hashHourlyReport(reportPayload as HourlyReport);
    const signatures = parseSignatures(report.signatures_json);

    const expectedPairId = pairToId(pair);
    const expectedSigBitmap = buildSignatureBitmap(registry, signatures);

    const checks = {
      report_hash_match: anchor.report_hash === report.report_hash,
      report_hash_valid: computedReportHash === report.report_hash,
      op_return_present:
        typeof anchor.op_return_hex === 'string' && anchor.op_return_hex.length > 0,
      op_return_decoded: false,
      op_return_pair_match: false,
      op_return_hour_match: false,
      op_return_close_match: false,
      op_return_report_hash_match: false,
      op_return_sig_bitmap_match: false,
      quorum_valid: false,
      minute_root_match: true
    };

    let decodedPayload: {
      pairId: number;
      hourTs: number;
      closeFp: string;
      reportHash: string;
      sigBitmap: number;
    } | null = null;

    if (checks.op_return_present && anchor.op_return_hex) {
      try {
        const decoded = decodeOpReturnPayload(Buffer.from(anchor.op_return_hex, 'hex'));
        decodedPayload = {
          pairId: decoded.pairId,
          hourTs: decoded.hourTs,
          closeFp: decoded.closeFp,
          reportHash: decoded.reportHash,
          sigBitmap: decoded.sigBitmap
        };

        checks.op_return_decoded = true;
        checks.op_return_pair_match = expectedPairId === null || decoded.pairId === expectedPairId;
        checks.op_return_hour_match = decoded.hourTs === report.hour_ts;
        checks.op_return_close_match =
          report.close_fp !== null && decoded.closeFp === report.close_fp;
        checks.op_return_report_hash_match = decoded.reportHash === report.report_hash;
        checks.op_return_sig_bitmap_match = decoded.sigBitmap === expectedSigBitmap;
      } catch {
        checks.op_return_decoded = false;
      }
    }

    const validSigners = await verifyQuorumSignatures(
      registry,
      hourTs,
      report.report_hash,
      signatures
    );
    checks.quorum_valid = hasQuorum(
      registry,
      Object.fromEntries(validSigners.map((id) => [id, 'valid']))
    );

    if (checkMinuteRoot) {
      const minuteRows = db
        .prepare(
          `
            SELECT minute_ts, reference_price_fp, venues_used, degraded, degraded_reason
            FROM minute_prices
            WHERE pair = ?
              AND minute_ts >= ?
              AND minute_ts <= ?
            ORDER BY minute_ts ASC
          `
        )
        .all(pair, hourTs, hourTs + 59 * 60) as Array<{
        minute_ts: number;
        reference_price_fp: string | null;
        venues_used: number;
        degraded: number;
        degraded_reason: string | null;
      }>;

      const computedMinuteRoot = computeMinuteRoot(pair, hourTs, minuteRows);
      checks.minute_root_match = computedMinuteRoot === report.minute_root;
    }

    const verified = Object.values(checks).every((value) => value);

    return {
      pair,
      hour_ts: hourTs,
      verified,
      checks,
      report_hash: report.report_hash,
      computed_report_hash: computedReportHash,
      reporter_set_id: report.reporter_set_id,
      valid_signers: validSigners,
      anchor: {
        txid: anchor.txid,
        confirmed: anchor.confirmed === 1
      },
      decoded_payload: decodedPayload
    };
  });

  app.get('/v1/methodology', async () => methodology);

  app.get('/healthz', async () => ({ ok: true }));

  app.get('/metrics', async (_request, reply) => {
    const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
    reply.type('text/plain');
    return `fpho_api_uptime_seconds ${uptimeSeconds}\n`;
  });

  return app;
}

function parseSignatures(signaturesJson: string | null): Record<string, string> {
  if (!signaturesJson) {
    return {};
  }

  const parsed = JSON.parse(signaturesJson) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {};
  }

  const signatures: Record<string, string> = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      signatures[id] = value;
    }
  }

  return signatures;
}

function countSignatures(signaturesJson: string | null): number {
  return Object.keys(parseSignatures(signaturesJson)).length;
}

function pairToId(pair: string): number | null {
  if (pair === 'FLUXUSD') {
    return 1;
  }

  return null;
}

function buildHourlyReportPayload(report: {
  pair: string;
  hour_ts: number;
  open_fp: string | null;
  high_fp: string | null;
  low_fp: string | null;
  close_fp: string | null;
  minute_root: string;
  ruleset_version: string;
  available_minutes: number;
  degraded: number;
}): HourlyReport {
  return {
    pair: report.pair,
    hour_ts: report.hour_ts.toString(),
    open_fp: report.open_fp,
    high_fp: report.high_fp,
    low_fp: report.low_fp,
    close_fp: report.close_fp,
    minute_root: report.minute_root,
    ruleset_version: report.ruleset_version,
    available_minutes: report.available_minutes.toString(),
    degraded: report.degraded === 1
  } satisfies HourlyReport;
}

function computeMinuteRoot(
  pair: string,
  hourTs: number,
  minuteItems: Array<{
    minute_ts: number;
    reference_price_fp: string | null;
    venues_used: number;
    degraded: number;
    degraded_reason: string | null;
  }>
): string {
  const minuteMap = new Map(minuteItems.map((item) => [item.minute_ts, item]));

  const minuteRecords = minuteRange(hourTs).map((minuteTs) => {
    const minute = minuteMap.get(minuteTs);
    const degraded = minute ? minute.degraded === 1 : true;

    return {
      pair,
      minute_ts: minuteTs.toString(),
      reference_price_fp: minute?.reference_price_fp ?? null,
      venues_used: (minute?.venues_used ?? 0).toString(),
      degraded,
      degraded_reason: minute?.degraded_reason ?? 'missing_minute'
    } satisfies MinuteRecord;
  });

  const hashes = minuteRecords.map((record) => hashMinuteRecord(record));
  return buildMerkleRoot(hashes);
}

async function verifyQuorumSignatures(
  registry: ReporterRegistry,
  hourTs: number,
  reportHash: string,
  signatures: Record<string, string>
): Promise<string[]> {
  const reporterById = new Map(registry.reporters.map((entry) => [entry.id, entry.publicKey]));
  const payload = signaturePayload(hourTs, reportHash);

  const validSigners: string[] = [];

  for (const [reporterId, signature] of Object.entries(signatures)) {
    const publicKey = reporterById.get(reporterId);
    if (!publicKey) {
      continue;
    }

    try {
      const valid = await verifySignature(payload, signature, publicKey);
      if (valid) {
        validSigners.push(reporterId);
      }
    } catch {
      // Ignore malformed signatures and continue counting valid ones.
    }
  }

  return validSigners.sort((left, right) => left.localeCompare(right));
}

function signaturePayload(hourTs: number, reportHash: string): string {
  return `fpho:${hourTs}:${reportHash}`;
}

function loadReporterRegistry(
  db: Database.Database,
  reporterSetId: string
): ReporterRegistry {
  const row = db
    .prepare(
      `
        SELECT reporters_json
        FROM reporter_sets
        WHERE reporter_set_id = ?
        LIMIT 1
      `
    )
    .get(reporterSetId) as { reporters_json: string } | undefined;

  if (!row) {
    throw new Error(`reporter set not found for ${reporterSetId}`);
  }

  const parsed = JSON.parse(row.reporters_json) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('reporter_sets.reporters_json must be an object');
  }

  return parsed as ReporterRegistry;
}
