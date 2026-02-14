import { canonicalizeJsonToBytes, sha256 } from '@fpho/core';

export interface ReporterDefinition {
  id: string;
  publicKey: string;
}

export interface ReporterRegistry {
  version: string;
  threshold: number;
  reporters: ReporterDefinition[];
}

export interface ReporterSetInfo {
  reporterSetId: string;
  quorumSize: number;
  threshold: number;
}

export function sortedReporterIds(registry: ReporterRegistry): string[] {
  validateRegistry(registry);
  return [...registry.reporters]
    .map((entry) => entry.id)
    .sort((left, right) => left.localeCompare(right));
}

export function buildSignatureBitmap(
  registry: ReporterRegistry,
  signaturesByReporterId: Readonly<Record<string, string>>
): number {
  const orderedIds = sortedReporterIds(registry);
  if (orderedIds.length > 32) {
    throw new Error('signature bitmap supports at most 32 signers');
  }

  let bitmap = 0;
  for (const [index, reporterId] of orderedIds.entries()) {
    if (signaturesByReporterId[reporterId]) {
      bitmap = (bitmap | (1 << index)) >>> 0;
    }
  }
  return bitmap;
}

export function computeReporterSetId(registry: ReporterRegistry): string {
  validateRegistry(registry);

  const canonicalPayload = {
    version: registry.version,
    threshold: registry.threshold.toString(),
    reporters: [...registry.reporters]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((entry) => ({
        id: entry.id,
        public_key: entry.publicKey
      }))
  };

  return sha256(canonicalizeJsonToBytes(canonicalPayload));
}

export function getReporterSetInfo(registry: ReporterRegistry): ReporterSetInfo {
  validateRegistry(registry);

  return {
    reporterSetId: computeReporterSetId(registry),
    quorumSize: registry.reporters.length,
    threshold: registry.threshold
  };
}

export function hasQuorum(
  registry: ReporterRegistry,
  signaturesByReporterId: Readonly<Record<string, string>>
): boolean {
  validateRegistry(registry);

  const allowedReporterIds = new Set(registry.reporters.map((entry) => entry.id));
  const validSignerCount = Object.keys(signaturesByReporterId).filter((id) =>
    allowedReporterIds.has(id)
  ).length;

  return validSignerCount >= registry.threshold;
}

function validateRegistry(registry: ReporterRegistry): void {
  if (!registry.version) {
    throw new Error('registry version is required');
  }

  if (!Number.isInteger(registry.threshold) || registry.threshold <= 0) {
    throw new Error('registry threshold must be a positive integer');
  }

  if (registry.reporters.length === 0) {
    throw new Error('registry must contain at least one reporter');
  }

  if (registry.threshold > registry.reporters.length) {
    throw new Error('registry threshold cannot exceed reporter count');
  }
}
