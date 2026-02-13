import WebSocket from 'ws';

import { BaseVenueAdapter } from './adapter.js';
import { ExponentialBackoff, scheduleReconnect } from './backoff.js';
import { normalizeRawTick } from './normalize.js';
import type { NormalizationInput } from './types.js';

export abstract class WebSocketVenueAdapter extends BaseVenueAdapter {
  private readonly backoff = new ExponentialBackoff();

  private reconnectTimer: NodeJS.Timeout | undefined;

  private socket: WebSocket | undefined;

  private intentionallyDisconnected = false;

  private readonly subscribedPairs = new Set<string>();

  private hasConnectedOnce = false;

  constructor(private readonly wsUrl: string) {
    super();
  }

  async connect(): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.intentionallyDisconnected = false;
    await this.openSocket();
  }

  async disconnect(): Promise<void> {
    this.intentionallyDisconnected = true;
    this.backoff.reset();
    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = undefined;
    }
  }

  async subscribe(pair: string): Promise<void> {
    this.subscribedPairs.add(pair);

    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.sendSubscriptionsForPair(pair);
  }

  protected abstract buildSubscribeMessages(venueSymbol: string): unknown[];

  protected abstract mapPairToVenueSymbol(pair: string): string;

  protected abstract parseMessage(payload: unknown): NormalizationInput[];

  private async openSocket(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(this.wsUrl);
      this.socket = socket;

      socket.once('open', () => {
        this.backoff.reset();
        if (this.hasConnectedOnce) {
          this.emit('reconnect');
        }
        this.hasConnectedOnce = true;
        for (const pair of this.subscribedPairs) {
          this.sendSubscriptionsForPair(pair);
        }
        resolve();
      });

      socket.on('message', (data) => {
        this.handleSocketMessage(data.toString());
      });

      socket.on('close', () => {
        this.socket = undefined;
        this.emit('disconnect');
        this.scheduleReconnectIfNeeded();
      });

      socket.on('error', (error) => {
        this.emit('error', error);
        if (socket.readyState !== WebSocket.OPEN) {
          reject(error);
        }
      });
    });
  }

  private handleSocketMessage(raw: string): void {
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const ticks = this.parseMessage(payload);
    for (const tick of ticks) {
      this.emitTick(normalizeRawTick(tick));
    }
  }

  private sendSubscriptionsForPair(pair: string): void {
    const venueSymbol = this.mapPairToVenueSymbol(pair);
    const messages = this.buildSubscribeMessages(venueSymbol);
    for (const message of messages) {
      this.socket?.send(JSON.stringify(message));
    }
  }

  private scheduleReconnectIfNeeded(): void {
    if (this.intentionallyDisconnected) {
      return;
    }

    this.clearReconnectTimer();
    this.reconnectTimer = scheduleReconnect(this.backoff, () => {
      void this.connect().catch(() => {
        // Reconnect loop is intentionally resilient to transient network failures.
      });
    });
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }
}
