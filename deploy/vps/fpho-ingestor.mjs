import {
  IngestorService,
  createVenueAdapters,
  loadIngestorConfigFromEnv
} from '../../packages/ingestor/dist/index.js';

const config = loadIngestorConfigFromEnv(process.env);
const service = new IngestorService(config, {
  adapters: createVenueAdapters(config.enabledVenues)
});

const shutdown = async () => {
  try {
    await service.stop();
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await service.start();

console.log('[ingestor] started', {
  pair: config.pair,
  enabledVenues: config.enabledVenues,
  healthPort: service.getHealthPort() ?? config.healthPort
});

setInterval(() => {
  console.log('[ingestor] stats', JSON.stringify(service.getStats()));
}, 60_000);
