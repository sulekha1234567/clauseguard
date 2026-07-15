import { defineConfig } from "drizzle-kit";

/**
 * Used by `drizzle-kit generate` to diff the schema and emit SQL migrations
 * into ./drizzle. Applying those migrations is handled by src/db/migrate.ts,
 * which selects the correct driver (PGlite locally, Postgres in prod).
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  verbose: true,
  strict: true,
});
