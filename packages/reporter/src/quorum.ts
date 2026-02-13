import Database from 'better-sqlite3';

import {
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
  signatures: Record<string, string>
): void {
  const db = new Database(dbPath);

  try {
    db.prepare(
      `
        UPDATE hour_reports
        SET signatures_json = ?
        WHERE pair = ?
          AND hour_ts = ?
      `
    ).run(JSON.stringify(signatures), pair, hourTs);
  } finally {
    db.close();
  }
}

function signaturePayload(hourTs: number, reportHash: string): string {
  return `fpho:${hourTs}:${reportHash}`;
}
