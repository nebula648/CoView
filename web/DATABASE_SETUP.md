# CoView Database Setup

CoView uses PostgreSQL with Drizzle ORM. When `DATABASE_URL` is not set, the application falls back to reading/writing JSON files in `../data/`.

## Quick Start

Choose one PostgreSQL provider:

- Local Docker PostgreSQL for local-only testing.
- Supabase / Neon PostgreSQL for local testing that matches future Vercel deployment.

For P2 deployment preparation, Supabase / Neon is recommended because the same
connection string can be used locally and in Vercel environment variables.

### Option A: Local Docker PostgreSQL

#### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL 17 on `localhost:5432` with credentials `postgres:postgres` and database `coview`.

#### 2. Configure environment

Create `web/.env.local`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coview
```

### Option B: Supabase / Neon PostgreSQL

1. Create a PostgreSQL project in Supabase or Neon.
2. Copy the PostgreSQL connection string from the provider dashboard.
3. Paste it into `web/.env.local` as `DATABASE_URL`.

Do not commit `.env.local`, and do not paste the real value into source code,
documentation, issues, or chat logs.

Example shape only:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

## Verify and Initialize

Run these commands from `web/`.

### 1. Check connection

```bash
npx tsx db/check.ts
```

If this fails, fix `DATABASE_URL` or the PostgreSQL service before running
migrations.

### 2. Run migration

```bash
npx tsx db/migrate.ts
```

Creates all tables (`contents`, `content_metrics`, `events`, `ai_decisions`) with indexes.

### 3. Seed existing data

```bash
npx tsx db/seed.ts
```

Imports data from `../data/contents.json` and `../data/events.json` into PostgreSQL. Idempotent — safe to run multiple times.

### 4. Start the app

```bash
npm run dev
```

The app now reads from PostgreSQL. Remove `DATABASE_URL` from `.env.local` to switch back to JSON mode.

## Schema Overview

| Table | Purpose |
|---|---|
| `contents` | Core content (title, body, tags, AI metadata, permissions) |
| `content_metrics` | Per-content dual-track view counts (human / AI / crawler / unknown bot) |
| `events` | Every human/AI action log with dedup fields |
| `ai_decisions` | Per-content AI decisions (read/save/cite/recommend) |

## JSON Fallback

When `DATABASE_URL` is not set, all `@/lib/repository` functions automatically fall back to JSON reads/writes via `@/lib/data-source`. No code changes needed — the same repository API works in both modes.

## Manual Setup (without Docker or Cloud)

1. Install PostgreSQL 17+
2. Create database `coview`
3. Set `DATABASE_URL` in `.env.local` to your connection string
4. Run `npx tsx db/check.ts`
5. Run `npx tsx db/migrate.ts`
6. Run `npx tsx db/seed.ts`
