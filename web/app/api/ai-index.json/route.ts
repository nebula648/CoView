import { NextRequest, NextResponse } from "next/server";
import { getAiIndex, trackSiteLevelAiVisit } from "@/lib/repository";
import { detectAiVisitor, isConfidentVisitor } from "@/lib/ai-visitor-detection";

export async function GET(request: NextRequest) {
  // Record AI visitor trace (fire-and-forget)
  try {
    const ua = request.headers.get("user-agent");
    const detection = detectAiVisitor(ua);
    if (isConfidentVisitor(detection)) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "127.0.0.1";
      trackSiteLevelAiVisit({
        path: "/api/ai-index.json",
        actorType: detection.actorType,
        botFamily: detection.botFamily ?? "generic_bot",
        userAgent: ua,
        ip,
      }).catch(() => {});
    }
  } catch {
    // fire-and-forget
  }

  const entries = await getAiIndex();

  const response = NextResponse.json(entries);
  response.headers.set("Cache-Control", "public, max-age=3600");
  return response;
}
