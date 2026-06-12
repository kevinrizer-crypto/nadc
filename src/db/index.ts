import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// One pool per server process. With Supabase/Neon, point DATABASE_URL at the
// pooled (pgBouncer) connection string for serverless deploys.
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Set DATABASE_POOL_MAX=1 when using the single-connection PGlite dev
    // server (scripts/dev-db.ts); default suits pooled serverless Postgres.
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
