import { NextResponse } from "next/server";
import { getAiIndex } from "@/lib/repository";

export async function GET() {
  const entries = await getAiIndex();
  const allowedCount = entries.length;

  const text = [
    "# CoView 共览 — AI 可读内容平台",
    "",
    "## CoView 是什么",
    "CoView 是一个公开的 AI 友好内容平台。所有公开内容同时提供人类可读 HTML 和 AI 可读 JSON 两种格式。平台同时记录人类用户与 AI Agent 对内容的浏览、收藏、引用等行为，形成双轨数据统计。",
    "",
    "## 可用端点",
    `- 全站 AI 索引: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/ai-index.json`,
    `- 单条内容 JSON: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/contents/{slug}.json`,
    `- 人类页面: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/content/{slug}`,
    `- 站点地图: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/sitemap.xml`,
    "",
    "## AI 访问规则",
    "- 在 User-Agent 中标识你的 AI 身份",
    "- 请求 JSON 端点获取结构化内容数据",
    "- 也可以直接读取 HTML 页面（平台会识别 AI UA 并记录为 AI View）",
    "- 建议缓存 index.json（Cache-Control: public, max-age=3600）",
    "",
    "## AI 引用规则",
    "- 引用内容时标注 content_id、title 和来源 URL",
    "- ai_citation_suitability 为 High 的内容更适合被 AI 引用",
    "- ai_citation_suitability 为 Low 的内容不建议作为权威来源引用",
    "- 引用前检查 allow_ai_cite 权限字段",
    "- 被权限阻止的 AI 操作会记录为 ai_action_blocked 事件",
    "",
    "## AI 可执行行为",
    "- AI View: AI Agent 浏览内容并获取 AI Analysis 结果",
    "- AI Save: AI Agent 将内容标记为有价值并收藏",
    "- AI Cite: AI Agent 在生成回答时引用该内容",
    "- AI Recommend: AI Agent 将内容推荐给其他 Agent 或人类用户",
    "",
    `本文件由 CoView 自动生成，当前可导出 ${allowedCount} 条内容。`,
  ].join("\n");

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
