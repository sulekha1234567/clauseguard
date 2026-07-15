import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E config. The web server runs the production build against a local PGlite
 * database that has been migrated + seeded. A placeholder GROQ key is fine —
 * these tests exercise auth, navigation and rendering, not live AI calls.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `pnpm db:migrate && pnpm db:seed && PORT=${PORT} pnpm start`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DB_DRIVER: "pglite",
      PGLITE_PATH: "./.pglite-e2e",
      AUTH_SECRET: "e2e-only-secret-value-at-least-32-chars-long",
      GROQ_API_KEY: "placeholder-e2e-key",
    },
  },
});
