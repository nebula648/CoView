import { NextRequest, NextResponse } from "next/server";
import { createComment, getCommentsByContentId } from "@/lib/repository";

const MAX_COMMENT_LENGTH = 1000;

export async function GET(request: NextRequest) {
  const contentId = request.nextUrl.searchParams.get("content_id");
  if (!contentId) {
    return NextResponse.json(
      { error: "content_id is required" },
      { status: 400 },
    );
  }

  const comments = await getCommentsByContentId(contentId);
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contentId = typeof body.content_id === "string" ? body.content_id : "";
  const commentBody = typeof body.body === "string" ? body.body.trim() : "";
  const authorDisplayName =
    typeof body.author_display_name === "string"
      ? body.author_display_name.trim()
      : "";
  const authorId = typeof body.author_id === "string" ? body.author_id : null;

  if (!contentId) {
    return NextResponse.json(
      { error: "content_id is required" },
      { status: 400 },
    );
  }

  if (!commentBody) {
    return NextResponse.json(
      { error: "Comment body is required" },
      { status: 400 },
    );
  }

  if (commentBody.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: "Comment body must be 1000 characters or fewer" },
      { status: 400 },
    );
  }

  if (!authorDisplayName) {
    return NextResponse.json(
      { error: "author_display_name is required" },
      { status: 400 },
    );
  }

  const comment = await createComment({
    contentId,
    authorId,
    authorDisplayName,
    body: commentBody,
  });

  return NextResponse.json({ success: true, comment });
}
