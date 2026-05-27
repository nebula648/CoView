# CoView Database Setup

CoView uses PostgreSQL with Drizzle ORM. When `DATABASE_URL` is not set, the application falls back to reading/writing JSON files in `../data/`.

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL 17 on `localhost:5432` with credentials `postgres:postgres` and database `coview`.

### 2. Configure environment

Copy the example (already provided in `.env.local`):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coview
```

### 3. Run migration

```bash
npx tsx db/migrate.ts
```

Creates all tables (`contents`, `content_metrics`, `events`, `ai_decisions`) with indexes.

### 4. Seed existing data

```bash
npx tsx db/seed.ts
```

Imports data from `../data/contents.json` and `../data/events.json` into PostgreSQL. Idempotent — safe to run multiple times.

### 5. Start the app

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

## Manual Setup (without Docker)

1. Install PostgreSQL 17+
2. Create database `coview`
3. Set `DATABASE_URL` in `.env.local` to your connection string
4. Run `npx tsx db/migrate.ts`
5. Run `npx tsx db/seed.ts`
