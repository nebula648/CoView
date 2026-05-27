"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ensureVisitorProfile,
  type VisitorProfile,
} from "@/lib/visitor-profile";

type Status =
  | {
      type: "success";
      msg: string;
      id: string;
      title: string;
      allowAiView: boolean;
      authorDisplayName: string;
    }
  | { type: "error"; msg: string };

const PERMISSIONS = [
  {
    key: "view",
    title: "Allow AI View",
    description: "允许 AI 读取内容",
  },
  {
    key: "save",
    title: "Allow AI Save",
    description: "允许 AI 收藏/保存内容",
  },
  {
    key: "cite",
    title: "Allow AI Cite",
    description: "允许 AI 引用内容",
  },
  {
    key: "recommend",
    title: "Allow AI Recommend",
    description: "允许 AI 推荐内容",
  },
  {
    key: "comment",
    title: "Allow AI Comment",
    description: "允许 AI 在此内容下发表评论",
  },
] as const;

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [allowAiView, setAllowAiView] = useState(true);
  const [allowAiSave, setAllowAiSave] = useState(true);
  const [allowAiCite, setAllowAiCite] = useState(true);
  const [allowAiRecommend, setAllowAiRecommend] = useState(true);
  const [allowAiComment, setAllowAiComment] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const parsedTags = tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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
            msg: "Unable to create your visitor identity. Please refresh and try again.",
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

    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle || !cleanBody) {
      setStatus({
        type: "error",
        msg: "Please add both a title and body before publishing.",
      });
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
          msg: "Unable to create your visitor identity. Please refresh and try again.",
        });
        return;
      }
    }

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_content",
        title: cleanTitle,
        body: cleanBody,
        tags: parsedTags,
        authorId: activeProfile.profileId,
        authorDisplayName: activeProfile.displayName,
        allowAiView,
        allowAiSave,
        allowAiCite,
        allowAiRecommend,
        allowAiComment,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      setStatus({
        type: "success",
        msg: "Content published successfully.",
        id: result.id,
        title: cleanTitle,
        allowAiView,
        authorDisplayName: activeProfile.displayName,
      });
      setTitle("");
      setBody("");
      setTagsText("");
      setAllowAiView(true);
      setAllowAiSave(true);
      setAllowAiCite(true);
      setAllowAiRecommend(true);
      setAllowAiComment(false);
    } else {
      setStatus({
        type: "error",
        msg: "Publishing failed. Please check the content and try again.",
      });
    }
  }

  function permissionValue(key: (typeof PERMISSIONS)[number]["key"]): boolean {
    if (key === "view") return allowAiView;
    if (key === "save") return allowAiSave;
    if (key === "cite") return allowAiCite;
    if (key === "comment") return allowAiComment;
    return allowAiRecommend;
  }

  function updatePermission(
    key: (typeof PERMISSIONS)[number]["key"],
    checked: boolean,
  ) {
    if (key === "view") setAllowAiView(checked);
    else if (key === "save") setAllowAiSave(checked);
    else if (key === "cite") setAllowAiCite(checked);
    else if (key === "comment") setAllowAiComment(checked);
    else setAllowAiRecommend(checked);
  }

  return (
    <div className="max-w-5xl">
      <section className="mb-8 rounded-2xl border bg-gradient-to-br from-slate-950 to-slate-800 px-6 py-7 text-white shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          CoView Publishing
        </p>
        <h1 className="mb-3 text-3xl font-bold">Upload Content</h1>
        <p className="mb-3 text-lg text-slate-200">
          Publish content for both human readers and AI agents.
        </p>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          CoView lets you decide whether AI agents can view, save, cite, or
          recommend your content.
        </p>
        <div className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100">
          {isLoadingProfile
            ? "Loading identity..."
            : `Current identity: ${profile?.displayName ?? "Unknown visitor"}`}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Basic Content
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This is the human-readable source content that will appear on
                the public detail page.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="A clear title for human readers and AI agents"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={9}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="Write the full content here..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="AI, knowledge, research"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Separate tags with commas. Tags help both people and AI agents
                  understand the content.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                AI Access Permissions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose how AI agents are allowed to interact with this content.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PERMISSIONS.map((permission) => {
                const checked = permissionValue(permission.key);
                return (
                  <label
                    key={permission.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      checked
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        updatePermission(permission.key, e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        {permission.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Publish Preview
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Title
                </p>
                <p className="mt-1 text-slate-700">
                  {title.trim() || "Untitled content"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tags
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parsedTags.length > 0 ? (
                    parsedTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No tags yet</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <h2 className="text-sm font-semibold text-purple-900">
              What happens after publishing?
            </h2>
            <p className="mt-2 text-sm leading-6 text-purple-800">
              After publishing, the content will appear in Discover, receive
              separate Human Metrics and AI Metrics, and expose an AI-readable
              JSON endpoint if AI View is allowed.
            </p>
          </section>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Publish Content
          </button>

          {status?.type === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {status.msg}
            </div>
          )}

          {status?.type === "success" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                {status.msg}
              </p>
              <p className="mt-1 text-sm text-emerald-700">{status.title}</p>
              <p className="mt-1 text-xs font-medium text-emerald-700">
                Published by {status.authorDisplayName}
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  href={`/content/${status.id}`}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-100"
                >
                  Public Page: /content/{status.id}
                </Link>
                <Link
                  href={`/api/contents/${status.id}.json`}
                  className={`rounded-lg bg-white px-3 py-2 text-sm font-medium ${
                    status.allowAiView
                      ? "text-purple-700 hover:bg-purple-100"
                      : "text-slate-400"
                  }`}
                >
                  AI JSON: /api/contents/{status.id}.json
                </Link>
                <Link
                  href="/discover"
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-100"
                >
                  Discover: /discover
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-100"
                >
                  Dashboard: /dashboard
                </Link>
              </div>
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}
