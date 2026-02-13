import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_DB_PATH = 'data/fpho.sqlite';
const DEFAULT_MIGRATIONS_DIR = 'db/migrations';

export interface MigrationOptions {
  dbPath?: string;
  migrationsDir?: string;
}

export function resolveDbPath(dbPath?: string): string {
  const value = dbPath ?? process.env.FPHO_DB_PATH ?? DEFAULT_DB_PATH;
  return path.resolve(process.cwd(), value);
}

export function resolveMigrationsDir(migrationsDir?: string): string {
  return path.resolve(process.cwd(), migrationsDir ?? DEFAULT_MIGRATIONS_DIR);
}

export function runMigrations(options: MigrationOptions = {}): string[] {
  const dbPath = resolveDbPath(options.dbPath);
  const migrationsDir = resolveMigrationsDir(options.migrationsDir);

  if (!existsSync(migrationsDir)) {
    throw new Error(`migrations directory not found: ${migrationsDir}`);
  }

  mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    const migrations = readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    const hasMigration = db.prepare('SELECT 1 FROM schema_migrations WHERE name = ? LIMIT 1');
    const markMigration = db.prepare(
      'INSERT INTO schema_migrations(name, applied_at) VALUES (?, unixepoch())'
    );

    const applyMigration = db.transaction((name: string, sql: string) => {
      db.exec(sql);
      markMigration.run(name);
    });

    const applied: string[] = [];

    for (const name of migrations) {
      const existing = hasMigration.get(name);
      if (existing) {
        continue;
      }

      const sql = readFileSync(path.join(migrationsDir, name), 'utf8');
      applyMigration(name, sql);
      applied.push(name);
    }

    return applied;
  } finally {
    db.close();
  }
}

export function resetDatabase(options: MigrationOptions = {}): string[] {
  const dbPath = resolveDbPath(options.dbPath);

  if (existsSync(dbPath)) {
    rmSync(dbPath, { force: true });
  }

  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  if (existsSync(walPath)) {
    rmSync(walPath, { force: true });
  }
  if (existsSync(shmPath)) {
    rmSync(shmPath, { force: true });
  }

  return runMigrations(options);
}
