import {
  computeReporterSetId,
  derivePublicKey,
  electLeader,
  type FinalMessage,
  type ProposeMessage,
  type ReporterRegistry,
  type SigMessage
} from '@fpho/p2p';

import { QuorumCoordinator } from './quorum.js';

export const DEFAULT_SIM_REPORTER_KEYS: Readonly<Record<string, string>> = {
  'reporter-1': '6c17f725f4fcd6d7b2f3a5a8b4ef7d1f2e5a2260bc257f8fef4d4d357ca8f35e',
  'reporter-2': '7f2ea4ecf89758de6f4e6b932f85f88f84f2135ad7ef8bde0f4e5f5f38e30a0d',
  'reporter-3': '4f9858cb6f8da9fd4aa9c45f2e8d9932d18c1df2ad7d6851124c596cb8f1795e'
};

export interface QuorumSimulationOptions {
  hourTs: number;
  reportHash: string;
  threshold?: number;
  privateKeysByReporterId?: Record<string, string>;
}

export interface QuorumSimulationResult {
  reporterSetId: string;
  leaderId: string;
  finalMessage: FinalMessage;
}

export async function buildSimulationRegistry(
  privateKeysByReporterId: Record<string, string>,
  threshold = 2
): Promise<ReporterRegistry> {
  const reporterEntries = Object.entries(privateKeysByReporterId).sort(([left], [right]) =>
    left.localeCompare(right)
  );

  if (reporterEntries.length === 0) {
    throw new Error('at least one reporter key is required');
  }

  if (threshold <= 0 || threshold > reporterEntries.length) {
    throw new Error('invalid threshold for simulation registry');
  }

  return {
    version: 'v1',
    threshold,
    reporters: await Promise.all(
      reporterEntries.map(async ([id, privateKey]) => ({
        id,
        publicKey: await derivePublicKey(privateKey)
      }))
    )
  };
}

export async function simulateQuorumRound(
  options: QuorumSimulationOptions
): Promise<QuorumSimulationResult> {
  const privateKeysByReporterId = options.privateKeysByReporterId ?? {
    ...DEFAULT_SIM_REPORTER_KEYS
  };

  const registry = await buildSimulationRegistry(privateKeysByReporterId, options.threshold ?? 2);
  const reporterSetId = computeReporterSetId(registry);
  const reporterIds = registry.reporters.map((entry) => entry.id);
  const leaderId = electLeader(reporterIds, reporterSetId, options.hourTs);

  const proposal: ProposeMessage = {
    type: 'PROPOSE',
    reporterSetId,
    hourTs: options.hourTs,
    reporterId: leaderId,
    nonce: `proposal:${options.hourTs}`,
    sentAt: Math.floor(Date.now() / 1000),
    leaderId,
    reportHash: options.reportHash
  };

  const coordinators = new Map<string, QuorumCoordinator>();

  for (const entry of registry.reporters) {
    const privateKey = privateKeysByReporterId[entry.id];
    if (!privateKey) {
      throw new Error(`missing private key for ${entry.id}`);
    }

    coordinators.set(
      entry.id,
      new QuorumCoordinator({
        registry,
        reporterId: entry.id,
        privateKeyHex: privateKey
      })
    );
  }

  const signatures: SigMessage[] = [];

  for (const reporterId of reporterIds) {
    const coordinator = coordinators.get(reporterId);
    if (!coordinator) {
      throw new Error(`missing coordinator for ${reporterId}`);
    }

    const signatureMessage = await coordinator.signIfProposalMatches(proposal, options.reportHash);

    if (!signatureMessage) {
      throw new Error(`reporter ${reporterId} rejected proposal`);
    }

    signatures.push(signatureMessage);
  }

  const leaderCoordinator = coordinators.get(leaderId);
  if (!leaderCoordinator) {
    throw new Error(`missing coordinator for leader ${leaderId}`);
  }

  for (const signature of signatures) {
    const accepted = await leaderCoordinator.collectSignature(signature);
    if (!accepted) {
      throw new Error(`leader rejected signature from ${signature.reporterId}`);
    }
  }

  const finalMessage = leaderCoordinator.buildFinalMessage({
    reporterSetId,
    hourTs: options.hourTs,
    reportHash: options.reportHash,
    reporterId: leaderId,
    nonce: `final:${options.hourTs}`,
    sentAt: Math.floor(Date.now() / 1000)
  });

  if (!finalMessage) {
    throw new Error('simulation failed to reach quorum finalization');
  }

  return {
    reporterSetId,
    leaderId,
    finalMessage
  };
}
