# CoView 共览 — 项目开发状态

## 当前阶段

P2 数据库实测已完成。

## 技术栈

- Next.js 16.2.6 (App Router + Turbopack)
- TypeScript
- TailwindCSS
- Drizzle ORM
- PostgreSQL / Supabase-ready
- JSON fallback 数据源

## 项目结构说明

- 根目录仍保留旧 Streamlit MVP：`app.py`、`requirements.txt`、`data/`
- Next.js 正式站主体位于 `web/`
- `DATABASE_SETUP.md` 与 `P0_TESTING.md` 位于 `web/` 目录

## 已完成功能

### P0 页面与机器可读层

- 首页 (`/`)
- 发现页 (`/discover`)
- 上传页 (`/upload`)
- 内容详情页 (`/content/[slug]`)
- 数据看板 (`/dashboard`)
- UA 分类调试页 (`/debug/ua`)
- `/api/contents/[slug].json` — AI 可读 JSON
- `/api/ai-index.json` — 全站 AI 索引
- `/llms.txt`
- `/robots.txt`
- `/sitemap.xml`

### P1 数据层

- PostgreSQL schema（contents, content_metrics, events, ai_decisions）
- migration 脚本 (`web/db/migrate.ts`)
- seed 脚本 (`web/db/seed.ts`)
- repository 统一数据访问层
- DB 优先，数据库不可用时 fallback 到 `data/*.json`
- human view 由客户端上报到 `/api/events`
- 24 小时去重：
  - human: `session_id + content_id`
  - AI Agent: `ua_hash + ip_hash + content_id`
- 事件命名统一为 `actor_type = "ai_agent"`、`event_type = "ai_agent_view"`，并兼容旧 JSON 的 `ai` / `ai_view`

## 最新稳定化修复

- 修复 DB 模式下列表页与 Dashboard 读取不到 metrics 的问题
- 内容详情页新增 human_view 客户端上报
- JSON fallback 的 `createEvent()` 保留 `extraFields`
- 旧 JSON 事件读取兼容 `ai` / `ai_view` 命名
- 文档同步到 Next.js 正式站结构

## 最新验证

- Supabase PostgreSQL 连接成功
- migration 成功
- seed 成功
- 页面可读取数据库内容
- `/discover` 正常
- `/dashboard` 正常
- `/content/{slug}` 正常
- `human_view` 可以写入数据库
- GPTBot 访问 `/api/contents/{slug}.json` 可以记录 `ai_agent_view`
- Googlebot 访问会记录 `search_crawler_view`，且不增加 AI Views
- `npm run lint` 通过
- `npm run build` 通过

## 下一步建议

P3：Vercel 部署准备与上线。

具体包括：

- 确认 Vercel 项目根目录使用 `web/`
- 配置 Vercel 环境变量：`DATABASE_URL`、`NEXT_PUBLIC_SITE_URL`
- 确认 build command 为 `npm run build`
- 部署后验证 `/llms.txt`、`/robots.txt`、`/sitemap.xml`
- 部署后验证 `/api/ai-index.json` 与 `/api/contents/{slug}.json`
- 部署后验证 `human_view`、`ai_agent_view`、`search_crawler_view` 事件写入

## 注意事项

- 不要删除 JSON fallback
- 不要重构项目结构
- 不要接真实 AI API
- 不要把 API Key 或 `DATABASE_URL` 写进代码
- `.env.local` 不要提交到 GitHub
