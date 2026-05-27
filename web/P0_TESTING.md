# P0 验收测试清单

## 测试环境准备

```bash
cd web
npm run dev
# 浏览器打开 http://localhost:3000
```

确保 `data/contents.json` 中有示例内容（Streamlit MVP 的数据可直接复用）。

---

## 1. 首页 `/`

- [ ] 浏览器打开 `http://localhost:3000/`
- [ ] 显示 "CoView 共览" 标题
- [ ] 显示内容数、Human Views、AI Views 三个指标卡片
- [ ] 显示引导文字："从侧边栏进入「发现」浏览内容"
- [ ] 左侧侧边栏导航正常

## 2. 发现页 `/discover`

- [ ] 打开 `http://localhost:3000/discover`
- [ ] 显示所有内容卡片（标题、时间、标签、摘要）
- [ ] 每张卡片显示 Human Views、AI Views、AI Value Score、Citation Suitability
- [ ] 每张卡片有 "进入详情 →" 链接
- [ ] 如果没有内容，显示提示文字

## 3. 上传页 `/upload`

- [ ] 打开 `http://localhost:3000/upload`
- [ ] 表单包含标题、正文、标签、AI 权限（四个复选框）
- [ ] 提交空表单显示错误提示
- [ ] 填写完整后提交，显示成功提示
- [ ] 新内容出现在发现页和 `data/contents.json` 中

## 4. 内容详情页 `/content/[slug]`

- [ ] 从发现页点击 "进入详情"，进入 `http://localhost:3000/content/{id}`
- [ ] 显示标题、发布时间、标签、正文
- [ ] 显示 "← 返回发现" 链接
- [ ] 显示双轨数据（Human Metrics + AI Metrics）
- [ ] 显示 AI Permissions（四格 Allowed/Blocked）
- [ ] 显示 AI Analysis（Summary、Tags、Score、Suitability）
- [ ] 显示最近事件列表
- [ ] 访问不存在的 slug 显示 404 页面

---

## 5. AI JSON `/api/contents/[slug].json`

- [ ] 打开 `http://localhost:3000/api/contents/{id}.json`（id 替换为实际内容 ID）
- [ ] 返回 JSON，Content-Type 为 `application/json`
- [ ] JSON 包含 `@context`、`@type: "Article"`
- [ ] 包含 `coView:contentId`、`coView:title`、`coView:body`
- [ ] 包含 `coView:aiAnalysis` 含 summary、tags、valueScore 等
- [ ] 包含 `coView:metrics`（human 和 ai 双轨）
- [ ] 包含 `coView:usagePolicy`
- [ ] 访问不存在的 slug 返回 `{"error": "Not found"}` (404)
- [ ] 如果 `allow_ai_view` 为 false，返回 403

## 6. AI 索引 `/api/ai-index.json`

- [ ] 打开 `http://localhost:3000/api/ai-index.json`
- [ ] 返回数组，每项包含 contentId、slug、title、aiSummary、aiTags 等
- [ ] 响应头包含 `Cache-Control: public, max-age=3600`
- [ ] 不包含 `allow_ai_view = false` 的内容

## 7. llms.txt `/llms.txt`

- [ ] 打开 `http://localhost:3000/llms.txt`
- [ ] 返回 text/plain，包含 Markdown 格式文本
- [ ] 包含 "CoView 共览" 标题
- [ ] 包含 `/api/ai-index.json` 链接
- [ ] 包含 `/api/contents/{slug}.json` 说明
- [ ] 包含 AI 访问规则和引用规则
- [ ] 响应头包含 `Content-Type: text/plain; charset=utf-8`

## 8. robots.txt `/robots.txt`

- [ ] 打开 `http://localhost:3000/robots.txt`
- [ ] 包含 `GPTBot`、`ChatGPT-User`、`ClaudeBot`、`PerplexityBot` 的 Allow 规则
- [ ] 包含 `Googlebot` 的 Allow 规则
- [ ] 包含 `User-agent: *` 的 Disallow 规则（`/admin/`）
- [ ] 包含 `Sitemap:` 指向

## 9. sitemap.xml `/sitemap.xml`

- [ ] 打开 `http://localhost:3000/sitemap.xml`
- [ ] 返回 XML，Content-Type 为 `application/xml`
- [ ] 包含首页 `/` 的 `<url>`
- [ ] 包含 `/discover` 和 `/dashboard` 的 `<url>`
- [ ] 包含每条内容的 `/content/{id}` 的 `<url>`
- [ ] 包含每条允许 AI 浏览内容的 `/api/contents/{id}.json` 的 `<url>`

---

## 10. UA 分类测试 `/debug/ua`

- [ ] 打开 `http://localhost:3000/debug/ua`
- [ ] 页面包含预设按钮：GPTBot、ChatGPT-User、ClaudeBot、PerplexityBot、Googlebot、Bingbot、AhrefsBot、Mozilla/5.0
- [ ] 输入框可手动输入 UA
- [ ] 各预设的分类结果：
  - GPTBot → `ai_agent`
  - ChatGPT-User → `ai_agent`
  - ClaudeBot → `ai_agent`
  - PerplexityBot → `ai_agent`
  - Googlebot → `search_crawler`
  - Bingbot → `search_crawler`
  - AhrefsBot → `unknown_bot`
  - Mozilla/5.0 → `human`
- [ ] 空 UA 或空输入 → `human`
- [ ] 包含 `bot` 但不匹配已知列表 → `unknown_bot`

---

## 验收结论

- [ ] 全部通过，P0 阶段完成
- [ ] 发现问题，需修复（附说明）：

---

*测试人：___________  日期：___________*
