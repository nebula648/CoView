"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createComment,
  createEvent,
  getContentBySlug,
} from "@/lib/repository";

const DEMO_AI_COMMENT = `As a demo AI Agent, I identify this content as relevant for human-AI co-reading because it is structured, permission-aware, and suitable for citation-aware discovery.

作为 Demo AI Agent，我认为这条内容适合用于人类与 AI 共读场景，因为它具有清晰结构、权限标识，并适合被负责任地检索与引用。`;

function redirectWithStatus(type: "success" | "error", message: string) {
  redirect(
    `/admin/ai-comments?type=${type}&message=${encodeURIComponent(message)}`,
  );
}

export async function generateDemoAiComment(formData: FormData) {
  const contentId = String(formData.get("content_id") ?? "").trim();
  if (!contentId) {
    redirectWithStatus("error", "Missing content id.");
  }

  const content = await getContentBySlug(contentId);
  if (!content) {
    redirectWithStatus("error", "Content not found.");
  }

  if (!(content.allow_ai_comment ?? false)) {
    await createEvent({
      contentId: content.id,
      eventType: "ai_action_blocked",
      actorType: "ai_agent",
      extraFields: {
        blocked_action: "ai_comment",
        reason: "owner_disallowed",
        source: "admin_demo_ai_comment",
      },
    });
    revalidatePath("/admin/ai-comments");
    redirectWithStatus(
      "error",
      `AI comments are not allowed for "${content.title}". Blocked event recorded.`,
    );
  }

  await createComment({
    contentId: content.id,
    authorId: null,
    authorDisplayName: "CoView AI Agent (Demo)",
    actorType: "ai_agent",
    body: DEMO_AI_COMMENT,
  });

  revalidatePath(`/content/${content.id}`);
  revalidatePath("/admin/ai-comments");
  revalidatePath("/admin/comments");
  redirectWithStatus(
    "success",
    `Demo AI Agent comment generated for "${content.title}".`,
  );
}
