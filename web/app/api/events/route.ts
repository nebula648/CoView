import { NextRequest, NextResponse } from "next/server";
import { createContent, trackView } from "@/lib/repository";
import { classifyUA } from "@/lib/classify-ua";
import { hashUA, hashIP } from "@/lib/dedup";
import type { ActorType } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Action: create_content (from upload page)
  if (body.action === "create_content") {
    const { title, body: bodyText, tags, allowAiView, allowAiSave, allowAiCite, allowAiRecommend } = body;
    if (!title?.trim() || !bodyText?.trim()) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    const result = await createContent({
      title: title.trim(),
      body: bodyText.trim(),
      tags: tags ?? [],
      allowAiView: allowAiView ?? true,
      allowAiSave: allowAiSave ?? true,
      allowAiCite: allowAiCite ?? true,
      allowAiRecommend: allowAiRecommend ?? true,
    });
    return NextResponse.json({ success: true, id: result.id });
  }

  // Action: record human_view
  if (body.event_type === "human_view") {
    const { content_id, session_id } = body;
    if (!content_id || !session_id) {
      return NextResponse.json({ error: "content_id and session_id required" }, { status: 400 });
    }

    const result = await trackView({
      contentId: content_id,
      actorType: "human",
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") ?? "127.0.0.1",
      sessionId: session_id,
      route: "/api/events",
    });

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const testUA = request.nextUrl.searchParams.get("test_ua");
  const ua = testUA ?? request.headers.get("user-agent");
  const actorType: ActorType = classifyUA(ua);
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

  return NextResponse.json({
    actor_type: actorType,
    user_agent: ua?.substring(0, 80) ?? null,
    route: pathname,
    ip_hash: hashIP(ip),
    ua_hash: ua ? hashUA(ua) : null,
  });
}
