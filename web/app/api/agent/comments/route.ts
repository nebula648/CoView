import { NextRequest, NextResponse } from "next/server";
import {
  createComment,
  createEvent,
  getContentBySlugOrId,
  validateAgentToken,
} from "@/lib/repository";
import type { AgentTokenValidationResult } from "@/lib/types";

const MAX_AGENT_COMMENT_LENGTH = 2000;

interface AgentCommentRequestBody {
  content_id?: unknown;
  body?: unknown;
  source_url?: unknown;
  reason?: unknown;
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
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      error,
      blocked_action: "ai_comment",
      reason,
      ...(extra ?? {}),
    },
    { status },
  );
}

async function recordBlockedAgentComment(params: {
  contentId: string;
  validation: Extract<AgentTokenValidationResult, { valid: false }>;
  reason: string;
}) {
  if (params.validation.reason === "invalid_token") return;

  await createEvent({
    contentId: params.contentId,
    eventType: "ai_action_blocked",
    actorType: "ai_agent",
    extraFields: {
      blocked_action: "ai_comment",
      reason: params.reason,
      agent_id: params.validation.agent?.id ?? null,
      agent_name: params.validation.agent?.agent_name ?? null,
      token_prefix: params.validation.token_prefix ?? null,
      source: "external_agent_api",
    },
  });
}

export async function POST(request: NextRequest) {
  const requestBody: AgentCommentRequestBody | null = await request
    .json()
    .catch(() => null);

  if (!requestBody) {
    return failureResponse(400, "Invalid JSON.", "invalid_request");
  }

  const contentId =
    typeof requestBody.content_id === "string"
      ? requestBody.content_id.trim()
      : "";
  const commentBody =
    typeof requestBody.body === "string" ? requestBody.body.trim() : "";
  const sourceUrl =
    typeof requestBody.source_url === "string"
      ? requestBody.source_url.trim().slice(0, 500)
      : null;
  const reason =
    typeof requestBody.reason === "string"
      ? requestBody.reason.trim().slice(0, 500)
      : null;

  if (!contentId) {
    return failureResponse(400, "content_id is required.", "invalid_request");
  }

  if (!commentBody) {
    return failureResponse(400, "Comment body is required.", "invalid_request");
  }

  if (commentBody.length > MAX_AGENT_COMMENT_LENGTH) {
    return failureResponse(
      400,
      "Comment body must be 2000 characters or fewer.",
      "invalid_request",
    );
  }

  const token = getBearerToken(request);
  if (!token) {
    return failureResponse(401, "Agent token is required.", "missing_token");
  }

  const validation = await validateAgentToken(token, "comment");
  if (!validation.valid && validation.reason === "invalid_token") {
    return failureResponse(401, "Invalid Agent token.", "invalid_token");
  }

  const content = await getContentBySlugOrId(contentId);
  if (!content) {
    return NextResponse.json(
      { success: false, error: "Content not found.", reason: "content_not_found" },
      { status: 404 },
    );
  }

  if (!validation.valid) {
    await recordBlockedAgentComment({
      contentId: content.id,
      validation,
      reason: validation.reason,
    });

    return failureResponse(
      validation.reason === "token_revoked" ? 401 : 403,
      "Agent is not allowed to comment.",
      validation.reason,
    );
  }

  if (!(content.allow_ai_comment ?? false)) {
    await createEvent({
      contentId: content.id,
      eventType: "ai_action_blocked",
      actorType: "ai_agent",
      extraFields: {
        blocked_action: "ai_comment",
        reason: "owner_disallowed",
        agent_id: validation.agent.id,
        agent_name: validation.agent.agent_name,
        token_prefix: validation.token_prefix,
        source: "external_agent_api",
      },
    });

    return failureResponse(
      403,
      "AI comments are not allowed for this content.",
      "owner_disallowed",
    );
  }

  const comment = await createComment({
    contentId: content.id,
    authorId: null,
    authorDisplayName: validation.agent.agent_name,
    actorType: "ai_agent",
    body: commentBody,
    eventExtraFields: {
      agent_id: validation.agent.id,
      agent_name: validation.agent.agent_name,
      token_prefix: validation.token_prefix,
      source: "external_agent_api",
      source_url: sourceUrl,
      reason,
    },
  });

  return NextResponse.json({
    success: true,
    comment_id: comment.id,
    content_id: content.id,
    agent_id: validation.agent.id,
    agent_name: validation.agent.agent_name,
    status: comment.status,
  });
}
