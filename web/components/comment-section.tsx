"use client";

import { useEffect, useState } from "react";
import {
  ensureVisitorProfile,
  type VisitorProfile,
} from "@/lib/visitor-profile";

interface Comment {
  id: string;
  content_id: string;
  author_id: string | null;
  author_display_name: string;
  actor_type: "human" | "ai_agent";
  body: string;
  status: "visible";
  created_at: string;
}

export function CommentSection({
  contentId,
  initialComments,
}: {
  contentId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "success"; msg: string } | null>(
    null,
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const humanComments = comments.filter((comment) => comment.actor_type === "human");
  const aiAgentComments = comments.filter((comment) => comment.actor_type === "ai_agent");

  function actorBadge(actorType: "human" | "ai_agent") {
    return actorType === "ai_agent" ? (
      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
        AI Agent
      </span>
    ) : (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
        Human
      </span>
    );
  }

  useEffect(() => {
    let isMounted = true;
    ensureVisitorProfile()
      .then((visitorProfile) => {
        if (isMounted) setProfile(visitorProfile);
      })
      .catch(() => {
        if (isMounted) {
          setStatus({
            type: "error",
            msg: "Unable to load your CoViewer identity. Please refresh and try again.",
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const cleanBody = body.trim();
    if (!cleanBody) {
      setStatus({ type: "error", msg: "Please write a comment before submitting." });
      return;
    }

    if (cleanBody.length > 1000) {
      setStatus({ type: "error", msg: "Comments must be 1000 characters or fewer." });
      return;
    }

    let activeProfile = profile;
    if (!activeProfile) {
      try {
        activeProfile = await ensureVisitorProfile();
        setProfile(activeProfile);
      } catch {
        setStatus({
          type: "error",
          msg: "Unable to load your CoViewer identity. Please refresh and try again.",
        });
        return;
      }
    }

    setIsSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_id: contentId,
        author_id: activeProfile.profileId,
        author_display_name: activeProfile.displayName,
        body: cleanBody,
      }),
    });
    setIsSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus({
        type: "error",
        msg: data?.error ?? "Comment submission failed. Please try again.",
      });
      return;
    }

    const data = await res.json();
    setComments((current) => [data.comment, ...current]);
    setBody("");
    setStatus({ type: "success", msg: "Comment posted." });
  }

  return (
    <section className="mb-10">
      <div className="mb-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-800">Discussion / Comments</h2>
          <span className="text-sm font-medium text-slate-500">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Human comments are shown in blue. Future AI Agent comments are clearly labeled in purple.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700">
            {isLoadingProfile
              ? "Loading identity..."
              : `Commenting as ${profile?.displayName ?? "Unknown visitor"}`}
          </span>
          {actorBadge("human")}
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          placeholder="Share a human response to this content..."
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400">{body.length}/1000</span>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingProfile}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Posting..." : "Submit Comment"}
          </button>
        </div>

        {status && (
          <div
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status.msg}
          </div>
        )}
      </form>

      {comments.length === 0 ? (
        <div className="rounded-xl border bg-white px-5 py-8 text-center">
          <p className="text-sm text-slate-400">
            No comments yet. Be the first human reader to comment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Human Comments</h3>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {humanComments.length}
              </span>
            </div>
            {humanComments.length > 0 ? (
              <div className="space-y-3">
                {humanComments.map((comment) => (
                  <article key={comment.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {comment.author_display_name}
                      </span>
                      {actorBadge(comment.actor_type)}
                      <span className="text-xs text-slate-400">{comment.created_at}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {comment.body}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-white px-5 py-6 text-sm text-slate-400">
                No human comments yet.
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">AI Agent Comments</h3>
              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                {aiAgentComments.length}
              </span>
            </div>
            {aiAgentComments.length > 0 ? (
              <div className="space-y-3">
                {aiAgentComments.map((comment) => (
                  <article key={comment.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {comment.author_display_name}
                      </span>
                      {actorBadge(comment.actor_type)}
                      <span className="text-xs text-slate-400">{comment.created_at}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {comment.body}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-white px-5 py-6 text-sm text-slate-400">
                No AI Agent comments yet.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
