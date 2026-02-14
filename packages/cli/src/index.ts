import { readFile } from 'node:fs/promises';

import {
  buildMerkleRoot,
  decodeOpReturnPayload,
  hashHourlyReport,
  hashMinuteRecord,
  minuteRange,
  type HourlyReport,
  type MinuteRecord
} from '@fpho/core';
import { buildSignatureBitmap, hasQuorum, verifySignature, type ReporterRegistry } from '@fpho/p2p';

export interface VerifyCommandInput {
  baseUrl: string;
  pair: string;
  hourTs: number;
  registry: ReporterRegistry;
  checkMinuteRoot?: boolean;
}

export interface VerifyChecks {
  anchor_found: boolean;
  report_found: boolean;
  report_hash_match: boolean;
  report_hash_valid: boolean;
  op_return_match: boolean;
  quorum_valid: boolean;
  minute_root_match: boolean;
}

export interface VerifyCommandResult {
  ok: boolean;
  checks: VerifyChecks;
  reportHash: string;
  anchorTxid: string;
  validSigners: string[];
}

export interface VerifyCommandDeps {
  fetchImpl?: typeof fetch;
}

interface AnchorItem {
  txid: string;
  report_hash: string;
  op_return_hex: string | null;
}

interface ReportPayload {
  report: {
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
  };
  report_hash: string;
  signatures: Record<string, string>;
  reporter_set_id?: string | null;
}

interface MinutesPayload {
  items: Array<{
    minute_ts: number;
    reference_price_fp: string | null;
    venues_used: number;
    degraded: boolean;
    degraded_reason: string | null;
  }>;
}

export async function runVerifyCommand(
  input: VerifyCommandInput,
  deps: VerifyCommandDeps = {}
): Promise<VerifyCommandResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;

  const anchor = await fetchAnchor(input.baseUrl, input.pair, input.hourTs, fetchImpl);
  if (!anchor) {
    return failedResult({
      anchor_found: false,
      report_found: false,
      report_hash_match: false,
      report_hash_valid: false,
      op_return_match: false,
      quorum_valid: false,
      minute_root_match: false
    });
  }

  const reportPayload = await fetchJson<ReportPayload>(
    `${normalizeBaseUrl(input.baseUrl)}/v1/report/${encodeURIComponent(input.pair)}/${input.hourTs}`,
    fetchImpl
  );

  const report = reportPayload.report;
  const computedReportHash = hashHourlyReport(report as HourlyReport);
  const reportHashMatch = anchor.report_hash === reportPayload.report_hash;
  const reportHashValid = computedReportHash === reportPayload.report_hash;
  const expectedPairId = pairToId(input.pair);
  const expectedSigBitmap = buildSignatureBitmap(input.registry, reportPayload.signatures);
  const opReturnMatch = verifyOpReturn(
    anchor.op_return_hex,
    reportPayload.report_hash,
    input.hourTs,
    report.close_fp,
    expectedPairId,
    expectedSigBitmap
  );
  const validSigners = await verifyQuorumSignatures(
    input.registry,
    input.hourTs,
    reportPayload.report_hash,
    reportPayload.signatures
  );
  const quorumValid = hasQuorum(
    input.registry,
    Object.fromEntries(validSigners.map((id) => [id, 'valid']))
  );

  let minuteRootMatch = true;
  if (input.checkMinuteRoot) {
    const minutesPayload = await fetchJson<MinutesPayload>(
      `${normalizeBaseUrl(input.baseUrl)}/v1/minutes?pair=${encodeURIComponent(input.pair)}&start=${input.hourTs}&end=${input.hourTs + 59 * 60}&limit=60&offset=0`,
      fetchImpl
    );

    const computedMinuteRoot = computeMinuteRoot(input.pair, input.hourTs, minutesPayload.items);
    minuteRootMatch = computedMinuteRoot === report.minute_root;
  }

  const checks: VerifyChecks = {
    anchor_found: true,
    report_found: true,
    report_hash_match: reportHashMatch,
    report_hash_valid: reportHashValid,
    op_return_match: opReturnMatch,
    quorum_valid: quorumValid,
    minute_root_match: minuteRootMatch
  };

  return {
    ok: Object.values(checks).every((value) => value),
    checks,
    reportHash: reportPayload.report_hash,
    anchorTxid: anchor.txid,
    validSigners
  };
}

export async function runCli(
  argv: readonly string[],
  options: {
    fetchImpl?: typeof fetch;
    log?: (line: string) => void;
  } = {}
): Promise<number> {
  const log = options.log ?? console.log;
  const parsed = parseArgs(argv);

  if (parsed.help) {
    log(usageText());
    return 0;
  }

  if (!parsed.pair || parsed.hourTs === null || !parsed.registryPath) {
    log(usageText());
    return 1;
  }

  const registryJson = await readFile(parsed.registryPath, 'utf8');
  const registry = JSON.parse(registryJson) as ReporterRegistry;

  const result = await runVerifyCommand(
    {
      baseUrl: parsed.baseUrl,
      pair: parsed.pair,
      hourTs: parsed.hourTs,
      registry,
      checkMinuteRoot: parsed.checkMinuteRoot
    },
    {
      fetchImpl: options.fetchImpl
    }
  );

  log(`pair=${parsed.pair} hour_ts=${parsed.hourTs}`);
  log(`anchor_txid=${result.anchorTxid}`);
  log(`report_hash=${result.reportHash}`);
  log(`valid_signers=${result.validSigners.join(',')}`);
  log(`status=${result.ok ? 'verified' : 'failed'}`);

  return result.ok ? 0 : 2;
}

export function usageText(): string {
  return [
    'Usage: fpho-verify --pair <PAIR> --hour <HOUR_TS> --registry <PATH> [options]',
    '',
    'Options:',
    '  --base-url <URL>         API base URL (default: http://localhost:3000)',
    '  --pair <PAIR>            Trading pair, e.g. FLUXUSD',
    '  --hour <HOUR_TS>         UTC hour timestamp in seconds',
    '  --registry <PATH>        Reporter registry JSON file',
    '  --check-minute-root      Recompute minute merkle root from /v1/minutes',
    '  --help                   Show this message'
  ].join('\n');
}

interface ParsedArgs {
  help: boolean;
  baseUrl: string;
  pair: string | null;
  hourTs: number | null;
  registryPath: string | null;
  checkMinuteRoot: boolean;
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    help: false,
    baseUrl: 'http://localhost:3000',
    pair: null,
    hourTs: null,
    registryPath: null,
    checkMinuteRoot: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--help' || token === '-h') {
      parsed.help = true;
      continue;
    }

    if (token === '--check-minute-root') {
      parsed.checkMinuteRoot = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next) {
      continue;
    }

    if (token === '--base-url') {
      parsed.baseUrl = next;
      index += 1;
      continue;
    }

    if (token === '--pair') {
      parsed.pair = next;
      index += 1;
      continue;
    }

    if (token === '--hour') {
      const parsedHour = Number(next);
      parsed.hourTs = Number.isNaN(parsedHour) ? null : parsedHour;
      index += 1;
      continue;
    }

    if (token === '--registry') {
      parsed.registryPath = next;
      index += 1;
      continue;
    }
  }

  return parsed;
}

async function fetchAnchor(
  baseUrl: string,
  pair: string,
  hourTs: number,
  fetchImpl: typeof fetch
): Promise<AnchorItem | null> {
  const url =
    `${normalizeBaseUrl(baseUrl)}/v1/anchors?pair=${encodeURIComponent(pair)}` +
    `&start_hour=${hourTs}&end_hour=${hourTs}&limit=1&offset=0`;

  const payload = await fetchJson<{ items?: AnchorItem[] }>(url, fetchImpl);
  const first = payload.items?.[0];

  return first ?? null;
}

async function fetchJson<T>(url: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`request failed: ${url} (${response.status})`);
  }

  return (await response.json()) as T;
}

function verifyOpReturn(
  opReturnHex: string | null,
  expectedReportHash: string,
  expectedHourTs: number,
  expectedCloseFp: string | null,
  expectedPairId: number | null,
  expectedSigBitmap: number
): boolean {
  if (!opReturnHex || expectedCloseFp === null) {
    return false;
  }

  try {
    const decoded = decodeOpReturnPayload(Buffer.from(opReturnHex, 'hex'));
    return (
      (expectedPairId === null || decoded.pairId === expectedPairId) &&
      decoded.reportHash === expectedReportHash &&
      decoded.hourTs === expectedHourTs &&
      decoded.closeFp === expectedCloseFp &&
      decoded.sigBitmap === expectedSigBitmap
    );
  } catch {
    return false;
  }
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

function computeMinuteRoot(
  pair: string,
  hourTs: number,
  minuteItems: MinutesPayload['items']
): string {
  const minuteByTs = new Map(minuteItems.map((item) => [item.minute_ts, item]));

  const minuteRecords = minuteRange(hourTs).map((minuteTs) => {
    const minute = minuteByTs.get(minuteTs);
    return {
      pair,
      minute_ts: minuteTs.toString(),
      reference_price_fp: minute?.reference_price_fp ?? null,
      venues_used: (minute?.venues_used ?? 0).toString(),
      degraded: minute?.degraded ?? true,
      degraded_reason: minute?.degraded_reason ?? 'missing_minute'
    } satisfies MinuteRecord;
  });

  const hashes = minuteRecords.map((record) => hashMinuteRecord(record));
  return buildMerkleRoot(hashes);
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function pairToId(pair: string): number | null {
  if (pair === 'FLUXUSD') {
    return 1;
  }

  return null;
}

function failedResult(checks: VerifyChecks): VerifyCommandResult {
  return {
    ok: false,
    checks,
    reportHash: '',
    anchorTxid: '',
    validSigners: []
  };
}

export {
  runTaxCli,
  runTaxExport,
  taxUsageText,
  type TaxExportInput,
  type TaxExportResult
} from './tax.js';
