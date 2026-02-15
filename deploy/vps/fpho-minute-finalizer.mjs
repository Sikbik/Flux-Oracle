import { MinuteFinalizer } from '../../packages/aggregator/dist/index.js';
import { DEFAULT_METHODOLOGY } from '../../packages/api/dist/index.js';

const dbPath = process.env.FPHO_DB_PATH ?? 'data/fpho.sqlite';
const pair = process.env.FPHO_PAIR ?? DEFAULT_METHODOLOGY.pair;

const finalizer = new MinuteFinalizer({
  dbPath,
  pair,
  venues: DEFAULT_METHODOLOGY.venues,
  graceSeconds: DEFAULT_METHODOLOGY.graceSeconds,
  minVenuesPerMinute: DEFAULT_METHODOLOGY.minVenuesPerMinute,
  outlierClipPct: DEFAULT_METHODOLOGY.outlierClipPct
});

const finalizeWindow = () => {
  const nowTs = Math.floor(Date.now() / 1000);
  const grace = DEFAULT_METHODOLOGY.graceSeconds;
  const baseMinute = Math.floor((nowTs - (60 + grace)) / 60) * 60;
  for (let i = 0; i < 5; i += 1) {
    const minuteTs = baseMinute - i * 60;
    const result = finalizer.finalizeMinute(minuteTs, nowTs);
    if (result.finalized) {
      console.log('[minute] finalized', result.minuteTs, result.aggregated);
    }
  }
};

finalizeWindow();
setInterval(finalizeWindow, 15_000);

const shutdown = () => {
  finalizer.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
