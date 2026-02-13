import { createServer, type Server } from 'node:http';
import path from 'node:path';
import { EventEmitter } from 'node:events';

import type { NormalizedTick, VenueAdapter } from '@fpho/venues';

import type {
  IngestorConfig,
  IngestorDependencies,
  IngestorStats,
  VenueRuntimeStats
} from './types.js';
import { RawTickWriter } from './dbWriter.js';

export class IngestorService {
  private readonly adapters: VenueAdapter[];

  private readonly config: IngestorConfig;

  private readonly queue: NormalizedTick[] = [];

  private readonly statsByVenue = new Map<string, VenueRuntimeStats>();

  private totalTicks = 0;

  private flushTimer: NodeJS.Timeout | undefined;

  private writer: RawTickWriter | undefined;

  private healthServer: Server | undefined;

  constructor(config: IngestorConfig, dependencies: IngestorDependencies) {
    this.config = {
      ...config,
      dbPath: path.resolve(process.cwd(), config.dbPath)
    };
    this.adapters = dependencies.adapters;

    for (const adapter of this.adapters) {
      this.statsByVenue.set(adapter.venueId, {
        lastTickTs: null,
        receivedTicks: 0,
        disconnectCount: 0,
        reconnectCount: 0
      });
    }
  }

  async start(): Promise<void> {
    this.writer = new RawTickWriter(this.config.dbPath);

    for (const adapter of this.adapters) {
      this.bindAdapter(adapter);
      await adapter.connect();
      await adapter.subscribe(this.config.pair);
    }

    this.flushTimer = setInterval(() => {
      this.flushQueue();
    }, this.config.flushIntervalMs);

    await this.startHealthServer();
  }

  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    this.flushQueue();

    for (const adapter of this.adapters) {
      await adapter.disconnect();
    }

    if (this.healthServer) {
      await new Promise<void>((resolve, reject) => {
        this.healthServer?.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      this.healthServer = undefined;
    }

    this.writer?.close();
    this.writer = undefined;
  }

  getStats(): IngestorStats {
    return {
      queuedTicks: this.queue.length,
      totalTicks: this.totalTicks,
      venueStats: Object.fromEntries(this.statsByVenue.entries())
    };
  }

  getHealthPort(): number | null {
    if (!this.healthServer) {
      return null;
    }

    const address = this.healthServer.address();
    if (!address || typeof address === 'string') {
      return null;
    }

    return address.port;
  }

  private bindAdapter(adapter: VenueAdapter): void {
    if (!(adapter instanceof EventEmitter)) {
      throw new Error('adapter must extend EventEmitter for ingestor observability');
    }

    const observableAdapter = adapter as VenueAdapter & EventEmitter;

    observableAdapter.on('tick', (tick: NormalizedTick) => {
      this.enqueueTick(tick);
    });

    observableAdapter.on('disconnect', () => {
      const stats = this.statsByVenue.get(adapter.venueId);
      if (stats) {
        stats.disconnectCount += 1;
      }
    });

    observableAdapter.on('reconnect', () => {
      const stats = this.statsByVenue.get(adapter.venueId);
      if (stats) {
        stats.reconnectCount += 1;
      }
    });
  }

  private enqueueTick(tick: NormalizedTick): void {
    this.queue.push(tick);
    this.totalTicks += 1;

    const stats = this.statsByVenue.get(tick.venue);
    if (stats) {
      stats.lastTickTs = tick.ts;
      stats.receivedTicks += 1;
    }

    if (this.queue.length >= this.config.batchSize) {
      this.flushQueue();
    }
  }

  private flushQueue(): void {
    if (!this.writer || this.queue.length === 0) {
      return;
    }

    const toWrite = this.queue.splice(0, this.queue.length);
    this.writer.writeBatch(toWrite);
  }

  private async startHealthServer(): Promise<void> {
    this.healthServer = createServer((request, response) => {
      if (request.url !== '/healthz') {
        response.statusCode = 404;
        response.end('not found');
        return;
      }

      response.statusCode = 200;
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          ok: true,
          stats: this.getStats()
        })
      );
    });

    await new Promise<void>((resolve, reject) => {
      this.healthServer?.listen(this.config.healthPort, '127.0.0.1', (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
