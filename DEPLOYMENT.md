# CoView Deployment Guide

This guide covers P2 database verification and deployment preparation for the
Next.js app in `web/`.

Do not commit real secrets. Keep `DATABASE_URL` in `web/.env.local` locally and
in Vercel Environment Variables for deployment.

## Local Development Flow

```bash
cd web
npm install
```

Create or update `web/.env.local` manually:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Use a real PostgreSQL URL from Supabase, Neon, or a local PostgreSQL instance.
Do not paste the real value into source code.

## Database Verification

Run these commands from `web/` in order.

### 1. Check Database Connection

```bash
npx tsx db/check.ts
```

Expected result: connection succeeds and prints database, user, and server
version.

### 2. Run Migration

```bash
npx tsx db/migrate.ts
```

This creates:

- `contents`
- `content_metrics`
- `events`
- `ai_decisions`

### 3. Seed Data

```bash
npx tsx db/seed.ts
```

This imports local JSON fallback data from:

- `../data/contents.json`
- `../data/events.json`

The seed script is designed to be safe to run multiple times.

### 4. Start Local App

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Recommended Database Route

For Vercel deployment, use Supabase or Neon PostgreSQL. This lets local
development and production use the same type of hosted PostgreSQL connection.

Keep JSON fallback in place. It remains useful when `DATABASE_URL` is missing
or unavailable.

## Deploy to Vercel

1. Create a Vercel project from the `web/` app directory.
2. Set the build command:

```bash
npm run build
```

3. Set the environment variables in Vercel:

```text
DATABASE_URL=your PostgreSQL connection string
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain
```

Do not commit these values to Git.

4. Before or after first deploy, initialize the database from your local machine:

```bash
cd web
npx tsx db/check.ts
npx tsx db/migrate.ts
npx tsx db/seed.ts
```

Use the same `DATABASE_URL` that Vercel will use.

## Post-Deploy Verification

After deployment, verify these URLs:

```text
/llms.txt
/robots.txt
/sitemap.xml
/api/ai-index.json
/api/contents/{slug}.json
```

For `/api/contents/{slug}.json`, replace `{slug}` with an actual content ID
from `/api/ai-index.json`.

Expected checks:

- `/llms.txt` returns plain text with CoView AI usage rules.
- `/robots.txt` includes AI Agent and crawler rules.
- `/sitemap.xml` includes human pages and AI JSON URLs for allowed content.
- `/api/ai-index.json` lists only content with AI view permission enabled.
- `/api/contents/{slug}.json` returns structured AI-readable JSON.
- Content with `allow_ai_view = false` returns 403 for its AI JSON endpoint.

## Safety Checklist

Before committing:

```bash
git status --short --ignored=matching
```

Do not commit:

- `web/.env.local`
- `web/node_modules/`
- `web/.next/`
- `web/tsconfig.tsbuildinfo`
- real database URLs or API keys
