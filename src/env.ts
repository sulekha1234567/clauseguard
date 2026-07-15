import { z } from "zod";

/**
 * Runtime environment validation.
 *
 * Server-only secrets are validated lazily so that the client bundle never
 * touches them and the build does not fail when they are absent in an
 * environment that does not need them (e.g. `next lint`).
 *
 * The app supports two database drivers so it can run with zero external
 * dependencies locally and on a managed cloud Postgres in production:
 *   - "pglite"   → in-process Postgres (WASM), data persisted under PGLITE_PATH
 *   - "postgres" → any Postgres server via connection string (Neon, RDS, ...)
 */
const serverSchema = z
  .object({
    DB_DRIVER: z.enum(["pglite", "postgres"]).default("pglite"),
    DATABASE_URL: z.string().optional(),
    PGLITE_PATH: z.string().default("./.pglite"),
    AUTH_SECRET: z
      .string()
      .min(
        32,
        "AUTH_SECRET must be at least 32 characters (run: openssl rand -base64 32)",
      ),
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required for AI features"),
    GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .refine(
    (v) => v.DB_DRIVER !== "postgres" || !!v.DATABASE_URL,
    "DATABASE_URL is required when DB_DRIVER=postgres",
  );

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

/**
 * Returns validated server environment. Throws a readable error listing every
 * missing/invalid variable the first time it is called on the server.
 */
export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
