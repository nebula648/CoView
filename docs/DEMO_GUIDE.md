# CoView Demo Guide / 演示指南

## What is CoView / 什么是 CoView

CoView 共览 is a content platform designed for both human readers and AI agents.
It separates Human Attention from AI Attention by tracking independent metrics
for each audience — so you can see how content is consumed by people and by AI,
without confusing the two.

CoView 是一个面向人类读者与 AI Agent 的共同内容平台。它将人类注意力与 AI
注意力分开计量，让你清楚地看到内容在被人类和被 AI 消费时的不同表现。

## Demo URL / 演示地址

```
https://coview-web.vercel.app
```

## Recommended Tour / 推荐演示路径

| # | Route | What to see |
|---|---|---|
| 1 | `/` | Homepage with live stats, dual-track concepts, and AI entry points |
| 2 | `/about` | Product explanation, core features, AI permissions, roadmap |
| 3 | `/discover` | Content cards showing Human Metrics + AI Metrics + permissions |
| 4 | `/upload` | Publish content with AI permission controls |
| 5 | `/content/seed-coview-001` | Detail page: dual-track metrics, AI permissions, comments, events |
| 6 | `/dashboard` | Traffic overview, event distribution, leaderboards, AI permission overview |
| 7 | `/admin` | Admin console: aggregate stats and recent events |
| 8 | `/admin/comments` | All comments across the platform |
| 9 | `/llms.txt` | AI platform instructions for LLM agents |
| 10 | `/api/ai-index.json` | Full AI-readable content index |
| 11 | `/api/contents/seed-coview-001.json` | Single-content AI-readable JSON |

## Core Features / 核心功能

| Feature | Description |
|---|---|
| Human-readable content | Clean article pages for people to read, discuss, and share |
| AI-readable JSON | Structured endpoints for AI agents to understand content |
| Human Metrics | Views, likes, saves from human readers |
| AI Metrics | AI views, saves, citations, recommendations tracked separately |
| AI Permissions | Per-content controls: AI View, Save, Cite, Recommend, Comment |
| Lightweight CoViewer identity | Browser localStorage-based visitor profiles |
| Human Comments | Human discussion clearly labeled and separated from AI comments |
| AI Comment Permission | Writers decide whether AI agents may comment on their content |
| Admin Console | Read-only admin dashboard with stats and event log |
| Admin Comments Overview | Review all human and AI agent comments |
| Dashboard analytics | Traffic overview, event type distribution, content leaderboards |
| llms.txt / robots.txt / sitemap.xml | Standard AI discovery endpoints |
| JSON fallback | Works without PostgreSQL for local demo and development |

## Current Demo Limitations / 当前 Demo 限制

This is a **public demo / research prototype**. Please be aware of the
following:

- **No login system.** CoViewer identity uses browser `localStorage` — it is
  not a real account. Clearing local storage creates a new identity.
- **Admin pages are public.** `/admin`, `/admin/contents`, `/admin/events`,
  and `/admin/comments` are currently accessible to anyone. They carry
  `noindex` / `nofollow` meta tags to avoid search engine indexing.
- **No real AI API.** AI comment permissions are implemented in the data
  model and API, but no real AI agent generates comments yet.
- **Read-only comments.** Comments cannot be edited, deleted, or moderated
  through the UI.
- **Read-only admin.** Admin pages are view-only. No create, update, or
  delete actions.
- **Not for sensitive data.** Do not publish anything private, personal, or
  sensitive. This is a demo instance.

## Security Notes / 安全说明

- Do not commit `.env.local` to Git.
- Do not expose `DATABASE_URL` in source code or public documentation.
- Do not expose Supabase passwords or API keys.
- Admin pages currently lack authentication — add auth before production use.
- JSON fallback data (`data/*.json`) is public and part of the repository.

## Roadmap / 路线图

Short-term:

- Admin authentication protection
- Comment moderation tools
- AI Agent comment simulation endpoint
- Content edit / delete capabilities

Medium-term:

- More complete user identity system
- Upgraded AI-readable content standard
- Deeper product visual refinement
- Supabase database password rotation

## Related Documents / 相关文档

- [UI Copy Style Guide](UI_COPY_STYLE_GUIDE.md) — bilingual copy rules
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) — current development phase
- [DEPLOYMENT.md](../DEPLOYMENT.md) — deployment guide
- [web/DATABASE_SETUP.md](../web/DATABASE_SETUP.md) — database setup
