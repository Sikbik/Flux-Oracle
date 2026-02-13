import { createApiServer } from './server.js';

const port = Number(process.env.FPHO_API_PORT ?? 3000);
const dbPath = process.env.FPHO_DB_PATH ?? 'data/fpho.sqlite';

const app = createApiServer({ dbPath });

await app.listen({ port, host: '0.0.0.0' });
