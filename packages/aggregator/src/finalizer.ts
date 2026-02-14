import Database from 'better-sqlite3';

import { toMinuteTs } from '@fpho/core';

import { aggregateMinuteReferencePrice } from './median.js';
import { lastTradeInMinute } from './perVenue.js';
import type { MinuteFinalizerConfig, RawTickRow, VenueMinutePrice } from './types.js';

export interface FinalizeMinuteResult {
  finalized: boolean;
  reason?: string;
  minuteTs: number;
  perVenueCount: number;
  aggregated: {
    referencePriceFp: string | null;
    venuesUsed: number;
    degraded: boolean;
    degradedReason: string | null;
  };
}

export class MinuteFinalizer {
  private readonly db: Database.Database;

  constructor(private readonly config: MinuteFinalizerConfig) {
    this.db = new Database(config.dbPath, { timeout: 5000 });
    this.db.pragma('journal_mode = WAL');
  }

  close(): void {
    this.db.close();
  }

  finalizeMinute(minuteTs: number, nowTs: number): FinalizeMinuteResult {
    const resolvedMinuteTs = toMinuteTs(minuteTs);
    const readyTs = resolvedMinuteTs + 60 + this.config.graceSeconds;
    if (nowTs < readyTs) {
      return {
        finalized: false,
        reason: 'grace_window_not_elapsed',
        minuteTs: resolvedMinuteTs,
        perVenueCount: 0,
        aggregated: {
          referencePriceFp: null,
          venuesUsed: 0,
          degraded: true,
          degradedReason: 'grace_window_not_elapsed'
        }
      };
    }

    const perVenueRows: VenueMinutePrice[] = [];

    for (const venue of this.config.venues) {
      const ticks = this.loadTicksForMinute(venue, resolvedMinuteTs);
      const minutePrice = lastTradeInMinute(venue, ticks);
      if (!minutePrice) {
        continue;
      }

      this.upsertVenueMinutePrice(resolvedMinuteTs, minutePrice);
      perVenueRows.push(minutePrice);
    }

    const aggregated = aggregateMinuteReferencePrice(
      perVenueRows,
      this.config.minVenuesPerMinute,
      this.config.outlierClipPct,
      this.config.venueWeights
    );

    this.upsertMinutePrice(resolvedMinuteTs, aggregated);

    return {
      finalized: true,
      minuteTs: resolvedMinuteTs,
      perVenueCount: perVenueRows.length,
      aggregated
    };
  }

  private loadTicksForMinute(venue: string, minuteTs: number): RawTickRow[] {
    const rows = this.db
      .prepare(
        `
          SELECT id, ts, price_fp, venue
          FROM raw_ticks
          WHERE pair = ?
            AND venue = ?
            AND ts >= ?
            AND ts < ?
          ORDER BY ts ASC, id ASC
        `
      )
      .all(this.config.pair, venue, minuteTs, minuteTs + 60) as RawTickRow[];

    return rows;
  }

  private upsertVenueMinutePrice(minuteTs: number, row: VenueMinutePrice): void {
    this.db
      .prepare(
        `
          INSERT INTO venue_minute_prices(pair, venue, minute_ts, price_fp, tick_count, source, updated_at)
          VALUES (?, ?, ?, ?, ?, 'ws', unixepoch())
          ON CONFLICT(pair, venue, minute_ts)
          DO UPDATE SET
            price_fp = excluded.price_fp,
            tick_count = excluded.tick_count,
            source = excluded.source,
            updated_at = excluded.updated_at
        `
      )
      .run(this.config.pair, row.venue, minuteTs, row.priceFp, row.tickCount);
  }

  private upsertMinutePrice(
    minuteTs: number,
    aggregated: {
      referencePriceFp: string | null;
      venuesUsed: number;
      degraded: boolean;
      degradedReason: string | null;
    }
  ): void {
    this.db
      .prepare(
        `
          INSERT INTO minute_prices(
            pair,
            minute_ts,
            reference_price_fp,
            venues_used,
            degraded,
            degraded_reason,
            venue_snapshot_json,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
          ON CONFLICT(pair, minute_ts)
          DO UPDATE SET
            reference_price_fp = excluded.reference_price_fp,
            venues_used = excluded.venues_used,
            degraded = excluded.degraded,
            degraded_reason = excluded.degraded_reason,
            venue_snapshot_json = excluded.venue_snapshot_json,
            updated_at = excluded.updated_at
        `
      )
      .run(
        this.config.pair,
        minuteTs,
        aggregated.referencePriceFp,
        aggregated.venuesUsed,
        aggregated.degraded ? 1 : 0,
        aggregated.degradedReason,
        null
      );
  }
}
