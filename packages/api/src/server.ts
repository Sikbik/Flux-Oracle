import Database from 'better-sqlite3';
import Fastify, { type FastifyInstance } from 'fastify';

import { toMinuteTs } from '@fpho/core';

import { DEFAULT_METHODOLOGY, type MethodologyDefinition } from './methodology.js';

export interface ApiServerOptions {
  dbPath: string;
  methodology?: MethodologyDefinition;
}

export function createApiServer(options: ApiServerOptions): FastifyInstance {
  const app = Fastify({ logger: false });
  const db = new Database(options.dbPath, { readonly: true });
  const startedAt = Date.now();
  const methodology = options.methodology ?? DEFAULT_METHODOLOGY;

  app.addHook('onClose', async () => {
    db.close();
  });

  app.get('/docs', async () => {
    return {
      name: 'FPHO API',
      endpoints: [
        'GET /v1/price_at',
        'GET /v1/minutes',
        'GET /v1/methodology',
        'GET /healthz',
        'GET /metrics'
      ]
    };
  });

  app.get('/v1/price_at', async (request, reply) => {
    const { pair = methodology.pair, ts } = request.query as {
      pair?: string;
      ts?: string;
    };

    if (!ts || Number.isNaN(Number(ts))) {
      reply.code(400);
      return {
        error: 'invalid_ts'
      };
    }

    const timestamp = Number(ts);
    const minuteTs = toMinuteTs(timestamp);

    const row = db
      .prepare(
        `
          SELECT reference_price_fp, venues_used, degraded, degraded_reason
          FROM minute_prices
          WHERE pair = ?
            AND minute_ts = ?
          LIMIT 1
        `
      )
      .get(pair, minuteTs) as
      | {
          reference_price_fp: string | null;
          venues_used: number;
          degraded: number;
          degraded_reason: string | null;
        }
      | undefined;

    if (!row) {
      reply.code(404);
      return {
        error: 'price_not_found',
        pair,
        minute_ts: minuteTs
      };
    }

    return {
      pair,
      ts: timestamp,
      minute_ts: minuteTs,
      reference_price_fp: row.reference_price_fp,
      venues_used: row.venues_used,
      degraded: row.degraded === 1,
      degraded_reason: row.degraded_reason
    };
  });

  app.get('/v1/minutes', async (request, reply) => {
    const {
      pair = methodology.pair,
      start,
      end,
      limit = '100',
      offset = '0'
    } = request.query as {
      pair?: string;
      start?: string;
      end?: string;
      limit?: string;
      offset?: string;
    };

    if (!start || !end || Number.isNaN(Number(start)) || Number.isNaN(Number(end))) {
      reply.code(400);
      return {
        error: 'invalid_range'
      };
    }

    const startTs = Number(start);
    const endTs = Number(end);
    const resolvedLimit = Math.min(Math.max(Number(limit), 1), 1000);
    const resolvedOffset = Math.max(Number(offset), 0);

    if (startTs > endTs || Number.isNaN(resolvedLimit) || Number.isNaN(resolvedOffset)) {
      reply.code(400);
      return {
        error: 'invalid_pagination_or_range'
      };
    }

    const rows = db
      .prepare(
        `
          SELECT minute_ts, reference_price_fp, venues_used, degraded, degraded_reason
          FROM minute_prices
          WHERE pair = ?
            AND minute_ts >= ?
            AND minute_ts <= ?
          ORDER BY minute_ts ASC
          LIMIT ?
          OFFSET ?
        `
      )
      .all(pair, startTs, endTs, resolvedLimit, resolvedOffset) as Array<{
      minute_ts: number;
      reference_price_fp: string | null;
      venues_used: number;
      degraded: number;
      degraded_reason: string | null;
    }>;

    return {
      pair,
      start: startTs,
      end: endTs,
      limit: resolvedLimit,
      offset: resolvedOffset,
      items: rows.map((row) => ({
        minute_ts: row.minute_ts,
        reference_price_fp: row.reference_price_fp,
        venues_used: row.venues_used,
        degraded: row.degraded === 1,
        degraded_reason: row.degraded_reason
      }))
    };
  });

  app.get('/v1/methodology', async () => methodology);

  app.get('/healthz', async () => ({ ok: true }));

  app.get('/metrics', async (_request, reply) => {
    const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
    reply.type('text/plain');
    return `fpho_api_uptime_seconds ${uptimeSeconds}\n`;
  });

  return app;
}
