import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

type Db = NodePgDatabase<typeof schema>;
const g = globalThis as unknown as { __db?: Db };

/** Lazily created so `next build` works without DATABASE_URL. Reused across hot reloads and warm invocations. */
export function getDb(): Db {
  if (!g.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.');
    const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
    g.__db = drizzle(pool, { schema });
  }
  return g.__db;
}

export { schema };
