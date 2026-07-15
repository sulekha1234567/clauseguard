import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import {
  drizzle as drizzlePostgres,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/env";
import * as schema from "./schema";

/**
 * Database client factory.
 *
 * We reuse a single instance across hot reloads (dev) and warm serverless
 * invocations (prod) via a global cache. Which driver is instantiated depends
 * on DB_DRIVER, so the same query code runs unchanged on both PGlite (local,
 * in-process WASM) and a real Postgres server (Neon / RDS / ...).
 */
// Both drivers expose the identical query builder, so we present a single
// canonical type to the rest of the app (the PGlite instance is cast to it).
type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  db: Db | undefined;
};

function createDb(): Db {
  const env = serverEnv();

  if (env.DB_DRIVER === "postgres") {
    // `prepare: false` keeps compatibility with transaction poolers (Neon/PgBouncer).
    const client = postgres(env.DATABASE_URL!, { max: 1, prepare: false });
    return drizzlePostgres(client, { schema });
  }

  const client = new PGlite(env.PGLITE_PATH);
  return drizzlePglite(client, { schema }) as unknown as Db;
}

/**
 * Lazily resolve the real client on first use. Instantiating eagerly at import
 * time breaks `next build` (the PGlite WASM aborts inside build workers), so we
 * defer creation until an actual query runs at request time.
 */
function getDb(): Db {
  if (!globalForDb.db) globalForDb.db = createDb();
  return globalForDb.db;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
