import { WindowReportFinalizer } from '../../packages/aggregator/dist/index.js';
import { DEFAULT_METHODOLOGY } from '../../packages/api/dist/index.js';

const dbPath = process.env.FPHO_DB_PATH ?? 'data/fpho.sqlite';
const pair = process.env.FPHO_PAIR ?? DEFAULT_METHODOLOGY.pair;
const rulesetVersion = process.env.FPHO_RULESET_VERSION ?? 'v1';
const windowSeconds = Number(process.env.FPHO_WINDOW_SECONDS ?? '300');
const graceSeconds = Number(process.env.FPHO_GRACE_SECONDS ?? DEFAULT_METHODOLOGY.graceSeconds);

if (!Number.isFinite(windowSeconds) || windowSeconds <= 0) {
  throw new Error('FPHO_WINDOW_SECONDS must be a positive number');
}

if (!Number.isFinite(graceSeconds) || graceSeconds < 0) {
  throw new Error('FPHO_GRACE_SECONDS must be a non-negative number');
}

const finalizer = new WindowReportFinalizer({
  dbPath,
  pair,
  windowSeconds,
  rulesetVersion
});

const finalizeWindows = () => {
  const nowTs = Math.floor(Date.now() / 1000);
  const baseWindow =
    Math.floor((nowTs - (windowSeconds + graceSeconds)) / windowSeconds) * windowSeconds;

  const windows = [baseWindow, baseWindow - windowSeconds, baseWindow - windowSeconds * 2];

  for (const windowTs of windows) {
    const result = finalizer.finalizeWindow(windowTs);
    console.log('[window] finalized', `${windowSeconds}:${windowTs}`, result.reportHash);
  }
};

finalizeWindows();
setInterval(finalizeWindows, 60_000);

const shutdown = () => {
  finalizer.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
