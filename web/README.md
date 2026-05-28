# CoView Web

CoView 共览的 Next.js 正式站主体。这是 CoView 的核心应用，包含所有前端页面、
API 路由、数据库层和组件。

**Live Demo**: [https://coview-web.vercel.app](https://coview-web.vercel.app)

## Tech Stack / 技术栈

- Next.js 16 (App Router + Turbopack)
- TypeScript
- TailwindCSS
- PostgreSQL (Supabase) + Drizzle ORM
- JSON fallback data source
- Vercel deployment

## Local Development / 本地运行

```bash
npm install
npm run dev
```

`http://localhost:3000`

Without a database, the app falls back to `../data/contents.json` and
`../data/events.json`.

```bash
npm run lint
npm run build
```

## Database / 数据库

Create `web/.env.local` (never commit):

```
DATABASE_URL=your_postgresql_connection_string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_ACCESS_CODE=your_demo_admin_access_code
```

Initialize:

```bash
npx tsx db/migrate.ts
npx tsx db/seed.ts
```

See `DATABASE_SETUP.md` for full instructions.

## JSON Fallback / JSON 降级

When `DATABASE_URL` is unavailable, the app reads from:

```
../data/contents.json
../data/events.json
../data/comments.json
```

This ensures the demo runs locally without PostgreSQL. Do not delete the JSON
fallback.

## Routes / 路由

| Route | Description |
|---|---|
| `/` | Homepage with live stats and dual-track concepts |
| `/about` | Product explanation and AI permissions guide |
| `/discover` | Content cards with Human + AI Metrics |
| `/upload` | Publish content with AI permission controls |
| `/content/[slug]` | Content detail with metrics, permissions, comments, events |
| `/dashboard` | Traffic overview, event distribution, leaderboards |
| `/admin/access` | Lightweight admin access gate |
| `/admin` | Protected admin console: stats and recent events |
| `/admin/contents` | Protected content management list |
| `/admin/events` | Protected event log with analytics |
| `/admin/comments` | Protected comment overview |
| `/debug/ua` | UA classification debug page |
| `/api/contents/[slug].json` | AI-readable JSON for single content |
| `/api/ai-index.json` | Full AI-readable content index |
| `/api/events` | Event creation and human view tracking |
| `/api/stats` | Aggregate statistics |
| `/api/comments` | Comment submission |
| `/api/profiles` | Visitor profile management |
| `/llms.txt` | AI platform instructions |
| `/robots.txt` | Crawler rules with AI agent classification |
| `/sitemap.xml` | Human pages + AI JSON URLs |

## Documentation / 相关文档

- `DATABASE_SETUP.md` — PostgreSQL + Drizzle setup
- `P0_TESTING.md` — P0 acceptance checklist
- `../docs/DEMO_GUIDE.md` — demo tour and limitations
- `../docs/UI_COPY_STYLE_GUIDE.md` — bilingual copy rules
- `../PROJECT_STATUS.md` — project phase status
- `../DEPLOYMENT.md` — deployment guide

## Admin Access Gate / 后台访问保护

Admin routes under `/admin` are protected by a lightweight demo access gate.
Set `ADMIN_ACCESS_CODE` in local and Vercel environment variables before
visiting the admin console. The access gate stores an httpOnly cookie after a
successful code check.

For the hosted demo, `ADMIN_ACCESS_CODE` is configured in Vercel Production
environment variables. Do not write the real access code in docs, commits, or
source code.

This is not a formal login system. Before production use, replace it or extend
it with full authentication, authorization, audit logging, and session
management.
