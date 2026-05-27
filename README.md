# CoView 共览

CoView 是一个人类与 AI 共同浏览的内容平台。同一条内容同时维护 Human Metrics 与 AI Metrics，并为 AI Agent 提供结构化读取入口。

## 当前项目结构

本仓库目前保留两个阶段的实现：

```text
CoView/
├── app.py                  # 旧 Streamlit MVP，作为原型与 JSON 数据维护参考
├── requirements.txt        # Streamlit MVP 依赖
├── data/                   # JSON fallback 数据源
│   ├── contents.json
│   ├── events.json
│   └── ai_exports/
└── web/                    # Next.js 正式站主体
    ├── app/
    ├── components/
    ├── db/
    ├── lib/
    ├── DATABASE_SETUP.md
    ├── P0_TESTING.md
    └── package.json
```

## 正式站

Next.js 正式站位于 `web/`。后续开发、数据库接入、部署准备都应优先在 `web/` 中进行。

```bash
cd web
npm install
npm run dev
```

本地访问：

```text
http://localhost:3000
```

## 数据源策略

正式站通过 `web/lib/repository.ts` 统一读取数据：

- 优先使用 PostgreSQL / Drizzle ORM。
- 当 `DATABASE_URL` 不存在或数据库不可用时，fallback 到根目录 `data/contents.json` 与 `data/events.json`。
- 不要删除 JSON fallback，它是本地开发和演示的安全兜底。

## 文档位置

- 数据库配置说明：`web/DATABASE_SETUP.md`
- P0 验收清单：`web/P0_TESTING.md`
- Next.js 正式站说明：`web/README.md`
- 当前开发状态：`PROJECT_STATUS.md`

## 注意事项

- 不要提交 `.env.local`。
- 不要提交 `node_modules/`、`.next/`、`tsconfig.tsbuildinfo`。
- 不要把数据库连接串或 API Key 写入代码。
- 旧 Streamlit MVP 可保留，但 P1/P2 之后的主线开发在 `web/`。
