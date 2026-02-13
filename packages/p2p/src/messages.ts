import { canonicalizeJsonToBytes, sha256 } from '@fpho/core';

export type MessageType = 'OBS' | 'PROPOSE' | 'SIG' | 'FINAL';

export interface BaseP2PMessage {
  type: MessageType;
  reporterSetId: string;
  hourTs: number;
  reporterId: string;
  nonce: string;
  sentAt: number;
}

export interface ObsMessage extends BaseP2PMessage {
  type: 'OBS';
  observationHash: string;
}

export interface ProposeMessage extends BaseP2PMessage {
  type: 'PROPOSE';
  leaderId: string;
  reportHash: string;
}

export interface SigMessage extends BaseP2PMessage {
  type: 'SIG';
  reportHash: string;
  signature: string;
}

export interface FinalMessage extends BaseP2PMessage {
  type: 'FINAL';
  reportHash: string;
  signatures: Record<string, string>;
}

export type P2PMessage = ObsMessage | ProposeMessage | SigMessage | FinalMessage;

export function validateP2PMessage(input: unknown): input is P2PMessage {
  if (!isObject(input)) {
    return false;
  }

  const baseFieldsValid =
    isString(input.type) &&
    isString(input.reporterSetId) &&
    isNumber(input.hourTs) &&
    isString(input.reporterId) &&
    isString(input.nonce) &&
    isNumber(input.sentAt);

  if (!baseFieldsValid) {
    return false;
  }

  if (input.type === 'OBS') {
    return isString(input.observationHash);
  }

  if (input.type === 'PROPOSE') {
    return isString(input.leaderId) && isString(input.reportHash);
  }

  if (input.type === 'SIG') {
    return isString(input.reportHash) && isString(input.signature);
  }

  if (input.type === 'FINAL') {
    return isString(input.reportHash) && isObject(input.signatures);
  }

  return false;
}

export function messageId(message: P2PMessage): string {
  return sha256(
    canonicalizeJsonToBytes({
      type: message.type,
      reporter_set_id: message.reporterSetId,
      hour_ts: message.hourTs.toString(),
      reporter_id: message.reporterId,
      nonce: message.nonce
    })
  );
}

export class ReplayProtector {
  private readonly seen = new Map<string, number>();

  constructor(private readonly ttlMs: number) {}

  accept(message: P2PMessage, nowMs = Date.now()): boolean {
    this.prune(nowMs);

    const id = messageId(message);
    if (this.seen.has(id)) {
      return false;
    }

    this.seen.set(id, nowMs);
    return true;
  }

  private prune(nowMs: number): void {
    for (const [id, seenAt] of this.seen.entries()) {
      if (nowMs - seenAt > this.ttlMs) {
        this.seen.delete(id);
      }
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
