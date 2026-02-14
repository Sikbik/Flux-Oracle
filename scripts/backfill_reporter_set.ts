import { readFile } from 'node:fs/promises';
import path from 'node:path';

import Database from 'better-sqlite3';
import { computeReporterSetId, type ReporterRegistry } from '@fpho/p2p';

interface ParsedArgs {
  dbPath: string;
  registryPath: string | null;
  reporterSetId: string | null;
  dryRun: boolean;
}

function usageText(): string {
  return [
    'Usage: pnpm db:backfill-reporter-set -- [options]',
    '',
    'Options:',
    '  --db-path <PATH>           Path to SQLite DB (default: $FPHO_DB_PATH or data/fpho.sqlite)',
    '  --registry <PATH>          Reporter registry JSON file (computes reporter_set_id)',
    '  --reporter-set-id <ID>     Reporter set id to apply directly',
    '  --dry-run                  Print counts without writing'
  ].join('\n');
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    dbPath: path.resolve(process.env.FPHO_DB_PATH ?? 'data/fpho.sqlite'),
    registryPath: null,
    reporterSetId: null,
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next) {
      continue;
    }

    if (token === '--db-path') {
      parsed.dbPath = path.resolve(next);
      index += 1;
      continue;
    }

    if (token === '--registry') {
      parsed.registryPath = next;
      index += 1;
      continue;
    }

    if (token === '--reporter-set-id') {
      parsed.reporterSetId = next;
      index += 1;
      continue;
    }
  }

  return parsed;
}

async function loadRegistry(registryPath: string): Promise<ReporterRegistry> {
  const raw = await readFile(registryPath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('registry file must contain a JSON object');
  }

  return parsed as ReporterRegistry;
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (!parsed.registryPath && !parsed.reporterSetId) {
    console.error(usageText());
    process.exitCode = 1;
    return;
  }

  let reporterSetId = parsed.reporterSetId ?? null;
  let registry: ReporterRegistry | null = null;

  if (parsed.registryPath) {
    registry = await loadRegistry(parsed.registryPath);
    reporterSetId = computeReporterSetId(registry);
  }

  if (!reporterSetId) {
    throw new Error('reporter_set_id is required');
  }

  const db = new Database(parsed.dbPath);
  try {
    if (registry) {
      db.prepare(
        `
          INSERT INTO reporter_sets(reporter_set_id, reporters_json, threshold, created_at)
          VALUES (?, ?, ?, unixepoch())
          ON CONFLICT(reporter_set_id)
          DO UPDATE SET
            reporters_json = excluded.reporters_json,
            threshold = excluded.threshold,
            created_at = excluded.created_at
        `
      ).run(reporterSetId, JSON.stringify(registry), registry.threshold);
    }

    const hourCount = db
      .prepare('SELECT COUNT(*) AS count FROM hour_reports WHERE reporter_set_id IS NULL')
      .get() as { count: number };

    const anchorCount = db
      .prepare('SELECT COUNT(*) AS count FROM anchors WHERE reporter_set_id IS NULL')
      .get() as { count: number };

    if (parsed.dryRun) {
      console.log(`hour_reports_missing=${hourCount.count}`);
      console.log(`anchors_missing=${anchorCount.count}`);
      console.log(`reporter_set_id=${reporterSetId}`);
      return;
    }

    const hourResult = db
      .prepare('UPDATE hour_reports SET reporter_set_id = ? WHERE reporter_set_id IS NULL')
      .run(reporterSetId);

    const anchorResult = db
      .prepare('UPDATE anchors SET reporter_set_id = ? WHERE reporter_set_id IS NULL')
      .run(reporterSetId);

    console.log(`reporter_set_id=${reporterSetId}`);
    console.log(`hour_reports_updated=${hourResult.changes}`);
    console.log(`anchors_updated=${anchorResult.changes}`);
  } finally {
    db.close();
  }
}

void main();
