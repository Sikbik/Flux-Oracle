import { resetDatabase } from '../packages/api/src/index.js';

const applied = resetDatabase();
if (applied.length === 0) {
  console.log('Database reset complete. No migrations applied.');
} else {
  console.log(`Database reset complete. Applied migrations: ${applied.join(', ')}`);
}
