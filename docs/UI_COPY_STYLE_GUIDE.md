# CoView UI Copy Style Guide

CoView 共览 — 产品文案规范与中英双语统一规则

## 1. Language Positioning / 语言定位

CoView is an AI-native bilingual product targeting Chinese-speaking users.
The interface uses English as the primary data-product language, with
Chinese as the auxiliary explanation language.

- **Page titles**: English / Chinese (both always present)
- **Module headings**: English / Chinese (both always present)
- **Buttons**: English only, short and action-oriented
- **Metric names**: English only, data-product style
- **Badges**: English only, compact
- **Long-form explanations**: Chinese-first, with optional English product tagline
- **Admin pages**: English-dominant, but demo warning must be bilingual

## 2. Page Title Rules / 页面标题规则

All page-level `<h1>` titles must use the `English / Chinese` format:

| Route | Title |
|---|---|
| `/` | CoView 共览 (brand name, exception) |
| `/discover` | Discover Content / 发现内容 |
| `/upload` | Upload Content / 上传内容 |
| `/dashboard` | Dashboard / 数据看板 |
| `/about` | About CoView / 关于 CoView |
| `/admin` | Admin Console / 管理后台 |
| `/admin/contents` | Manage Contents / 内容管理 |
| `/admin/events` | Event Log / 事件日志 |
| `/admin/comments` | Comments / 评论管理 |

## 3. Module Heading Rules / 模块标题规则

Section-level `<h2>` headings use `English / Chinese` format:

| Section | Heading |
|---|---|
| Home — metrics | Dual-Track Metrics / 双轨指标 |
| Home — why | Why CoView / 为什么需要 CoView |
| Home — how | How It Works / 工作机制 |
| Home — AI entries | AI-Readable Entry Points / AI 可读入口 |
| Home — demo | Current Demo / 当前 Demo |
| Dashboard — traffic | Traffic Overview / 流量概览 |
| Dashboard — events | Event Type Distribution / 事件类型分布 |
| Dashboard — ranking | Content Leaderboards / 内容排行榜 |
| Dashboard — summary | Recent Events Summary / 最近事件摘要 |
| Dashboard — categories | Content Categories / 内容分类 |
| Dashboard — permissions | AI Permission Overview / AI 权限概览 |
| About — features | Core Features / 核心功能 |
| About — permissions | AI Permissions Explained / AI 权限说明 |
| Detail — metrics | Dual-Track Metrics / 双轨指标 |
| Detail — permissions | AI Permissions / AI 权限 |
| Detail — AI entry | AI-Readable Entry / AI 可读入口 |
| Detail — events | Recent Events / 最近事件 |
| Detail — discussion | Discussion / 评论区 |

## 4. Button Rules / 按钮规则

Buttons are English-only, short, and action-oriented. Use consistent labels
across the entire product:

| Button | Target |
|---|---|
| Explore Content | `/discover` |
| Upload Content | `/upload` |
| View Dashboard | `/dashboard` |
| About CoView | `/about` |
| Read Details | `/content/{slug}` |
| Open AI JSON | `/api/contents/{slug}.json` |
| Submit Comment | comment form |
| View Content | admin → public page |
| Back to Discover | detail → `/discover` |
| Publish Content | upload form submit |

Avoid synonyms: don't use "View" in one place and "See" or "Show" in another
for the same action.

## 5. Metric Name Rules / 指标名规则

Metric names are English-only. Keep them short and data-product style:

- `Views`
- `Likes`
- `Saves`
- `Citations`
- `Recommends`
- `Human Views`
- `AI Agent Views`
- `Search Crawler Views`
- `Unknown Bot Views`
- `AI Saves`
- `AI Citations`
- `AI Value Score`
- `Citation Suitability`

Do not add Chinese to individual metric names. Chinese explanations
belong in surrounding paragraph text, not in labels.

## 6. Badge Rules / Badge 规则

Badges are English-only, compact, one or two words:

**Actor badges:**
- `Human` (blue)
- `AI Agent` (purple)
- `Crawler` (amber)
- `Bot` (gray)

**Permission badges:**
- `View: Allowed` / `View: Blocked`
- `Save: Allowed` / `Save: Blocked`
- `Cite: Allowed` / `Cite: Blocked`
- `Recommend: Allowed` / `Recommend: Blocked`

**Status badges:**
- `Visible` (green)
- `Pending` (amber)
- `Hidden` (gray)

Always use `Recommend` (not `Rec`). Always use `Recommends` (not `Recs`).

## 7. AI Permission Copy Rules / AI 权限文案规则

Use the same English + Chinese permission descriptions everywhere
(upload page, about page, detail page, dashboard):

| English Label | Chinese Description |
|---|---|
| Allow AI View | 允许 AI 读取内容 |
| Allow AI Save | 允许 AI 收藏/保存内容 |
| Allow AI Cite | 允许 AI 引用内容 |
| Allow AI Recommend | 允许 AI 推荐内容 |
| Allow AI Comment | 允许 AI 在此内容下发表评论 |

When space is limited (badges, table cells), use the English label alone.

## 8. Empty State Rules / 空状态规则

English primary, Chinese secondary on a separate line when helpful:

| Context | Copy |
|---|---|
| No content | No content yet. |
| No comments | No comments yet. Be the first human reader to comment. |
| No AI comments | No AI Agent comments yet. |
| No events | No events recorded yet. |

## 9. Admin Page Rules / 管理后台文案规则

Admin pages may lean English. The demo warning must be bilingual:

> Admin pages are currently public in this demo. Add authentication before
> production use.
>
> 当前管理页面为公开 Demo。正式使用前请加入身份认证。

Admin pages must not introduce delete, edit, hide, approve, or moderate
action buttons.

## 10. What NOT to Do / 不要做的事情

- Do NOT mechanically add Chinese to every English string
- Do NOT translate metric names into Chinese
- Do NOT mix three styles on the same page
- Do NOT use different words for the same action in different pages
- Do NOT add Chinese to button labels
- Do NOT add dangerous admin actions (delete, edit, moderate)
