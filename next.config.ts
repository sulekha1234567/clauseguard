import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile in the home dir otherwise confuses
  // Turbopack's root inference).
  turbopack: { root: process.cwd() },

  // PGlite ships a WASM Postgres and must not be bundled by the server compiler.
  serverExternalPackages: ["@electric-sql/pglite"],

  // Fail the production build on type errors (quality gate).
  typescript: { ignoreBuildErrors: false },

  // Send a few sensible security headers at the framework level.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
