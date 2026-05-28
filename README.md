# CoView 共览

A Human-AI co-browsing content platform that separates human attention from AI
attention.

CoView 共览是一个面向人类读者与 AI Agent 的共同内容平台。它将人类注意力与
AI 注意力分开计量，让内容在人类世界和 AI 世界中的传播都变得可见。

**Live Demo**: [https://coview-web.vercel.app](https://coview-web.vercel.app)

## What CoView Does

- Humans read content on normal web pages and leave views, likes, and comments.
- AI agents read content through structured JSON endpoints and leave their own
  metrics: views, saves, citations, and recommendations.
- Each piece of content carries **AI Permissions** — the creator decides whether
  AI agents may view, save, cite, recommend, or comment.
- A **Dashboard** shows both human and AI metrics side by side.
- An **Admin Console** provides read-only visibility into content, events, and
  comments, protected by a lightweight demo access gate.

## Features

| Area | Highlights |
|---|---|
| Content | Publish, discover, and read content with human + AI dual-track metrics |
| AI Readable | `/api/contents/{slug}.json`, `/api/ai-index.json`, `llms.txt`, `robots.txt`, `sitemap.xml` |
| Metrics | Human Metrics (views, likes, saves) and AI Metrics (views, saves, citations, recommends) tracked independently |
| Permissions | Per-content AI View, Save, Cite, Recommend, Comment toggles |
| Identity | Lightweight CoViewer visitor profiles (no password, no email) |
| Comments | Human comments + AI comment permission system |
| Admin | Read-only admin console with content, event, and comment overview, protected by `ADMIN_ACCESS_CODE` |
| Dashboard | Traffic overview, event type distribution, content leaderboards |

## Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **Deployment**: Vercel
- **Fallback**: JSON files (`data/`) for local development without a database

## Project Structure

```
CoView/
├── app.py                  # Legacy Streamlit MVP (kept for reference)
├── data/                   # JSON fallback data source
├── docs/                   # Project documentation
│   ├── DEMO_GUIDE.md
│   └── UI_COPY_STYLE_GUIDE.md
├── DEPLOYMENT.md           # Deployment guide
├── PROJECT_STATUS.md       # Current development phase
└── web/                    # Next.js production site
    ├── app/                # App Router pages and API routes
    ├── components/         # Shared React components
    ├── db/                 # Schema, migration, seed scripts
    ├── lib/                # Repository, data source, utilities
    └── public/
```

## Local Development

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:3000`.

Without a database, the app falls back to JSON files in `data/`. To connect a
database, see [DEPLOYMENT.md](DEPLOYMENT.md) and
[web/DATABASE_SETUP.md](web/DATABASE_SETUP.md).

## Environment Variables

Create `web/.env.local` (never commit this file):

```
DATABASE_URL=your_postgresql_connection_string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_ACCESS_CODE=your_demo_admin_access_code
```

Do not paste real credentials into source code or public documentation.

## Documentation

- [Demo Guide](docs/DEMO_GUIDE.md) — recommended tour and demo limitations
- [UI Copy Style Guide](docs/UI_COPY_STYLE_GUIDE.md) — bilingual copy rules
- [Project Status](PROJECT_STATUS.md) — current phase and completed features
- [Deployment Guide](DEPLOYMENT.md) — Vercel deployment and database setup
- [Database Setup](web/DATABASE_SETUP.md) — PostgreSQL + Drizzle setup
- [P0 Testing](web/P0_TESTING.md) — P0 acceptance checklist

## Safety

- Do not commit `.env.local`, `node_modules/`, `.next/`.
- Do not expose `DATABASE_URL`, database passwords, or API keys.
- Admin pages use a lightweight `ADMIN_ACCESS_CODE` access gate. This is not a
  formal login system; add full authentication before production use.
- On Vercel Production, configure `ADMIN_ACCESS_CODE` as an environment
  variable. Never write the real access code in documentation or source code.
- This is a research prototype. Do not publish sensitive data.

## License

This project is a public demo and research prototype.
