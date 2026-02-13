import Database from 'better-sqlite3';
import path from 'node:path';

import { runMigrations } from '../packages/api/src/index.js';
import { HourlyReportFinalizer, MinuteFinalizer } from '../packages/aggregator/src/index.js';

const pair = process.env.FPHO_PAIR ?? 'FLUXUSD';
const dbPath = path.resolve(process.env.FPHO_DB_PATH ?? 'data/fpho.sqlite');
const hourTs =
  process.env.FPHO_HOUR_TS !== undefined
    ? Number(process.env.FPHO_HOUR_TS)
    : Math.floor(Date.now() / 1000 / 3600) * 3600 - 3600;

const venues = ['binance', 'kraken', 'mexc'];

runMigrations({ dbPath, migrationsDir: path.resolve('db/migrations') });

const db = new Database(dbPath);

db.exec(
  'DELETE FROM raw_ticks; DELETE FROM venue_minute_prices; DELETE FROM minute_prices; DELETE FROM hour_reports;'
);

const insertTick = db.prepare(
  `
    INSERT INTO raw_ticks(pair, venue, ts, price_fp, size_fp, side, source)
    VALUES (?, ?, ?, ?, ?, ?, 'ws')
  `
);

for (let minuteIndex = 0; minuteIndex < 60; minuteIndex += 1) {
  const minuteTs = hourTs + minuteIndex * 60;

  for (const [venueIndex, venue] of venues.entries()) {
    const baseline = 62800000 + minuteIndex * 5000;
    const venueOffset = (venueIndex - 1) * 2000;
    const price = String(baseline + venueOffset);

    insertTick.run(pair, venue, minuteTs + 30, price, '100000000', 'buy');
  }
}

db.close();

const minuteFinalizer = new MinuteFinalizer({
  dbPath,
  pair,
  venues,
  graceSeconds: 0,
  minVenuesPerMinute: 2,
  outlierClipPct: 10
});

for (let minuteIndex = 0; minuteIndex < 60; minuteIndex += 1) {
  const minuteTs = hourTs + minuteIndex * 60;
  minuteFinalizer.finalizeMinute(minuteTs, minuteTs + 90);
}
minuteFinalizer.close();

const hourlyFinalizer = new HourlyReportFinalizer({
  dbPath,
  pair,
  rulesetVersion: 'v1'
});

const hourly = hourlyFinalizer.finalizeHour(hourTs);
hourlyFinalizer.close();

console.log('simulate_hour complete');
console.log(`pair=${pair} hour_ts=${hourTs}`);
console.log(`minute_root=${hourly.minuteRoot}`);
console.log(`report_hash=${hourly.reportHash}`);
console.log(
  `open=${String(hourly.report.open_fp)} high=${String(hourly.report.high_fp)} low=${String(hourly.report.low_fp)} close=${String(hourly.report.close_fp)}`
);
