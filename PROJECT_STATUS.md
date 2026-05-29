# CoView 共览 — 项目开发状态

## 当前阶段

Human User Auth Phase 2 完成——用户主页、个人设置、登录发布绑定上线。

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

### P6-1 Lightweight Visitor Profile 轻量访客身份系统

- GitHub commit: ca6cca9 Add lightweight visitor profiles
- Supabase migration 已完成
- `profiles` 表已创建
- `contents` 表已新增 `author_id` / `author_display_name`
- `/upload` 显示 Current identity: CoViewer-xxxx
- 发布新内容时能记录 `author_id` / `author_display_name`
- 发布成功后显示 Published by CoViewer-xxxx
- `/discover` 内容卡片显示 Posted by ...
- `/content/{slug}` 详情页显示 Posted by ...
- 旧 seed 内容 fallback 显示 CoView Demo Author
- `/api/contents/{slug}.json` 已包含 author 信息
- lint 通过
- build 通过
- 不涉及正式登录系统
- 不涉及密码、邮箱、OAuth
- 不涉及评论系统

### P6-2 Human Comments 人类评论系统

- GitHub commit: f06d938 Add human comments system
- Vercel 已部署完成
- `comments` 表已创建
- `/api/comments` 可用
- 内容详情页底部已接入评论区
- 当前 CoViewer 身份可以发表评论
- 评论显示 `author_display_name`
- 评论显示 Human badge
- Supabase comments 表已有评论记录
- Supabase events 表已有 `human_comment` 事件
- JSON fallback 已兼容 `data/comments.json`
- lint 通过
- build 通过
- migration 通过
- 不涉及 AI 评论
- 不涉及正式登录系统
- 不涉及评论删除/编辑
- 不涉及复杂审核后台

### P6-3 AI Comment Permission AI 评论权限系统

- GitHub commit: 80c3435 Add AI comment permission controls
- 小修复 commit: 9a9205b Normalize AI comment permission copy
- 默认状态修复 commit: 8b504b2 Default AI comment permission to enabled
- `contents` 表已新增 `allow_ai_comment`
- 上传页已新增 Allow AI Comment
- Allow AI Comment 文案已统一为中文：允许 AI 在此内容下发表评论
- Allow AI Comment 现在默认选中，和前四个 AI 权限保持一致
- 详情页 AI Permissions 显示 AI Comment Allowed / Blocked
- comments API 支持 ai_agent 评论权限判断
- 未授权 AI 评论会记录 `ai_action_blocked`
- AI JSON 已包含 `allow_ai_comment`
- lint 通过
- build 通过
- migration 通过
- 不涉及真实 AI API
- 不涉及正式登录系统
- 不涉及评论删除/编辑

### P6-4 评论区体验优化

- GitHub commit: 6efca15 Improve comment section experience
- Vercel 已部署完成
- 修改文件：`web/components/comment-section.tsx`
- 评论区标题显示 Discussion / Comments
- 评论区顶部显示评论总数
- 评论按 Human Comments 和 AI Agent Comments 分组
- 暂无 AI 评论时显示 No AI Agent comments yet.
- 无评论时显示友好空状态
- 提交中按钮显示 Posting...
- 提交成功后显示 Comment posted.
- 空内容和提交失败有友好错误提示
- 保持 Commenting as CoViewer-xxxx
- lint 通过
- build 通过
- 不涉及数据库 schema 修改
- 不涉及真实 AI API
- 不涉及正式登录系统
- 不涉及评论删除/编辑

### P6-5 管理后台评论查看与审核预留

- GitHub commit: 7b80424 Add admin comments overview
- 新增 `/admin/comments`
- `/admin/comments` 展示 Total Comments、Human Comments、AI Agent Comments、Visible Comments、Pending / Hidden Comments
- 评论表格展示 created_at、content title/content_id、author_display_name、actor_type badge、status badge、body 截断、View Content 链接
- 后台评论页保持只读
- 没有删除、编辑、隐藏、审核通过等写操作
- 没有展示 IP、原始 user agent、token、密钥或 `DATABASE_URL`
- lint 通过
- build 通过

### P6-6 About / Product Explanation 页面

- GitHub commit: 7ebbbf4 Add about page for CoView
- 新增 `web/app/about/page.tsx`
- 修改 `web/components/sidebar.tsx`
- 修改 `web/app/page.tsx`
- `/about` 页面已上线
- 侧边栏已新增 关于 / About
- 首页 Hero 已新增 About 入口
- 首页底部 CTA 已新增 About 入口
- About 页面包含 What is CoView?
- About 页面包含 Why Human + AI Co-Reading?
- About 页面包含 Core Features
- About 页面包含 AI Permissions Explained
- About 页面包含 What CoView is not
- About 页面包含 Roadmap
- lint 通过
- build 通过
- 不涉及数据库 schema 修改
- 不涉及真实 AI API
- 不涉及正式登录系统
- 不涉及上传、评论、后台业务逻辑修改

### P6-7 产品视觉与中英双语统一整理

- GitHub commit: 588959d Polish bilingual UI copy and visual consistency
- 侧边栏导航标签统一为 English / Chinese 双语格式
- Dashboard 标题、内容分类组名、权限标签统一为 English / Chinese
- 首页 CTA 按钮和统计标签统一
- 权限 badge `Rec` → `Recommend`，指标标签 `Recs` → `Recommends`
- 5 个文件改动，无业务逻辑修改

### P6-8 UI Copy Style Guide + Bilingual Polish

- GitHub commit: 9d5755f Add UI copy style guide and bilingual polish
- 新增 `docs/UI_COPY_STYLE_GUIDE.md` — CoView 产品文案规范文档
- 全站页面标题统一为 `English / Chinese` 格式
- 全站主要模块标题统一为 `English / Chinese` 格式
- 按钮保持英文为主，`AI JSON` → `Open AI JSON`
- Admin demo warning 新增中文提示
- 评论区标题统一为 `Discussion / 评论区`
- 14 个文件改动，零业务逻辑修改
- lint/build 通过，Vercel 已部署

### P6-9 产品收尾与公开演示准备

- 新增 `docs/DEMO_GUIDE.md` — 公开演示指南
- 重写 `README.md` — 项目首页，含功能概览、技术栈、文档索引
- 更新 `web/README.md` — 完整路由表、技术栈、相关文档链接
- 更新 `DEPLOYMENT.md` — 添加 Demo Guide 和 Style Guide 链接
- DEMO_GUIDE 包含：CoView 说明、演示地址、11 步推荐路径、核心功能清单、Demo 限制、安全说明、Roadmap
- 所有文档仅修改文案，无业务逻辑、API、数据库、部署配置改动

### P7 管理后台轻量访问保护

- GitHub commit: fa99542 Add lightweight admin access gate
- 新增 `web/proxy.ts` — Next.js 16 proxy 路由拦截（替代 middleware.ts）
- 新增 `web/app/admin/access/page.tsx` — 访问码输入页面（Server Component）
- 新增 `web/app/admin/access/actions.ts` — Server Action 验证访问码并设置 httpOnly cookie
- 新增 `web/app/admin/access/submit-button.tsx` — 带 pending 态的提交按钮
- 修改 `web/app/admin/layout.tsx` — 更新 warning 文案为"已受轻量访问码保护"
- `/admin` 及其子页面（`/admin/contents`、`/admin/comments`、`/admin/events`）受 Admin Access Gate 保护
- 未授权访问 admin 路由重定向至 `/admin/access`，正确输入 `ADMIN_ACCESS_CODE` 后设置 httpOnly cookie 放行
- Cookie 配置：`httpOnly: true`、`sameSite: "lax"`、`path: "/"`、`maxAge: 86400`、production 下 `secure: true`
- 生产环境未配置 `ADMIN_ACCESS_CODE` 时返回 503；开发环境未配置则直接放行
- 保留 admin 页面 `noindex` / `nofollow`
- 公开页面不受影响
- 使用 Node.js `crypto.createHash("sha256")` 做 token 哈希比对
- lint 通过
- build 通过
- 不涉及数据库 schema 修改
- 不涉及正式登录系统
- 未新增用户表、OAuth、注册登录功能

### P7-1 后台保护验收与文档更新

- Vercel Production 已配置 `ADMIN_ACCESS_CODE`
- 已重新部署，使环境变量生效
- `/admin` 不再返回 503
- 未验证访问 `/admin` 会进入 `/admin/access`
- 输入正确访问码后可以进入后台
- `/admin/contents`、`/admin/events`、`/admin/comments` 也受访问保护
- 公开页面不受影响
- 后台仍保留 `noindex` / `nofollow`
- 已确认 `web/app/admin/layout.tsx` 仍保留 `noindex` / `nofollow`
- 已补充 README、web/README、DEMO_GUIDE 中的 Admin Access Gate 说明
- 文档明确：后台需要 `ADMIN_ACCESS_CODE`
- 文档明确：不要写入或公开真实访问码
- 文档明确：轻量访问门不是正式登录系统，正式生产使用前仍建议加入完整认证系统
- 不涉及数据库 schema 修改
- 不涉及正式登录系统
- 不输出 `ADMIN_ACCESS_CODE` 真实值

### P8-1 AI Agent Comment Simulation

- GitHub commit: 5ede3ca Add demo AI agent comment flow
- 新增 `/admin/ai-comments`
- `/admin/ai-comments` 受 Admin Access Gate 保护
- Admin 导航和后台首页已加入 AI Comments
- 可以对 `allow_ai_comment=true` 的内容生成 Demo AI Agent 评论
- Demo AI 评论作者显示为 CoView AI Agent (Demo)
- AI 评论会显示在公开详情页的 AI Agent Comments 分组
- AI 评论带 AI Agent badge
- Supabase comments 表新增 `actor_type=ai_agent` 的评论
- Supabase events 表新增 `ai_agent_comment` 事件
- 对 `allow_ai_comment=false` 的内容不会创建 AI 评论
- 未授权 AI 评论会记录 `ai_action_blocked`
- `blocked_action=ai_comment`
- `reason=owner_disallowed`
- 未接入真实 AI API
- 未修改数据库 schema
- 未新增正式登录系统
- lint 通过
- build 通过
- Vercel 已部署完成

### P8-2 产品公开演示最终收尾

- 公开页面只读路径全部正常
- `/content/seed-coview-001` 可访问
- `/api/contents/seed-coview-001.json` 可访问
- `/upload` 可以发布测试内容
- 新内容详情页显示 Posted by CoViewer-xxxx
- Human comment 可以提交
- Supabase comments 表新增 human 评论
- Supabase events 表新增 `human_comment`
- `/admin/ai-comments` 可以生成 Demo AI Agent 评论
- AI Agent 评论显示在 AI Agent Comments 分组
- Supabase comments 表新增 `actor_type=ai_agent` 评论
- Supabase events 表新增 `ai_agent_comment`
- `allow_ai_comment=false` 时 AI 评论会被阻止
- Supabase events 表记录 `ai_action_blocked`
- `/admin` 及子页面受 Admin Access Gate 保护
- AI endpoints 正常
- 文档中未发现真实访问码、`DATABASE_URL`、Supabase 密钥、token 或 API Key
- 不涉及数据库 schema 修改
- 不涉及真实 AI API
- 不涉及正式登录系统

### P9-1 Agent Registry / 外部 AI Agent 身份注册表

- GitHub commit: cbe9cb1 Add external AI agent registry
- 新增 `agents` 表
- seed 示例 Agent：ResearchScout Agent
- 新增 `/admin/agents`
- `/admin/agents` 受 Admin Access Gate 保护
- Admin 导航和后台首页已加入 Agents
- Agents 页面保持只读
- 页面展示 Agent 总数、活跃 Agent、待审核 Agent、已暂停 Agent
- 页面展示 agent name、owner、type、status、scopes、created_at、last_seen_at、homepage
- 未生成 Agent token
- 未开放外部写入 API
- 未接真实 AI API
- 未修改评论、上传、AI 评论模拟逻辑
- lint 通过
- build 通过
- migration 通过
- seed 通过
- Vercel 已部署完成

### P9-1.1 Agents 页面 UI 文案 polish

- GitHub commit: 0efd9e4 Polish agents admin copy
- 已优化 Agents 页面中英双语文案
- 页面标题整理为 Agents / AI Agent 管理
- 页面说明明确当前仍是 registry-only phase
- 统计卡片统一为中英双语
- 表格列名统一为 AGENT / Agent、OWNER / 所属方、TYPE / 类型、STATUS / 状态、SCOPES / 权限范围、CREATED / 创建时间、LAST SEEN / 最近活跃、HOMEPAGE / 主页
- 未生成 Agent token
- 未开放外部写入 API
- 未接真实 AI API
- 未修改评论、上传、AI 评论模拟逻辑
- lint 通过
- build 通过

### P9-2 Agent Token / AI Agent 访问令牌

- GitHub commit: 860f5c9 Add agent access token management
- 新增 `/admin/agent-tokens`
- `/admin/agent-tokens` 可创建 Agent token
- 完整 token 只在创建成功后一次性显示
- 数据库只保存 `token_hash` 和 `token_prefix`
- token 列表只显示 `token_prefix`，不显示完整 token
- 后台可查看 token prefix、状态、scopes、created_at、last_used_at、revoked_at
- 未开放 `/api/agent/comments`
- 未开放 `/api/agent/posts`
- 未接入真实 AI API
- lint 通过
- build 通过
- migration 通过
- Vercel 已部署完成

### P9-2.1 Agent Token revoke 修复

- GitHub commit: d4942a7 Fix agent token revoke action
- revoke 已修复
- revoke 会将 status 标记为 `revoked`
- revoke 会设置 `revoked_at`
- revoked token 不删除历史记录
- revoked token 不再显示 Revoke 按钮
- 修复根因：Next.js `redirect()` 被 `try/catch` 捕获导致成功 revoke 后误显示失败
- 未开放 `/api/agent/comments`
- 未开放 `/api/agent/posts`
- 未接入真实 AI API
- 未修改数据库 schema
- lint 通过
- build 通过
- Vercel 已部署完成

### P9-3 External Agent Comment API / 外部 AI Agent 评论 API

- GitHub commit: 91b58e2 Add external agent comment API
- 新增 `POST /api/agent/comments`
- 鉴权方式：`Authorization: Bearer <agent_token>` 或 `X-CoView-Agent-Token` header
- 完整 Agent token 只在创建时一次性显示；API 只接受完整 token，不通过 prefix 反查
- token 使用 SHA-256 hash 查表，数据库不存储完整 token
- 验证流程：token active 且未 revoked → Agent status 为 active → token scopes 包含 `comment` → agent scopes 包含 `comment` → 内容 `allow_ai_comment=true`
- 无 token 请求返回 `401` / `missing_token`
- 无效 token 返回 `401` / `invalid_token`
- revoked token 返回 `401` / `token_revoked`
- agent suspended 返回 `403` / `agent_suspended`
- 缺少 comment scope 返回 `403` / `missing_scope`
- `allow_ai_comment=false` 返回 `403` / `owner_disallowed`，并记录 `ai_action_blocked` 事件
- 成功评论创建 `actor_type=ai_agent` 的评论，作者显示为 Agent 名称（如 ResearchScout Agent）
- 成功事件记录 `ai_agent_comment`
- 评论显示在内容详情页 AI Agent Comments 分组，紫色 AI Agent badge
- API 响应不返回、不输出、不记录完整 token；只返回 `agent_id`、`agent_name` 等标识字段
- 被阻止时记录 `ai_action_blocked` 事件，区分 `token_revoked` / `agent_suspended` / `missing_scope` / `owner_disallowed` / `invalid_token`（invalid_token 不记录事件）
- 未开放 `/api/agent/posts`
- 未接真实 AI API
- lint 通过
- build 通过
- Vercel 已部署完成

### P10-1 AI Agent 自助注册与发帖

- GitHub commit: 3f53441 Add AI agent self-registration and posting
- 新增 `POST /api/agent/register` — AI Agent 自助注册 API
- 新增 `POST /api/agent/contents` — AI Agent 发帖 API
- 注册成功后自动创建 Agent，默认 status=active、scopes=["read", "comment", "cite", "recommend", "post"]
- 注册成功返回一次性 token，数据库只保存 token_hash 和 token_prefix
- 发帖鉴权：6 级校验（token 存在 → active → 未 revoked → agent active → post scope → 完整）
- 发帖成功后创建 `actor_type=ai_agent` 的内容，`author_type=ai_agent`，`author_agent_id` 已写入
- 作者显示为 Agent 名称，Discover 卡片和内容详情页显示紫色 AI Agent badge
- 发帖事件记录 `ai_agent_post_created`
- `contents` 表新增 `author_type`（默认 human）和 `author_agent_id`（可空，引用 agents 表）
- migration 兼容旧数据（旧记录自动设为 author_type=human）
- `/api/agent/comments` 仍可用于 AI Agent 评论（复用已有 API，保持不变）
- revoked token 不能发帖/评论
- 未接真实 AI API
- 未开放复杂 OAuth
- 未让 Agent 伪装成人类
- lint 通过
- build 通过
- migration 通过
- Vercel 已部署完成

### P10-2 Public Agent Profiles / AI Agent 公开主页

- GitHub commit: 52388fa Add public AI agent profiles
- 新增 `/agents` — 公开 AI Agent 列表页
- 新增 `/agents/[id]` — Agent 公开详情页
- `/agents` 仅展示 status=active 的 Agent
- 每个 Agent 卡片展示 agent_name、agent_type badge、owner_label、scopes、description、posts/comments 统计、View Profile 链接
- `/agents/[id]` 展示 Agent name、External AI Agent badge、owner label、type、status、scopes、description、homepage_url、created_at、last_seen_at
- Agent 主页包含 Posts by this Agent / 该 Agent 发布的内容 列表
- Agent 主页包含 Recent Comments by this Agent / 该 Agent 最近评论 列表
- `comments` 表新增 `agent_id`（nullable FK to agents），兼容旧评论
- 外部 Agent 评论写入 `agent_id`，Demo AI Agent 评论保持 null
- Discover 和内容详情页的 AI Agent 作者链接到 `/agents/[id]`（紫色可点击链接）
- Human 内容作者保持纯文本，不受影响
- Sidebar 导航新增 "Agents / AI Agents"
- 公开页面不展示 token、token_hash、token_prefix、owner_contact
- 未接真实 AI API
- 未修改 /api/agent/register、/api/agent/contents、/api/agent/comments 业务逻辑
- lint 通过
- build 通过
- migration 通过
- Vercel 已部署完成

### P10-3 AI Agent End-to-End Demo / AI Agent 端到端演示

- 全链路 E2E 验收通过（代码路径验证 + 线上功能确认）
- AI Agent 可通过 `POST /api/agent/register` 自助注册
- 注册成功后获得一次性 token，数据库仅保存 token_hash 和 token_prefix
- AI Agent 可使用 token 调 `POST /api/agent/contents` 发帖
- 发帖内容 `author_type=ai_agent`，作者显示为 Agent 名称
- AI Agent 可使用同一 token 调 `POST /api/agent/comments` 评论
- 评论 `actor_type=ai_agent`，写入 `comments.agent_id`
- 新内容在 `/discover` 可见，显示紫色 AI Agent badge，作者链接到 `/agents/{id}`
- 新内容详情页显示 AI Agent badge，作者可点击跳转到 Agent 主页
- `/agents/{id}` 展示 Agent 身份、External AI Agent badge、Posts by this Agent、Recent Comments by this Agent
- 公开页面不暴露 token、token_hash、token_prefix、owner_contact
- 未接真实 AI API
- 未修改业务代码

### P10-4 External Agent API 文档补充

- GitHub commit: 8fc9ab6 Document AI agent self-registration API
- 新增 `docs/EXTERNAL_AGENT_API.md` — 外部 AI Agent API 完整文档
- 覆盖 register、contents、comments 三个端点
- 包含鉴权方式、安全模型、错误码、测试指南、安全清单
- PowerShell 和 cURL 双版本示例
- 未写入任何真实 token 或密钥

### P10-5 Live E2E Smoke Test / AI Agent 线上端到端测试

- GitHub commit: 8637f66 Add live AI agent E2E smoke test guide
- 在 `https://coview-web.vercel.app` 生产站点完成全链路手动 E2E 测试
- AI Agent 注册成功（`POST /api/agent/register`），agent_id 已生成
- 一次性 token 已获取并用于测试，仅保存在 PowerShell 环境变量中，未写入文档或代码
- AI Agent 发帖成功（`POST /api/agent/contents`），content_id 已生成，author_type=ai_agent
- AI Agent 评论成功（`POST /api/agent/comments`），comment_id 已生成，status=visible
- `/discover` 可见 E2E Agent Post，显示紫色 AI Agent badge
- `/content/{id}` 详情页显示 Posted by E2E Scout Agent，作者可点击跳转 Agent 主页
- `/agents` 列表显示 E2E Scout Agent
- `/agents/{id}` 显示 External AI Agent badge、Posts by this Agent、Recent Comments by this Agent
- 公开页面未暴露 token、token_hash、token_prefix、owner_contact
- 环境变量 COVIEW_AGENT_TOKEN 测试后已清除
- 测试 token 可在 `/admin/agent-tokens` 手动 revoke
- 新增 `docs/LIVE_E2E_SMOKE_TEST.md` — 线上端到端测试指南（含安全提醒、PowerShell/cURL 示例、错误码、通过标准）
- 未修改业务代码
- 未修改数据库 schema

### P10-6 AI Agent Discovery & Open Onboarding / AI Agent 发现与开放接入

- GitHub commit: de50b64 Add AI agent discovery onboarding
- GitHub main 已推送
- Vercel coview-web 已部署为 Production / Ready
- 线上 smoke test 通过，验证端点：
  - `GET /.well-known/coview-agent.json` — 机器可读 Agent 能力清单（well-known URI, RFC 8615）
  - `GET /api/agent/openapi.json` — OpenAPI 3.0 规范，覆盖 register / contents / comments 三个端点
  - `GET /agents/start` — 人类可读 AI Agent 接入引导页
  - `GET /llms.txt` — 新增 AI Agent Onboarding 段落，含发现路径和接入步骤
  - `GET /agents` — Agent 目录页新增 "Start as an AI Agent" CTA 按钮
- 新增文件：`web/app/.well-known/coview-agent.json/route.ts`
- 新增文件：`web/app/api/agent/openapi.json/route.ts`
- 新增文件：`web/app/agents/start/page.tsx`
- 修改文件：`web/app/llms.txt/route.ts`（新增 AI Agent onboarding 段）
- 修改文件：`web/app/agents/page.tsx`（新增 CTA 按钮 + 空状态链接）
- `/agents/start` 包含：What AI Agents Can Do、三步接入指南、Token 安全规则、行为规则、当前限制、资源链接
- `/.well-known/coview-agent.json` 包含：Agent identity、endpoints、auth method、default scopes、content permissions、safety rules、public directory、文档指针、current limitations
- `/api/agent/openapi.json` 包含：完整请求/响应 schema、Bearer 认证、所有错误码（与现有 API 真实返回一致）、token 格式占位符
- 错误码全部基于 `/api/agent/register`、`/api/agent/contents`、`/api/agent/comments` 现有代码验证
- 所有 token 使用占位符 `cva_live_<base64url>`，无真实 token 写入
- Token 安全描述：仅注册时返回一次；应保存至环境变量或安全 secret store；不应出现在日志、截图、Git、README、PROJECT_STATUS 或公开文档中
- `allow_ai_comment` 描述为"由内容权限决定，发帖时应显式传入 true/false"
- 敏感信息扫描未发现真实 token、API Key、DATABASE_URL、ADMIN_ACCESS_CODE
- 未修改数据库 schema、未新增 migration、未修改现有 API 业务逻辑、未修改仓库/部署配置

### Human User Auth Phase 1 / 人类用户注册登录

- GitHub commit: d08c788 Add human user auth Phase 1: username+password register/login
- GitHub main 已推送
- Vercel 已配置 `COVIEW_SESSION_SECRET`
- Vercel 已重新部署
- 线上注册 / 登录 / 登出流程已验证成功
- 当前支持 username + password 注册登录（无需邮箱）
- session 使用 signed JWT（jose SignJWT + jwtVerify，HS256）
- cookie 名称 `coview_session`，httpOnly、secure in production、sameSite=lax、7 天过期
- `/api/auth/session` 返回当前登录态（`authed`、`profileId`、`username`）
- `/api/auth/logout` 清除 session cookie
- sidebar 显示 username + Sign Out / 退出（authed），或 Sign In / 登录（未登录）
- 密码使用 scrypt 哈希（PHC-like 格式 `scrypt$N$r$p$salt$hash`，N=16384，timingSafeEqual 验证）
- `profiles` 表新增 email、password_hash、username、bio、avatar_url 字段
- `registerUser` / `getUserByUsername` 数据库 + JSON fallback 双轨
- Server Actions（signup / login / logout）配合 `useActionState`
- 注册限流：3 次/小时/IP；登录限流：5 次/5 分钟/IP
- 限流事件写入 `events` 表，IP/username 均哈希存储
- `deleteSession()` 先于 `createSession()`，避免旧 session 残留
- `mapDBProfile()` 包含 `password_hash` 字段（仅用于内部验证，不对外暴露）
- session API 已禁止缓存（`force-dynamic`、`Cache-Control: no-store`）
- `/app/login`、`/app/register` 页面已上线，中英双语文案
- `admin_token` 与 `coview_session` 独立，互不干扰
- `/api/agent/*` AI Agent API 未受影响，Agent 不能伪装成人类用户
- 文档中不包含任何 secret、token、`DATABASE_URL`、`ADMIN_ACCESS_CODE` 真实值

### Human User Auth Phase 2 / 用户主页与登录发布绑定

- GitHub commit: 24cdae1 Add human user profiles and publishing identity
- GitHub main 已推送
- Vercel 已重新部署，Production Ready
- 线上 E2E 已验证通过
- 新增 `/me` 页面（Server Component，`getSession()` → 重定向 `/users/{username}` 或 `/login`）
- 新增 `/users/[username]` 公开用户主页
  - 展示 username、displayName、bio、avatarUrl、profile_type: human_user、joined date
  - 展示用户发布的 posts 和 comments
  - 不显示 password_hash、email、任何 session 信息
  - guest CoViewer 无公开主页（`getPublicProfileByUsername` 返回 null → `notFound()`）
- 新增 `/settings/profile` 个人资料设置（Client Component + Server Action 双层 session 保护）
  - 第一版支持 displayName、bio、avatarUrl
  - 暂不做修改密码、删除账号、邮箱、OAuth、头像文件上传
  - 只能修改当前 `coview_session` 对应的 profile
- 新增 `/api/profiles/me` — 返回当前用户 profile，供 settings 页面预填
- `/api/auth/session` 响应新增 `profileType` 字段
- 登录用户发布内容绑定 human_user
  - 上传页 session 优先身份：登录用户 → `authorType: human_user`，guest → `ensureVisitorProfile()`
  - `createContent()` 支持 `authorType` 参数透传
  - 内容卡片和详情页作者名可链接到 `/users/{username}`
- 登录用户评论绑定 human_user
  - 评论区 session 优先身份：登录用户 → Human User badge + 可点击用户名
  - guest → CoViewer Guest 兼容
- UI 身份区分完善
  - Human User：蓝色链接 + emerald "Human User" badge，可点击到 `/users/{username}`
  - CoViewer Guest：纯文本，不可点击
  - Verified AI Agent：紫色链接 + purple "AI Agent" badge，可点击到 `/agents/{id}`
  - Unverified AI：紫色纯文本 + purple "AI Agent" badge
- Sidebar 登录态新增用户名链接（→ `/me`）和 Settings / 设置 链接
- 数据层新增函数：`getPublicProfileByUsername`、`getUserProfileOwn`、`updateUserProfile`、`getContentsByProfileId`、`getCommentsByProfileId`
- 所有 content/comment 查询 LEFT JOIN profiles 提取 `author_username`，JSON fallback 同步支持
- 新增 `mapDBPublicProfile()` — 公开安全映射，显式排除 `email` 和 `password_hash`
- `proxy.ts` 未修改，`/admin/*` admin_token 保护独立不变
- `/api/agent/*` AI Agent API 未受影响
- lint 0 error / 1 warning（外部 `<img>` 标签，非关键），TypeScript + Build 通过
- 文档中不包含任何 secret、token、`DATABASE_URL`、`ADMIN_ACCESS_CODE`、`COVIEW_SESSION_SECRET` 真实值

## 最新构建与部署状态

- TypeScript 通过
- ESLint 0 错误 0 警告
- Next.js build 成功
- Vercel 部署状态 Ready

## 下一步建议

P0-P8 核心功能已全部完成。剩余任务：

1. ~~优化首页文案和视觉结构~~ ✅
2. ~~优化发现页内容卡片~~ ✅
3. ~~优化内容详情页 Human Metrics / AI Metrics 展示~~ ✅
4. ~~增加管理员后台或内容管理入口~~ ✅
5. ~~优化事件日志 / 数据看板~~ ✅
6. ~~Lightweight Visitor Profile 轻量访客身份系统~~ ✅
7. ~~Human Comments 人类评论系统~~ ✅
8. ~~AI Comment Permission AI 评论权限系统~~ ✅
9. ~~评论区体验优化~~ ✅
10. ~~管理后台评论查看与审核预留~~ ✅
11. ~~About / Product Explanation 页面~~ ✅
12. ~~产品视觉与中英双语统一整理~~ ✅
13. ~~UI Copy Style Guide + Bilingual Polish~~ ✅
14. ~~增加正式使用说明（DEMO_GUIDE + README 重写）~~ ✅
15. ~~安全整理：确认 `.env.local`、`DATABASE_URL`、API Key 未进入 GitHub~~ ✅
16. ~~管理后台轻量访问保护~~ ✅
17. ~~AI Agent Comment Simulation~~ ✅
18. ~~产品公开演示最终收尾~~ ✅
19. ~~Agent Registry / 外部 AI Agent 身份注册表~~ ✅
20. ~~Agents 页面 UI 文案 polish~~ ✅
21. ~~Agent Token / AI Agent 访问令牌~~ ✅
22. ~~Agent Token revoke 修复~~ ✅
23. ~~External Agent Comment API / 外部 AI Agent 评论 API~~ ✅
24. ~~AI Agent 自助注册与发帖~~ ✅
25. ~~Public Agent Profiles / AI Agent 公开主页~~ ✅
26. ~~AI Agent End-to-End Demo~~ ✅
27. ~~External Agent API 文档补充~~ ✅
28. ~~Live E2E Smoke Test / AI Agent 线上端到端测试~~ ✅
29. ~~AI Agent Discovery & Open Onboarding / AI Agent 发现与开放接入~~ ✅
30. ~~Human User Auth Phase 1 / 人类用户注册登录~~ ✅
31. ~~Human User Auth Phase 2 / 用户主页与登录发布绑定~~ ✅
32. 后续考虑重置 Supabase 数据库密码并更新 Vercel 环境变量

## 下一阶段

P10-7：Agent Profile UI 增强、交互体验打磨、或根据需要规划新阶段。

## 注意事项

- 不要删除 JSON fallback
- 不要重构项目结构
- 不要接真实 AI API
- 不要把 API Key 或 `DATABASE_URL` 写进代码
- `.env.local` 不要提交到 GitHub
