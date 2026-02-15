import Database from 'better-sqlite3';

import {
  computeReporterSetId,
  hasQuorum,
  signMessage,
  verifySignature,
  type FinalMessage,
  type ProposeMessage,
  type ReporterRegistry,
  type SigMessage
} from '@fpho/p2p';

export interface QuorumCoordinatorConfig {
  registry: ReporterRegistry;
  reporterId: string;
  privateKeyHex: string;
}

export class QuorumCoordinator {
  private readonly signatures = new Map<string, string>();

  constructor(private readonly config: QuorumCoordinatorConfig) {}

  async signIfProposalMatches(
    proposal: ProposeMessage,
    computedReportHash: string
  ): Promise<SigMessage | null> {
    if (proposal.reportHash !== computedReportHash) {
      return null;
    }

    const signature = await signMessage(
      signaturePayload(proposal.hourTs, proposal.reportHash),
      this.config.privateKeyHex
    );

    this.signatures.set(this.config.reporterId, signature);

    return {
      type: 'SIG',
      reporterSetId: proposal.reporterSetId,
      hourTs: proposal.hourTs,
      reporterId: this.config.reporterId,
      nonce: `${proposal.nonce}:${this.config.reporterId}`,
      sentAt: Math.floor(Date.now() / 1000),
      reportHash: proposal.reportHash,
      signature
    };
  }

  async collectSignature(signatureMessage: SigMessage): Promise<boolean> {
    const reporter = this.config.registry.reporters.find(
      (entry) => entry.id === signatureMessage.reporterId
    );

    if (!reporter) {
      return false;
    }

    const valid = await verifySignature(
      signaturePayload(signatureMessage.hourTs, signatureMessage.reportHash),
      signatureMessage.signature,
      reporter.publicKey
    );

    if (!valid) {
      return false;
    }

    this.signatures.set(signatureMessage.reporterId, signatureMessage.signature);
    return true;
  }

  hasThresholdQuorum(): boolean {
    return hasQuorum(this.config.registry, Object.fromEntries(this.signatures.entries()));
  }

  buildFinalMessage(base: {
    reporterSetId: string;
    hourTs: number;
    reportHash: string;
    reporterId: string;
    nonce: string;
    sentAt: number;
  }): FinalMessage | null {
    if (!this.hasThresholdQuorum()) {
      return null;
    }

    return {
      type: 'FINAL',
      reporterSetId: base.reporterSetId,
      hourTs: base.hourTs,
      reporterId: base.reporterId,
      nonce: base.nonce,
      sentAt: base.sentAt,
      reportHash: base.reportHash,
      signatures: Object.fromEntries(this.signatures.entries())
    };
  }
}

export function persistHourSignatures(
  dbPath: string,
  pair: string,
  hourTs: number,
  signatures: Record<string, string>,
  reporterSetId: string
): void {
  const db = new Database(dbPath, { timeout: 5000 });
  db.pragma('journal_mode = WAL');

  try {
    db.prepare(
      `
        UPDATE hour_reports
        SET signatures_json = ?
        WHERE pair = ?
          AND hour_ts = ?
      `
    ).run(JSON.stringify(signatures), pair, hourTs);

    db.prepare(
      `
        UPDATE hour_reports
        SET reporter_set_id = ?
        WHERE pair = ?
          AND hour_ts = ?
      `
    ).run(reporterSetId, pair, hourTs);
  } finally {
    db.close();
  }
}

export function persistWindowSignatures(
  dbPath: string,
  pair: string,
  windowSeconds: number,
  windowTs: number,
  signatures: Record<string, string>,
  reporterSetId: string
): void {
  const db = new Database(dbPath, { timeout: 5000 });
  db.pragma('journal_mode = WAL');

  try {
    db.prepare(
      `
        UPDATE window_reports
        SET signatures_json = ?
        WHERE pair = ?
          AND window_seconds = ?
          AND window_ts = ?
      `
    ).run(JSON.stringify(signatures), pair, windowSeconds, windowTs);

    db.prepare(
      `
        UPDATE window_reports
        SET reporter_set_id = ?
        WHERE pair = ?
          AND window_seconds = ?
          AND window_ts = ?
      `
    ).run(reporterSetId, pair, windowSeconds, windowTs);
  } finally {
    db.close();
  }
}

export function persistReporterSet(dbPath: string, registry: ReporterRegistry): string {
  const reporterSetId = computeReporterSetId(registry);
  const db = new Database(dbPath, { timeout: 5000 });
  db.pragma('journal_mode = WAL');

  try {
    const normalized = normalizeRegistry(registry);
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
    ).run(reporterSetId, JSON.stringify(normalized), normalized.threshold);
  } finally {
    db.close();
  }

  return reporterSetId;
}

function signaturePayload(hourTs: number, reportHash: string): string {
  return `fpho:${hourTs}:${reportHash}`;
}

function normalizeRegistry(registry: ReporterRegistry): ReporterRegistry {
  return {
    version: registry.version,
    threshold: registry.threshold,
    reporters: [...registry.reporters].sort((left, right) => left.id.localeCompare(right.id))
  };
}
