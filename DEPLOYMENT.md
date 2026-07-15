# Deploying ClauseGuard

The app runs on PGlite locally, but a live deployment needs a **real Postgres**
(serverless filesystems are ephemeral). Below is the full path to a live URL +
GitHub repo satisfying the submission requirements (repo, live link, CI/CD).

## 0. Prerequisites you provide
- A **Groq API key** (free): https://console.groq.com → put it in Vercel env, not in git.
- Your **GitHub** account and **LinkedIn** URL (for `src/lib/site.ts` footer).
- A **Vercel** account: https://vercel.com (free Hobby tier).

## 1. Provision a Postgres database (pick one)
- **Neon** (https://neon.tech) — free, great with Vercel. Create a project, copy the *pooled* connection string.
- **Vercel Postgres** — add from the Vercel dashboard → Storage; it injects `DATABASE_URL` automatically.

## 2. Push to GitHub
```bash
cd ~/clauseguard
git init && git add -A
git commit -m "ClauseGuard: AI contract review"
git branch -M main
git remote add origin https://github.com/<you>/clauseguard.git
git push -u origin main
```
`.env.local` is gitignored, so **no secrets are committed**.

## 3. Import into Vercel
- New Project → import the GitHub repo (framework auto-detected: Next.js).
- Add Environment Variables (Production + Preview):
  | Key | Value |
  | --- | --- |
  | `DB_DRIVER` | `postgres` |
  | `DATABASE_URL` | your pooled Postgres URL |
  | `AUTH_SECRET` | `openssl rand -base64 32` |
  | `GROQ_API_KEY` | your Groq key |

## 4. Run migrations against the production DB (once)
```bash
DB_DRIVER=postgres DATABASE_URL='<prod-url>' pnpm db:migrate
# optional demo data:
DB_DRIVER=postgres DATABASE_URL='<prod-url>' pnpm db:seed
```

## 5. Deploy
- Vercel builds on push. Every push to `main` redeploys → that's your CD.
- GitHub Actions (`.github/workflows/ci.yml`) runs typecheck + lint + tests + build on every PR/push → that's your CI.

## Notes
- `trustHost: true` is already set, so Auth.js works on the Vercel domain.
- To roll back, redeploy a previous commit from the Vercel dashboard.
