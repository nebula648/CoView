# CoView Web

这是 CoView 共览的 Next.js 正式站。

## 技术栈

- Next.js App Router
- TypeScript
- TailwindCSS
- PostgreSQL
- Drizzle ORM
- JSON fallback 数据源

## 本地运行

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run lint
npm run build
```

## 数据库模式

配置 `.env.local`：

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coview
```

初始化数据库：

```bash
npx tsx db/migrate.ts
npx tsx db/seed.ts
```

详细说明见 `DATABASE_SETUP.md`。

## JSON Fallback

当 `DATABASE_URL` 不存在或数据库不可用时，应用会 fallback 到：

```text
../data/contents.json
../data/events.json
```

这保证本地 Demo 即使没有 PostgreSQL 也能运行。

## 已有功能

- 首页 `/`
- 发现页 `/discover`
- 上传页 `/upload`
- 内容详情页 `/content/[slug]`
- 数据看板 `/dashboard`
- UA 调试页 `/debug/ua`
- AI JSON `/api/contents/[slug].json`
- AI Index `/api/ai-index.json`
- Stats API `/api/stats`
- Events API `/api/events`
- `llms.txt`
- `robots.txt`
- `sitemap.xml`

## 相关文档

- `DATABASE_SETUP.md`：PostgreSQL / Drizzle 设置
- `P0_TESTING.md`：P0 验收清单
- `../PROJECT_STATUS.md`：项目阶段状态
