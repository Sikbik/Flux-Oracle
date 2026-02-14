import WebSocket from 'ws';

import { BaseVenueAdapter } from './adapter.js';
import { ExponentialBackoff, scheduleReconnect } from './backoff.js';
import { normalizeRawTick } from './normalize.js';
import type { NormalizationInput } from './types.js';

export abstract class WebSocketVenueAdapter extends BaseVenueAdapter {
  private readonly backoff = new ExponentialBackoff();

  private reconnectTimer: NodeJS.Timeout | undefined;

  private socket: WebSocket | undefined;

  private pingTimer: NodeJS.Timeout | undefined;

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
    try {
      await this.openSocket();
    } catch (error) {
      const resolved = error instanceof Error ? error : new Error(String(error));
      if (!this.socket) {
        this.emit('error', resolved);
      }
      this.scheduleReconnectIfNeeded();
    }
  }

  async disconnect(): Promise<void> {
    this.intentionallyDisconnected = true;
    this.backoff.reset();
    this.clearReconnectTimer();
    this.clearPingTimer();

    if (this.socket) {
      this.socket.removeAllListeners();
      if (this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.terminate();
      } else {
        this.socket.close();
      }
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

  protected handleControlMessage(payload: unknown): boolean {
    void payload;
    return false;
  }

  protected getSubscribeDelayMs(): number {
    return 0;
  }

  protected getPingIntervalMs(): number | null {
    return null;
  }

  protected buildPingMessage(): unknown | null {
    return null;
  }

  protected sendMessage(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  protected async resolveWsUrl(): Promise<string> {
    return this.wsUrl;
  }

  private async openSocket(): Promise<void> {
    const resolvedUrl = await this.resolveWsUrl();
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(resolvedUrl);
      this.socket = socket;

      socket.once('open', () => {
        this.backoff.reset();
        if (this.hasConnectedOnce) {
          this.emit('reconnect');
        }
        this.hasConnectedOnce = true;
        this.startPingTimer();
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
        this.clearPingTimer();
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

    if (this.handleControlMessage(payload)) {
      return;
    }

    const ticks = this.parseMessage(payload);
    for (const tick of ticks) {
      this.emitTick(normalizeRawTick(tick));
    }
  }

  private sendSubscriptionsForPair(pair: string): void {
    const delay = this.getSubscribeDelayMs();
    const send = () => {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      const venueSymbol = this.mapPairToVenueSymbol(pair);
      const messages = this.buildSubscribeMessages(venueSymbol);
      for (const message of messages) {
        this.sendMessage(message);
      }
    };

    if (delay > 0) {
      setTimeout(send, delay);
      return;
    }

    send();
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

  private startPingTimer(): void {
    const interval = this.getPingIntervalMs();
    const initialMessage = this.buildPingMessage();
    if (!interval || !initialMessage) {
      return;
    }

    this.clearPingTimer();
    this.pingTimer = setInterval(() => {
      const message = this.buildPingMessage();
      if (message) {
        this.socket?.send(JSON.stringify(message));
      }
    }, interval);
  }

  private clearPingTimer(): void {
    if (!this.pingTimer) {
      return;
    }

    clearInterval(this.pingTimer);
    this.pingTimer = undefined;
  }
}
