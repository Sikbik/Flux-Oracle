import { runMigrations } from '../packages/api/src/index.js';

const applied = runMigrations();
if (applied.length === 0) {
  console.log('No pending migrations.');
} else {
  console.log(`Applied migrations: ${applied.join(', ')}`);
}
