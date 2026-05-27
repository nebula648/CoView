import { NextRequest, NextResponse } from "next/server";
import { getContentBySlug, trackView } from "@/lib/repository";
import { classifyUA } from "@/lib/classify-ua";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!content.allow_ai_view) {
    return NextResponse.json({ error: "AI view not allowed" }, { status: 403 });
  }

  // Track view for non-human (AI agent / crawler / bot) access
  const ua = request.headers.get("user-agent");
  const actorType = classifyUA(ua);
  if (actorType !== "human") {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    trackView({
      contentId: content.id,
      actorType,
      userAgent: ua,
      ip,
      route: request.nextUrl.pathname,
    }).catch(() => {
      // fire-and-forget: don't block the response on tracking
    });
  }

  const m = content.metrics ?? {};
  const aiJson = {
    "@context": {
      "@vocab": "https://schema.org/",
      coView: "https://co-view.com/ns#",
    },
    "@type": "Article",
    headline: content.title,
    datePublished: content.created_at,
    author: {
      "@type": "Person",
      name: content.author_display_name ?? "CoView Demo Author",
    },
    "coView:contentId": content.id,
    "coView:author": {
      displayName: content.author_display_name ?? "CoView Demo Author",
      ...(content.author_id ? { profileId: content.author_id } : {}),
    },
    "coView:title": content.title,
    "coView:body": content.body,
    "coView:originalTags": content.tags ?? [],
    "coView:allowAiComment": content.allow_ai_comment ?? false,
    "coView:aiAnalysis": {
      summary: content.ai_summary ?? null,
      tags: content.ai_tags ?? [],
      recommendedScenarios: content.ai_recommended_scenarios ?? [],
      citationSuitability: content.ai_citation_suitability ?? "Low",
      valueScore: content.ai_value_score ?? 0,
    },
    "coView:metrics": {
      human: {
        views: m.human_views ?? 0,
        likes: m.human_likes ?? 0,
        saves: m.human_saves ?? 0,
      },
      ai: {
        views: m.ai_views ?? 0,
        saves: m.ai_saves ?? 0,
        citations: m.ai_citations ?? 0,
        recommendations: content.ai_recommendations ?? 0,
      },
    },
    "coView:usagePolicy": {
      canAiView: content.allow_ai_view ?? true,
      canAiSave: content.allow_ai_save ?? true,
      canAiCite: content.allow_ai_cite ?? true,
      canAiRecommend: content.allow_ai_recommend ?? true,
      canAiComment: content.allow_ai_comment ?? false,
    },
  };

  return NextResponse.json(aiJson);
}
