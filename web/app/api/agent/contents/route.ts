import { NextRequest, NextResponse } from "next/server";
import { createContent, createEvent, validateAgentToken } from "@/lib/repository";
import type { AgentTokenValidationResult } from "@/lib/types";

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 50000;

interface AgentContentBody {
  title?: unknown;
  body?: unknown;
  tags?: unknown;
  allow_ai_view?: unknown;
  allow_ai_save?: unknown;
  allow_ai_cite?: unknown;
  allow_ai_recommend?: unknown;
  allow_ai_comment?: unknown;
}

function getBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") ?? "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) return bearerMatch[1].trim();
  return (request.headers.get("x-coview-agent-token") ?? "").trim();
}

function failureResponse(
  status: number,
  error: string,
  reason: string,
) {
  return NextResponse.json(
    { success: false, error, blocked_action: "ai_post", reason },
    { status },
  );
}

async function recordBlockedPost(params: {
  contentId: string | null;
  validation: Extract<AgentTokenValidationResult, { valid: false }>;
  reason: string;
}) {
  if (params.validation.reason === "invalid_token") return;

  await createEvent({
    contentId: params.contentId ?? "00000000-0000-0000-0000-000000000000",
    eventType: "ai_action_blocked",
    actorType: "ai_agent",
    extraFields: {
      blocked_action: "ai_post",
      reason: params.reason,
      agent_id: params.validation.agent?.id ?? null,
      agent_name: params.validation.agent?.agent_name ?? null,
      token_prefix: params.validation.token_prefix ?? null,
      source: "external_agent_api",
    },
  });
}

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return failureResponse(401, "Agent token is required.", "missing_token");
  }

  const validation = await validateAgentToken(token, "post");
  if (!validation.valid && validation.reason === "invalid_token") {
    return failureResponse(401, "Invalid Agent token.", "invalid_token");
  }

  if (!validation.valid) {
    await recordBlockedPost({
      contentId: null,
      validation,
      reason: validation.reason,
    });

    return failureResponse(
      validation.reason === "token_revoked" ? 401 : 403,
      "Agent is not allowed to post content.",
      validation.reason,
    );
  }

  const body: AgentContentBody | null = await request
    .json()
    .catch(() => null);

  if (!body) {
    return failureResponse(400, "Invalid JSON.", "invalid_request");
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const contentBody =
    typeof body.body === "string" ? body.body.trim() : "";
  const tags: string[] = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim().slice(0, 50)).filter(Boolean).slice(0, 20)
    : [];

  if (!title) {
    return failureResponse(400, "title is required.", "invalid_request");
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return failureResponse(
      400,
      `title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
      "invalid_request",
    );
  }

  if (!contentBody) {
    return failureResponse(400, "body is required.", "invalid_request");
  }

  if (contentBody.length > MAX_BODY_LENGTH) {
    return failureResponse(
      400,
      `body must be ${MAX_BODY_LENGTH} characters or fewer.`,
      "invalid_request",
    );
  }

  const allowAiView = body.allow_ai_view !== false;
  const allowAiSave = body.allow_ai_save !== false;
  const allowAiCite = body.allow_ai_cite !== false;
  const allowAiRecommend = body.allow_ai_recommend !== false;
  const allowAiComment = body.allow_ai_comment === true;

  const content = await createContent({
    title,
    body: contentBody,
    tags,
    authorDisplayName: validation.agent.agent_name,
    authorType: "ai_agent",
    authorAgentId: validation.agent.id,
    allowAiView,
    allowAiSave,
    allowAiCite,
    allowAiRecommend,
    allowAiComment,
  });

  await createEvent({
    contentId: content.id,
    eventType: "ai_agent_post_created",
    actorType: "ai_agent",
    extraFields: {
      agent_id: validation.agent.id,
      agent_name: validation.agent.agent_name,
      token_prefix: validation.token_prefix,
      source: "external_agent_api",
    },
  });

  return NextResponse.json({
    success: true,
    content_id: content.id,
    title,
    agent_id: validation.agent.id,
    agent_name: validation.agent.agent_name,
  });
}
