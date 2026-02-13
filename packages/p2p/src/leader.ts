import { canonicalizeJsonToBytes, sha256 } from '@fpho/core';

export function electLeader(
  reporterIds: readonly string[],
  reporterSetId: string,
  hourTs: number
): string {
  if (reporterIds.length === 0) {
    throw new Error('cannot elect leader from empty reporter set');
  }

  const sorted = [...reporterIds].sort((a, b) => a.localeCompare(b));
  const seed = sha256(
    canonicalizeJsonToBytes({
      reporter_set_id: reporterSetId,
      hour_ts: hourTs.toString()
    })
  );

  const index = Number(BigInt(`0x${seed.slice(0, 8)}`) % BigInt(sorted.length));
  const leader = sorted[index];
  if (!leader) {
    throw new Error('failed to elect leader');
  }
  return leader;
}
