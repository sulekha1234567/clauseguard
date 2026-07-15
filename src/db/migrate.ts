/**
 * Driver-aware migration runner. Applies the SQL files generated in ./drizzle.
 *
 *   pnpm db:migrate
 *
 * Reads DB_DRIVER to decide which migrator to use so the exact same migration
 * files apply to local PGlite and to a production Postgres server.
 */
import { config } from "dotenv";

// Load the same file Next.js uses in development.
config({ path: ".env.local" });
config(); // fall back to .env

// Relative import (not the "@/" alias) so this runs under tsx without a
// tsconfig-paths loader.
import { serverEnv } from "../env";

async function main() {
  const env = serverEnv();
  const migrationsFolder = "./drizzle";

  if (env.DB_DRIVER === "postgres") {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(env.DATABASE_URL!, { max: 1 });
    const db = drizzle(client);
    await migrate(db, { migrationsFolder });
    await client.end();
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const client = new PGlite(env.PGLITE_PATH);
    const db = drizzle(client);
    await migrate(db, { migrationsFolder });
    await client.close();
  }

  console.log(`✅ Migrations applied (driver: ${env.DB_DRIVER})`);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
