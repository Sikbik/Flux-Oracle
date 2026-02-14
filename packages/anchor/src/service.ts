import Database from 'better-sqlite3';

import { encodeOpReturnPayload, type OpReturnPayload } from '@fpho/core';
import { buildSignatureBitmap, type ReporterRegistry } from '@fpho/p2p';

import { buildIpfsMirrorUrl, type IpfsPublisher } from './ipfs.js';
import { broadcastOpReturnHex, type FluxRpcTransport } from './rpc.js';

export interface PairIdMap {
  [pair: string]: number;
}

export const DEFAULT_PAIR_ID_MAP: Readonly<PairIdMap> = {
  FLUXUSD: 1
};

export interface AnchorHourReportOptions {
  dbPath: string;
  pair: string;
  hourTs: number;
  fluxRpc: FluxRpcTransport;
  ipfsPublisher?: IpfsPublisher;
  ipfsGatewayBaseUrl?: string;
  pairIdMap?: PairIdMap;
}

export interface AnchorHourReportResult {
  txid: string;
  opReturnHex: string;
  opReturnPayload: OpReturnPayload;
  ipfsCid: string | null;
  ipfsMirrorUrl: string | null;
}

interface HourReportRow {
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

export async function anchorHourReport(
  options: AnchorHourReportOptions
): Promise<AnchorHourReportResult> {
  const db = new Database(options.dbPath);

  try {
    const report = loadHourReport(db, options.pair, options.hourTs);
    const closeFp = report.close_fp;

    if (closeFp === null) {
      throw new Error(`hour report ${options.pair}:${options.hourTs} has no close_fp`);
    }

    if (!report.reporter_set_id) {
      throw new Error(`hour report ${options.pair}:${options.hourTs} is missing reporter_set_id`);
    }

    const pairId = resolvePairId(options.pair, options.pairIdMap ?? DEFAULT_PAIR_ID_MAP);
    const registry = loadReporterRegistry(db, report.reporter_set_id);
    const signatures = parseSignatures(report.signatures_json);
    const sigBitmap = buildSignatureBitmap(registry, signatures);
    const opReturnPayload = buildAnchorPayload({
      pairId,
      hourTs: options.hourTs,
      closeFp,
      reportHash: report.report_hash,
      sigBitmap
    });
    const opReturnHex = Buffer.from(encodeOpReturnPayload(opReturnPayload)).toString('hex');

    let ipfsCid: string | null = null;
    let ipfsMirrorUrl: string | null = null;

    if (options.ipfsPublisher) {
      const publishResult = await options.ipfsPublisher.addJson(toIpfsDocument(report));
      ipfsCid = publishResult.cid;
      ipfsMirrorUrl = buildIpfsMirrorUrl(publishResult.cid, options.ipfsGatewayBaseUrl);
    }

    const broadcast = await broadcastOpReturnHex(options.fluxRpc, opReturnHex);

    db.prepare(
      `
        INSERT INTO anchors(
          txid,
          pair,
          hour_ts,
          report_hash,
          reporter_set_id,
          ipfs_cid,
          ipfs_mirror_url,
          op_return_hex,
          confirmed,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, unixepoch())
        ON CONFLICT(pair, hour_ts)
        DO UPDATE SET
          txid = excluded.txid,
          report_hash = excluded.report_hash,
          reporter_set_id = excluded.reporter_set_id,
          ipfs_cid = excluded.ipfs_cid,
          ipfs_mirror_url = excluded.ipfs_mirror_url,
          op_return_hex = excluded.op_return_hex,
          confirmed = excluded.confirmed,
          created_at = excluded.created_at
      `
    ).run(
      broadcast.txid,
      options.pair,
      options.hourTs,
      report.report_hash,
      report.reporter_set_id,
      ipfsCid,
      ipfsMirrorUrl,
      opReturnHex
    );

    return {
      txid: broadcast.txid,
      opReturnHex,
      opReturnPayload,
      ipfsCid,
      ipfsMirrorUrl
    };
  } finally {
    db.close();
  }
}

export function buildAnchorPayload(input: {
  pairId: number;
  hourTs: number;
  closeFp: string;
  reportHash: string;
  sigBitmap: number;
}): OpReturnPayload {
  return {
    pairId: input.pairId,
    hourTs: input.hourTs,
    closeFp: input.closeFp,
    reportHash: input.reportHash,
    sigBitmap: input.sigBitmap
  };
}

function loadHourReport(db: Database.Database, pair: string, hourTs: number): HourReportRow {
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
    .get(pair, hourTs) as HourReportRow | undefined;

  if (!report) {
    throw new Error(`hour report not found for ${pair}:${hourTs}`);
  }

  return report;
}

function resolvePairId(pair: string, pairIdMap: PairIdMap): number {
  const pairId = pairIdMap[pair];

  if (pairId === undefined) {
    throw new Error(`no pair id mapping configured for ${pair}`);
  }

  return pairId;
}

function toIpfsDocument(report: HourReportRow): Record<string, unknown> {
  return {
    pair: report.pair,
    hour_ts: report.hour_ts.toString(),
    open_fp: report.open_fp,
    high_fp: report.high_fp,
    low_fp: report.low_fp,
    close_fp: report.close_fp,
    minute_root: report.minute_root,
    report_hash: report.report_hash,
    ruleset_version: report.ruleset_version,
    available_minutes: report.available_minutes.toString(),
    degraded: report.degraded !== 0,
    reporter_set_id: report.reporter_set_id,
    signatures: parseSignatures(report.signatures_json)
  };
}

function parseSignatures(signaturesJson: string | null): Record<string, string> {
  if (!signaturesJson) {
    return {};
  }

  const parsed = JSON.parse(signaturesJson) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('signatures_json must be an object');
  }

  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error(`invalid signature for ${key}`);
    }

    normalized[key] = value;
  }

  return normalized;
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
