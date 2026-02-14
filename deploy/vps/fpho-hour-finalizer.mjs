import { HourlyReportFinalizer } from '../../packages/aggregator/dist/index.js';

const dbPath = process.env.FPHO_DB_PATH ?? 'data/fpho.sqlite';
const pair = process.env.FPHO_PAIR ?? 'FLUXUSD';
const rulesetVersion = process.env.FPHO_RULESET_VERSION ?? 'v1';

const finalizer = new HourlyReportFinalizer({
  dbPath,
  pair,
  rulesetVersion
});

const finalizeHours = () => {
  const nowTs = Math.floor(Date.now() / 1000);
  const currentHour = Math.floor(nowTs / 3600) * 3600;
  const hours = [currentHour - 3600, currentHour - 7200];
  for (const hourTs of hours) {
    const result = finalizer.finalizeHour(hourTs);
    console.log('[hour] finalized', hourTs, result.reportHash);
  }
};

finalizeHours();
setInterval(finalizeHours, 60_000);

const shutdown = () => {
  finalizer.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

