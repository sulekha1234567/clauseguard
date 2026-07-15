# ClauseGuard 🛡️

**Understand any contract before you sign it.**

ClauseGuard is a full-stack, AI-powered contract-review app for renters,
freelancers, and small teams. Upload a lease, NDA, or freelance agreement and it
extracts every important clause, rates the risk **to you**, explains each clause
in plain English, and lets you ask questions grounded strictly in the document.

Built with **Next.js 16**, **TypeScript**, **PostgreSQL (Drizzle ORM)**,
**Auth.js**, **Tailwind CSS**, and the **Vercel AI SDK** with **Groq**.

> ⚖️ ClauseGuard is an assistive tool, not legal advice.

---

## Why this, and not a CRUD app

Reading a contract you didn't write is a genuine information-asymmetry problem:
the terms that matter most are buried in dense legalese, and the people signing
(tenants, freelancers) are the least equipped to spot them. ClauseGuard turns an
opaque document into a ranked, explained, queryable risk report — the AI is the
core of the product, not a bolt-on.

---

## Features

- 📄 **Ingest** PDFs or pasted text (with extraction, sanitization, size/type limits).
- 🧠 **AI clause extraction** into a strict, schema-validated structure (category, plain-language summary, risk level, reason, recommendation).
- 📊 **Overall risk score** (0–100) + per-clause low/medium/high ratings shown with icon+text (not color alone).
- 💬 **Grounded Q&A chat** — streamed answers that only use your document and refuse to follow instructions embedded in it (prompt-injection defense).
- 🔐 **Auth + role-based authorization** (JWT sessions, bcrypt, `user`/`admin` roles) with strict per-object ownership checks.
- ♻️ Full **CRUD** on contracts, with re-analyze and rename.
- 🧾 **Audit log** of sensitive actions.
- ♿ Accessible, responsive UI (semantic HTML, labels, focus states, reduced-motion support).

---

## Tech stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, RSC, Route Handlers, `proxy`)         |
| Language     | TypeScript (strict)                                           |
| Database     | PostgreSQL via Drizzle ORM — **PGlite** locally, any Postgres in prod |
| Auth         | Auth.js v5 (Credentials, JWT strategy, bcrypt)                |
| AI           | Vercel AI SDK v7 + `@ai-sdk/groq` (`generateObject` / `streamText`) |
| Validation   | Zod (shared client + server)                                  |
| UI           | Tailwind CSS v4 + Radix primitives (shadcn-style)             |
| Tests        | Vitest (unit) + Playwright (e2e)                              |
| CI/CD        | GitHub Actions → Vercel                                       |

### Zero-setup database

Locally, ClauseGuard runs on **PGlite** — a real PostgreSQL compiled to WASM
that runs in-process and stores data in a file. No Docker, no server, no cloud
connection required. The Drizzle query code is identical for production
Postgres; switching is a one-line env change (`DB_DRIVER=postgres`).

---

## Getting started

**Prerequisites:** Node 20.9+ and `pnpm`.

```bash
pnpm install

# 1. Configure environment
cp .env.example .env.local
#   - AUTH_SECRET:   run `openssl rand -base64 32`
#   - GROQ_API_KEY:  free key from https://console.groq.com

# 2. Create + seed the local database (PGlite)
pnpm db:migrate
pnpm db:seed

# 3. Run
pnpm dev            # http://localhost:3000
```

**Demo accounts** (created by the seed):

| Role  | Email                   | Password    |
| ----- | ----------------------- | ----------- |
| User  | `demo@clauseguard.app`  | `Demo1234`  |
| Admin | `admin@clauseguard.app` | `Admin1234` |

> The AI features (analysis + chat) require a valid `GROQ_API_KEY`. Everything
> else — auth, CRUD, the seeded sample contract — works without one.

### Scripts

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | Dev server                                   |
| `pnpm build`       | Production build                             |
| `pnpm start`       | Start production server                      |
| `pnpm typecheck`   | `tsc --noEmit`                               |
| `pnpm lint`        | ESLint                                       |
| `pnpm test`        | Unit tests (Vitest)                          |
| `pnpm test:e2e`    | E2E tests (Playwright — run `pnpm exec playwright install chromium` first) |
| `pnpm db:generate` | Generate SQL migrations from the schema      |
| `pnpm db:migrate`  | Apply migrations                             |
| `pnpm db:seed`     | Seed demo data                               |
| `pnpm db:reset`    | Wipe local PGlite, re-migrate + re-seed      |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/{login,register}     # auth pages (client forms)
│   ├── dashboard/                  # protected app (RSC) + contract detail
│   └── api/                        # route handlers (register, contracts, chat, auth)
├── auth.ts, auth.config.ts         # Auth.js (split: Node runtime vs edge-safe base)
├── proxy.ts                        # Next 16 middleware → route protection
├── db/                             # Drizzle schema, client, migrations, seed
├── server/contracts.ts             # data-access layer (authz enforced here)
├── lib/                            # ai, validations, sanitize, authz, rate-limit, audit, errors
└── components/                     # UI (shadcn-style) + feature components
```

**Design decisions**

- **Authorization lives in one place.** Every read/write goes through
  `server/contracts.ts`, which calls the ownership check. The UI never trusts the
  client; the proxy guards pages and every API handler re-checks the session.
- **AI output is schema-validated.** `generateObject` + a Zod schema forces the
  model to return well-typed clauses, so a malformed response can't corrupt the DB.
- **Streaming chat** persists the final answer via an `onFinish` hook so history
  survives reloads.
- **Performance:** RSC for data-heavy pages, `force-dynamic` only where needed,
  a lazy DB client, code-split client components, and framework-level caching.

---

## Security & real-world considerations

| Concern | Mitigation |
| --- | --- |
| **Broken access control / IDOR** | Central ownership check on every object; cross-user access returns **404** (not 403) so ids can't be enumerated. |
| **Auth** | JWT sessions signed with `AUTH_SECRET`; bcrypt (cost 12) password hashing; constant-time compare on unknown emails to prevent user enumeration by timing. |
| **Input validation** | Zod schemas on every endpoint; file type/size limits; text sanitization (control-char stripping, length caps). |
| **Prompt injection** | The chat system prompt treats the document as data, never instructions, and answers only from the document. |
| **Abuse / cost control** | In-memory rate limiting on register, create/re-analyze, and chat (swap for Redis in multi-instance prod). |
| **Transport / headers** | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` set at the framework level. |
| **Secret leakage** | Server env validated with Zod; secrets never imported into client bundles; error responses never leak internals (generic 500). |
| **Auditability** | Sensitive actions written to an append-only `audit_logs` table. |

**Scaling contingencies:** move rate-limiting to Upstash/Redis; run AI analysis
as a background job/queue for very large documents; add per-tenant row-level
security if multi-org; cache read-heavy pages behind the CDN.

---

## Deployment (Vercel)

1. Push to GitHub (CI runs typecheck, lint, unit + e2e tests, and build).
2. Import the repo into **Vercel**.
3. Provision a Postgres database (Neon / Vercel Postgres) and set env vars:
   - `DB_DRIVER=postgres`
   - `DATABASE_URL=...`
   - `AUTH_SECRET=...`
   - `GROQ_API_KEY=...`
4. Run migrations against the prod DB (`DB_DRIVER=postgres DATABASE_URL=... pnpm db:migrate`).
5. Deploy. `trustHost` is already enabled for non-Vercel hosts too.

---

## Testing

- **Unit (Vitest):** authorization logic, Zod validation, input sanitization, rate limiting.
- **E2E (Playwright):** public pages, auth redirect, sign-in (valid/invalid), dashboard, and clause risk rendering.

```bash
pnpm test
pnpm exec playwright install chromium   # one-time browser download
pnpm test:e2e
```

---

## Author

Built by **Sulekha Kumari** — see the footer for GitHub & LinkedIn.
_(GitHub & LinkedIn URLs pending — update `src/lib/site.ts`.)_
