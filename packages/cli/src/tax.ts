import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { fixedPointScale, formatFixedToDecimal, parseDecimalToFixed } from '@fpho/core';

export interface TaxTransactionInput {
  txid: string;
  timestamp: number;
  direction: 'in' | 'out';
  amount: string;
  asset?: string;
  note?: string;
}

export interface TaxExportInput {
  baseUrl: string;
  pair: string;
  inputPath: string;
  outputDir: string;
}

export interface TaxExportResult {
  total: number;
  incomeCount: number;
  disposalCount: number;
  fullLedgerPath: string;
  incomePath: string;
  disposalsPath: string;
}

export interface TaxExportDeps {
  fetchImpl?: typeof fetch;
  readTextFile?: (filePath: string) => Promise<string>;
  writeTextFile?: (filePath: string, content: string) => Promise<void>;
  mkdirPath?: (dirPath: string) => Promise<void>;
}

interface PriceAtResponse {
  reference_price_fp: string | null;
  minute_ts: number;
  degraded: boolean;
  degraded_reason: string | null;
}

interface TaxLedgerRow {
  txid: string;
  timestamp: number;
  minuteTs: number;
  direction: 'in' | 'out';
  asset: string;
  amountFlux: string;
  priceUsd: string;
  fmvUsd: string;
  degraded: boolean;
  degradedReason: string | null;
  note: string;
}

export async function runTaxExport(
  input: TaxExportInput,
  deps: TaxExportDeps = {}
): Promise<TaxExportResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const readTextFile = deps.readTextFile ?? ((filePath: string) => readFile(filePath, 'utf8'));
  const writeTextFile =
    deps.writeTextFile ??
    ((filePath: string, content: string) => writeFile(filePath, content, 'utf8').then(() => {}));
  const mkdirPath =
    deps.mkdirPath ?? ((dirPath: string) => mkdir(dirPath, { recursive: true }).then(() => {}));

  const inputJson = await readTextFile(input.inputPath);
  const parsed = JSON.parse(inputJson) as unknown;
  const transactions = parseTransactions(parsed).sort(sortTransactions);

  const rows: TaxLedgerRow[] = [];
  for (const tx of transactions) {
    const priceAt = await fetchJson<PriceAtResponse>(
      `${normalizeBaseUrl(input.baseUrl)}/v1/price_at?pair=${encodeURIComponent(input.pair)}&ts=${tx.timestamp}`,
      fetchImpl
    );

    if (!priceAt.reference_price_fp) {
      throw new Error(
        `price_at returned null reference price for tx ${tx.txid} at ${tx.timestamp} (${priceAt.degraded_reason ?? 'unknown'})`
      );
    }

    const amountFp = parseDecimalToFixed(tx.amount);
    const fmvFp = multiplyFixed(amountFp, priceAt.reference_price_fp);

    rows.push({
      txid: tx.txid,
      timestamp: tx.timestamp,
      minuteTs: priceAt.minute_ts,
      direction: tx.direction,
      asset: tx.asset ?? '',
      amountFlux: tx.amount,
      priceUsd: formatFixedToDecimal(priceAt.reference_price_fp),
      fmvUsd: formatFixedToDecimal(fmvFp),
      degraded: priceAt.degraded,
      degradedReason: priceAt.degraded_reason,
      note: tx.note ?? ''
    });
  }

  await mkdirPath(input.outputDir);

  const fullLedgerPath = path.resolve(input.outputDir, 'full_ledger.csv');
  const incomePath = path.resolve(input.outputDir, 'income.csv');
  const disposalsPath = path.resolve(input.outputDir, 'disposals.csv');

  await writeTextFile(fullLedgerPath, toCsv(rows));
  await writeTextFile(incomePath, toCsv(rows.filter((row) => row.direction === 'in')));
  await writeTextFile(disposalsPath, toCsv(rows.filter((row) => row.direction === 'out')));

  return {
    total: rows.length,
    incomeCount: rows.filter((row) => row.direction === 'in').length,
    disposalCount: rows.filter((row) => row.direction === 'out').length,
    fullLedgerPath,
    incomePath,
    disposalsPath
  };
}

export async function runTaxCli(
  argv: readonly string[],
  options: {
    fetchImpl?: typeof fetch;
    log?: (line: string) => void;
  } = {}
): Promise<number> {
  const log = options.log ?? console.log;
  const parsed = parseTaxArgs(argv);

  if (parsed.help) {
    log(taxUsageText());
    return 0;
  }

  if (!parsed.inputPath || !parsed.outputDir) {
    log(taxUsageText());
    return 1;
  }

  const result = await runTaxExport(
    {
      baseUrl: parsed.baseUrl,
      pair: parsed.pair,
      inputPath: parsed.inputPath,
      outputDir: parsed.outputDir
    },
    {
      fetchImpl: options.fetchImpl
    }
  );

  log(`total=${result.total} income=${result.incomeCount} disposals=${result.disposalCount}`);
  log(`full_ledger=${result.fullLedgerPath}`);
  log(`income=${result.incomePath}`);
  log(`disposals=${result.disposalsPath}`);

  return 0;
}

export function taxUsageText(): string {
  return [
    'Usage: fpho-tax-export --input <JSON_PATH> --out-dir <DIR> [options]',
    '',
    'Options:',
    '  --base-url <URL>     API base URL (default: http://localhost:3000)',
    '  --pair <PAIR>        Trading pair (default: FLUXUSD)',
    '  --input <PATH>       Input JSON transaction list',
    '  --out-dir <DIR>      Output directory for CSV exports',
    '  --help               Show this message'
  ].join('\n');
}

interface ParsedTaxArgs {
  help: boolean;
  baseUrl: string;
  pair: string;
  inputPath: string | null;
  outputDir: string | null;
}

function parseTaxArgs(argv: readonly string[]): ParsedTaxArgs {
  const parsed: ParsedTaxArgs = {
    help: false,
    baseUrl: 'http://localhost:3000',
    pair: 'FLUXUSD',
    inputPath: null,
    outputDir: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--help' || token === '-h') {
      parsed.help = true;
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

    if (token === '--input') {
      parsed.inputPath = next;
      index += 1;
      continue;
    }

    if (token === '--out-dir') {
      parsed.outputDir = next;
      index += 1;
      continue;
    }
  }

  return parsed;
}

function parseTransactions(input: unknown): TaxTransactionInput[] {
  if (!Array.isArray(input)) {
    throw new Error('input transaction file must contain a JSON array');
  }

  return input.map((entry, index) => parseTransaction(entry, index));
}

function parseTransaction(input: unknown, index: number): TaxTransactionInput {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error(`transaction at index ${index} must be an object`);
  }

  const txid = readString(input, 'txid', index);
  const direction = readString(input, 'direction', index);
  const amount = readString(input, 'amount', index);
  const timestampValue = (input as Record<string, unknown>)['timestamp'];

  if (direction !== 'in' && direction !== 'out') {
    throw new Error(`transaction ${txid} has invalid direction: ${direction}`);
  }

  if (typeof timestampValue !== 'number' || !Number.isFinite(timestampValue)) {
    throw new Error(`transaction ${txid} has invalid timestamp`);
  }

  parseDecimalToFixed(amount);

  return {
    txid,
    timestamp: Math.floor(timestampValue),
    direction,
    amount,
    asset:
      typeof (input as Record<string, unknown>)['asset'] === 'string'
        ? ((input as Record<string, unknown>)['asset'] as string)
        : undefined,
    note:
      typeof (input as Record<string, unknown>)['note'] === 'string'
        ? ((input as Record<string, unknown>)['note'] as string)
        : undefined
  };
}

async function fetchJson<T>(url: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`request failed: ${url} (${response.status})`);
  }

  return (await response.json()) as T;
}

function multiplyFixed(left: string, right: string): string {
  return ((BigInt(left) * BigInt(right)) / fixedPointScale()).toString();
}

function sortTransactions(left: TaxTransactionInput, right: TaxTransactionInput): number {
  if (left.timestamp !== right.timestamp) {
    return left.timestamp - right.timestamp;
  }

  return left.txid.localeCompare(right.txid);
}

function toCsv(rows: readonly TaxLedgerRow[]): string {
  const header = [
    'txid',
    'timestamp',
    'minute_ts',
    'direction',
    'asset',
    'amount_flux',
    'price_usd',
    'fmv_usd',
    'degraded',
    'degraded_reason',
    'note'
  ].join(',');

  const lines = rows.map((row) =>
    [
      row.txid,
      row.timestamp.toString(),
      row.minuteTs.toString(),
      row.direction,
      row.asset,
      row.amountFlux,
      row.priceUsd,
      row.fmvUsd,
      row.degraded ? 'true' : 'false',
      row.degradedReason ?? '',
      row.note
    ]
      .map(csvEscape)
      .join(',')
  );

  return `${header}\n${lines.join('\n')}\n`;
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function readString(input: object, key: string, index: number): string {
  const value = (input as Record<string, unknown>)[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`transaction at index ${index} has invalid ${key}`);
  }

  return value.trim();
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}
