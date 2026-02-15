import { assertNoNumbers, canonicalizeJsonToBytes, type CanonicalJson } from './canonicalize.js';
import { sha256 } from './hash.js';

export type MinuteRecord = CanonicalJson;
export type HourlyReport = CanonicalJson;
export type WindowReport = CanonicalJson;

export function canonicalizeMinuteRecord(minuteRecord: MinuteRecord): Uint8Array {
  assertNoNumbers(minuteRecord);
  return canonicalizeJsonToBytes(minuteRecord as CanonicalJson);
}

export function hashMinuteRecord(minuteRecord: MinuteRecord): string {
  return sha256(canonicalizeMinuteRecord(minuteRecord));
}

export function canonicalizeHourlyReport(report: HourlyReport): Uint8Array {
  assertNoNumbers(report);
  return canonicalizeJsonToBytes(report as CanonicalJson);
}

export function hashHourlyReport(report: HourlyReport): string {
  return sha256(canonicalizeHourlyReport(report));
}

export function canonicalizeWindowReport(report: WindowReport): Uint8Array {
  assertNoNumbers(report);
  return canonicalizeJsonToBytes(report as CanonicalJson);
}

export function hashWindowReport(report: WindowReport): string {
  return sha256(canonicalizeWindowReport(report));
}
