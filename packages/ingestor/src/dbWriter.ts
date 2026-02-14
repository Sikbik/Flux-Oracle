import Database from 'better-sqlite3';

import type { TickBatch } from './types.js';

export class RawTickWriter {
  private readonly db: Database.Database;

  private readonly writeBatchStatement: (ticks: TickBatch) => void;

  private readonly pruneOldTicksStatement: { run: (pair: string, cutoffTs: number) => number };

  constructor(dbPath: string) {
    this.db = new Database(dbPath, { timeout: 5000 });
    this.db.pragma('journal_mode = WAL');

    const insertTick = this.db.prepare(`
      INSERT INTO raw_ticks(pair, venue, ts, price_fp, size_fp, side, source)
      VALUES (@pair, @venue, @ts, @price, @size, @side, 'ws')
    `);

    this.writeBatchStatement = this.db.transaction((ticks: TickBatch) => {
      for (const tick of ticks) {
        insertTick.run({
          pair: tick.pair,
          venue: tick.venue,
          ts: tick.ts,
          price: tick.price,
          size: tick.size ?? null,
          side: tick.side ?? null
        });
      }
    });

    const deleteOldTicks = this.db.prepare(`
      DELETE FROM raw_ticks
      WHERE pair = ?
        AND ts < ?
    `);

    this.pruneOldTicksStatement = {
      run: (pair: string, cutoffTs: number) => deleteOldTicks.run(pair, cutoffTs).changes
    };
  }

  writeBatch(ticks: TickBatch): void {
    if (ticks.length === 0) {
      return;
    }

    this.writeBatchStatement(ticks);
  }

  pruneTicksBefore(pair: string, cutoffTs: number): number {
    return this.pruneOldTicksStatement.run(pair, cutoffTs);
  }

  close(): void {
    this.db.close();
  }
}
