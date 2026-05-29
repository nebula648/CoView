import { classifyUA } from "./classify-ua";
import type { ActorType } from "./types";

export type BotFamily =
  | "chatgpt"
  | "claude"
  | "perplexity"
  | "google"
  | "bing"
  | "baidu"
  | "bytedance"
  | "other_ai"
  | "other_seo"
  | "generic_bot";

export interface AiVisitorDetection {
  isAiVisitor: boolean;
  actorType: ActorType;
  botFamily: BotFamily | null;
  confidence: "high" | "medium" | "low";
  userAgent: string | null;
}

type BotFamilyRule = {
  token: string;
  botFamily: BotFamily;
  confidence: "high" | "medium" | "low";
};

const BOT_FAMILY_RULES: BotFamilyRule[] = [
  { token: "chatgpt-user", botFamily: "chatgpt", confidence: "high" },
  { token: "oai-searchbot", botFamily: "chatgpt", confidence: "high" },
  { token: "gptbot", botFamily: "chatgpt", confidence: "high" },
  { token: "claudebot", botFamily: "claude", confidence: "high" },
  { token: "claude-web", botFamily: "claude", confidence: "high" },
  { token: "anthropic-ai", botFamily: "claude", confidence: "medium" },
  { token: "perplexitybot", botFamily: "perplexity", confidence: "high" },
  { token: "googlebot", botFamily: "google", confidence: "high" },
  { token: "google-extended", botFamily: "google", confidence: "high" },
  { token: "bingbot", botFamily: "bing", confidence: "high" },
  { token: "baiduspider", botFamily: "baidu", confidence: "high" },
  { token: "bytespider", botFamily: "bytedance", confidence: "high" },
  { token: "gemini", botFamily: "other_ai", confidence: "medium" },
  { token: "cohere", botFamily: "other_ai", confidence: "medium" },
  { token: "youbot", botFamily: "other_ai", confidence: "medium" },
  { token: "ccbot", botFamily: "other_ai", confidence: "medium" },
  { token: "petalbot", botFamily: "other_seo", confidence: "low" },
  { token: "ahrefsbot", botFamily: "other_seo", confidence: "low" },
  { token: "semrushbot", botFamily: "other_seo", confidence: "low" },
  { token: "dotbot", botFamily: "other_seo", confidence: "low" },
  { token: "mj12bot", botFamily: "other_seo", confidence: "low" },
  { token: "seekportbot", botFamily: "other_seo", confidence: "low" },
];

export function detectAiVisitor(
  userAgent: string | null,
): AiVisitorDetection {
  if (!userAgent) {
    return {
      isAiVisitor: false,
      actorType: "human",
      botFamily: null,
      confidence: "low",
      userAgent: null,
    };
  }

  const actorType = classifyUA(userAgent);

  if (actorType === "human") {
    return {
      isAiVisitor: false,
      actorType: "human",
      botFamily: null,
      confidence: "low",
      userAgent,
    };
  }

  const ua = userAgent.toLowerCase();
  let botFamily: BotFamily | null = null;
  let confidence: "high" | "medium" | "low" = "low";

  for (const rule of BOT_FAMILY_RULES) {
    if (ua.includes(rule.token)) {
      botFamily = rule.botFamily;
      confidence = rule.confidence;
      break;
    }
  }

  if (!botFamily) {
    botFamily = "generic_bot";
    confidence = "low";
  }

  return {
    isAiVisitor: true,
    actorType,
    botFamily,
    confidence,
    userAgent,
  };
}

export function isConfidentVisitor(
  detection: AiVisitorDetection,
): boolean {
  return detection.isAiVisitor && detection.confidence !== "low";
}
