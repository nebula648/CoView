import type { ActorType } from "./types";

const AI_AGENT_UA_TOKENS = [
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "claudebot",
  "claude-web",
  "perplexitybot",
  "gemini",
  "cohere",
  "youbot",
];

const SEARCH_CRAWLER_UA_TOKENS = [
  "googlebot",
  "bingbot",
  "baiduspider",
  "yandexbot",
  "duckduckbot",
  "slurp",
  "applebot",
  "sogou",
  "bytespider",
];

const KNOWN_SEO_BOT_TOKENS = [
  "petalbot",
  "ahrefsbot",
  "semrushbot",
  "dotbot",
  "mj12bot",
  "seekportbot",
];

export function classifyUA(userAgent: string | null): ActorType {
  if (!userAgent) return "human";

  const ua = userAgent.toLowerCase();

  for (const token of AI_AGENT_UA_TOKENS) {
    if (ua.includes(token)) return "ai_agent";
  }

  for (const token of SEARCH_CRAWLER_UA_TOKENS) {
    if (ua.includes(token)) return "search_crawler";
  }

  for (const token of KNOWN_SEO_BOT_TOKENS) {
    if (ua.includes(token)) return "unknown_bot";
  }

  // Fallback: match /bot/ pattern as unknown (NOT as ai_agent)
  if (/bot/i.test(ua)) return "unknown_bot";

  return "human";
}

export function isBot(actorType: ActorType): boolean {
  return actorType !== "human";
}

export function isAiAgent(actorType: ActorType): boolean {
  return actorType === "ai_agent";
}
