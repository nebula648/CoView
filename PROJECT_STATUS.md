# CoView 共览 — 项目开发状态

## 当前阶段

P5-6 事件日志和数据看板优化完成并上线。

## 线上地址

`https://coview-web.vercel.app`

## 技术栈

- Next.js 16.2.6 (App Router + Turbopack)
- TypeScript
- TailwindCSS
- Drizzle ORM
- PostgreSQL / Supabase
- JSON fallback 数据源
- Vercel 部署

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

### P2 数据库实测

- Supabase PostgreSQL 连接成功
- migration 成功
- seed 成功
- 页面可读取数据库内容
- human_view 可以写入数据库
- GPTBot 访问可以记录 ai_agent_view
- Googlebot 访问记录 search_crawler_view，且不增加 AI Views

### P3 Vercel 部署上线

- GitHub 仓库 `nebula648/CoView` main 分支已部署
- Supabase 数据库已连接
- Vercel 项目 `coview-web` 部署成功
- 正式域名 `https://coview-web.vercel.app` 可访问
- Root Directory 设置为 `web`
- Framework Preset 为 Next.js
- Output Directory Override 已关闭

### P4 上线后基础验收

- `/` 可访问
- `/discover` 可访问
- `/dashboard` 可访问
- `/content/seed-coview-001` 可访问
- `/llms.txt` 可访问
- `/robots.txt` 可访问
- `/sitemap.xml` 可访问
- `/api/ai-index.json` 可访问
- `/api/contents/seed-coview-001.json` 可访问
- Supabase events 表可查看
- events 表中已有 human_view 记录
- events 表中已有 ai_agent_view 记录

### P5-1 安全整理

- GitHub 仓库安全扫描通过，无真实密钥、密码、token 泄露
- 根目录 `.gitignore` 已追加 `.env.*` 规则
- `.env.local` 未被提交到 Git
- `DATABASE_URL` 未硬编码在代码中

### P5-2 首页优化

- 首页全新 7 段结构：Hero、Dual-Track Metrics、Why CoView、How It Works、AI Entry Points、Current Demo、CTA
- Hero 渐变背景 + 双语标题/标语 + 双 CTA 按钮 + 实时统计数据卡片
- 4 张核心概念卡片（Human Views、AI Views、AI-Readable Content、Permission-Aware Access）
- 5 步工作流程展示
- 5 个 AI 入口路径展示
- 8 个当前能力标签
- GitHub commit: 7e57622，Vercel 已部署上线

### P5-3 发现页内容卡片优化

- `/discover` 页面顶部新增标题区：标题 "Discover Content"、副标题、中英双语说明
- 内容卡片全面重写，每条展示：
  - 标题、摘要（优先 `ai_summary`，fallback body 截取）、tags、创建日期
  - Human Metrics 区域（Views、Likes、Saves）
  - AI Metrics 区域（Views、Saves、Citations、Recommends）
  - 4 个 AI 权限 badge（View / Save / Cite / Rec，Allowed 绿色 / Blocked 红色）
  - 双 CTA 按钮：Read Details → `/content/{slug}`、AI JSON → `/api/contents/{slug}.json`
- 空状态：文件图标 + "No content yet" 提示 + "Upload Content" 按钮
- 修改文件：`web/app/discover/page.tsx`、`web/components/content-card.tsx`
- GitHub commit: a490775，Vercel 已部署上线

### P5-4 内容详情页 Human Metrics / AI Metrics 优化

- `/content/[slug]` 详情页完成双轨指标展示优化
- Human Metrics 与 AI Metrics 分区更清晰
- 增加 AI Summary、AI Value Score、Citation Suitability、AI Permissions、AI-Readable Entry 等展示区域
- 最近事件区域展示当前内容相关事件
- GitHub commit: 290ed9b，Vercel 已部署上线

### P5-5 管理后台 / 内容管理入口

- 新增 `/admin` 管理后台首页
- 新增 `/admin/contents` 内容管理列表
- 新增 `/admin/events` 事件日志列表
- GitHub 最新 commit: 42c6f7f Add noindex protection for admin pages
- Vercel 部署状态 Ready / Current
- `/admin` 可访问
- `/admin/contents` 可访问
- `/admin/events` 可访问
- 后台当前为 public demo，只读展示，无删除、编辑、修改数据库等危险操作
- 后台顶部明确提示：Admin pages are currently public in this demo. Add authentication before production use.
- 后台页面已添加 `noindex` / `nofollow`，避免搜索引擎索引 `/admin`、`/admin/contents`、`/admin/events`
- 原有公开页面和 API 未被破坏

### P5-6 事件日志和数据看板优化

- GitHub commit: 3139366 Improve event analytics dashboard
- Vercel 最新部署状态 Ready / Current
- `/dashboard` 已增强
- `/admin/events` 已增强
- Dashboard 新增 Traffic Overview
- Dashboard 新增 Human vs AI attention ratio
- Dashboard 新增 Event Type Distribution
- Dashboard 新增 Content Leaderboards
- Dashboard 新增 Recent Events Summary
- `/admin/events` 展示 Total Events、Human Events、AI Agent Events、Crawler Events、Bot Events、Event Type Summary、Recent 50 Events
- 不展示完整 IP
- 不展示原始 user agent
- 不展示 token、`DATABASE_URL`、密码或 API Key
- 未新增编辑、删除、修改数据库等危险操作

## 最新构建与部署状态

- TypeScript 通过
- ESLint 0 错误 0 警告
- Next.js build 成功
- Vercel 部署状态 Ready

## 下一步建议

P5：产品完善与安全整理（继续）。

剩余任务：

1. ~~优化首页文案和视觉结构~~ ✅
2. ~~优化发现页内容卡片~~ ✅
3. ~~优化内容详情页 Human Metrics / AI Metrics 展示~~ ✅
4. ~~增加管理员后台或内容管理入口~~ ✅
5. ~~优化事件日志 / 数据看板~~ ✅
6. 增加正式使用说明
7. ~~安全整理：确认 `.env.local`、`DATABASE_URL`、API Key 未进入 GitHub~~ ✅
8. 后续考虑重置 Supabase 数据库密码并更新 Vercel 环境变量

## 下一阶段

P5-7：上传页与发布流程优化，或 P5-7 管理后台认证保护规划。

## 注意事项

- 不要删除 JSON fallback
- 不要重构项目结构
- 不要接真实 AI API
- 不要把 API Key 或 `DATABASE_URL` 写进代码
- `.env.local` 不要提交到 GitHub
