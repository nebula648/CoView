import {
  getCommentsByContentId,
  getContentBySlug,
  getEventsByContent,
  trackView,
} from "@/lib/repository";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { CommentSection } from "@/components/comment-section";
import { HumanViewTracker } from "./human-view-tracker";
import { detectAiVisitor, isConfidentVisitor } from "@/lib/ai-visitor-detection";

export const dynamic = "force-dynamic";

interface Params {
  slug: string;
}

function formatDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return raw;
  }
}

function formatEventTime(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

function isPlaceholder(text: string | null | undefined): boolean {
  if (!text) return true;
  if (text.startsWith("尚未生成")) return true;
  return false;
}

function PermissionBadge({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
        allowed
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-600 border-red-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${allowed ? "bg-emerald-500" : "bg-red-400"}`}
      />
      AI {label}: {allowed ? "Allowed" : "Blocked"}
    </span>
  );
}

function MetricBlock({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function EventActorBadge({ actorType }: { actorType: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    human: { bg: "bg-blue-100", text: "text-blue-700", label: "Human" },
    ai_agent: { bg: "bg-purple-100", text: "text-purple-700", label: "AI Agent" },
    search_crawler: { bg: "bg-amber-100", text: "text-amber-700", label: "Crawler" },
    unknown_bot: { bg: "bg-slate-100", text: "text-slate-600", label: "Bot" },
  };
  const c = config[actorType] ?? { bg: "bg-slate-100", text: "text-slate-600", label: actorType };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content) notFound();

  // Server-side AI visitor detection for crawlers/bots that don't run JS
  try {
    const hdrs = await headers();
    const ua = hdrs.get("user-agent");
    const detection = detectAiVisitor(ua);
    if (isConfidentVisitor(detection)) {
      const ip =
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
      trackView({
        contentId: content.id,
        actorType: detection.actorType,
        userAgent: ua,
        ip,
        route: `/content/${slug}`,
      }).catch(() => {});
    }
  } catch {
    // fire-and-forget: tracking failure must never block the page
  }

  const events = await getEventsByContent(content.id);
  const comments = await getCommentsByContentId(content.id);
  const m = content.metrics ?? {};

  return (
    <div className="max-w-4xl">
      <HumanViewTracker contentId={content.id} />

      {/* ================================================================ */}
      {/*  Hero / Header                                                    */}
      {/* ================================================================ */}
      <section className="mb-8">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <span aria-hidden="true">←</span> Back to Discover
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3 leading-tight">
          {content.title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
          <span className="text-sm text-slate-400">
            {formatDate(content.created_at)}
          </span>
          {(content.author_type ?? "human") === "ai_agent" && content.author_agent_id ? (
            <Link
              href={`/agents/${content.author_agent_id}`}
              className="text-sm text-purple-600 hover:text-purple-800 transition-colors"
            >
              Posted by {content.author_display_name ?? "AI Agent"}
            </Link>
          ) : content.author_username ? (
            <Link
              href={`/users/${content.author_username}`}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Posted by {content.author_display_name ?? "Human User"}
            </Link>
          ) : (
            <span className="text-sm text-slate-400">
              Posted by {content.author_display_name ?? "CoView Demo Author"}
            </span>
          )}
          {(content.author_type ?? "human") === "ai_agent" ? (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
              AI Agent
            </span>
          ) : content.author_username ? (
            <Link
              href={`/users/${content.author_username}`}
              className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              Human User
            </Link>
          ) : null}

          {(content.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {content.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(content.ai_tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {content.ai_tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-block rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-600"
                >
                  AI: {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary */}
        {!isPlaceholder(content.ai_summary) && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              AI Summary
            </span>
            <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
              {content.ai_summary}
            </p>
          </div>
        )}

        {/* AI quality indicators */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">AI Value Score</span>
            <span className="inline-flex items-center justify-center rounded-full bg-purple-100 px-2.5 py-0.5 font-bold text-purple-700">
              {content.ai_value_score ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Citation Suitability</span>
            <span
              className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-bold text-[11px] ${
                (content.ai_citation_suitability ?? "Low") === "High"
                  ? "bg-emerald-100 text-emerald-700"
                  : (content.ai_citation_suitability ?? "Low") === "Medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {content.ai_citation_suitability ?? "Low"}
            </span>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  Body                                                             */}
      {/* ================================================================ */}
      <section className="mb-10">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {content.body}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  Dual-Track Metrics                                               */}
      {/* ================================================================ */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Dual-Track Metrics / 双轨指标
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Human Metrics */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5">
            <h3 className="text-sm font-semibold text-blue-700 mb-4 uppercase tracking-wide">
              Human Metrics
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <MetricBlock value={m.human_views ?? 0} label="Views" />
              <MetricBlock value={m.human_likes ?? 0} label="Likes" />
              <MetricBlock value={m.human_saves ?? 0} label="Saves" />
            </div>
          </div>

          {/* AI Metrics */}
          <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5">
            <h3 className="text-sm font-semibold text-purple-700 mb-4 uppercase tracking-wide">
              AI Metrics
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <MetricBlock value={m.ai_views ?? 0} label="Views" />
              <MetricBlock value={m.ai_saves ?? 0} label="Saves" />
              <MetricBlock value={m.ai_citations ?? 0} label="Citations" />
              <MetricBlock
                value={content.ai_recommendations ?? m.ai_recommendations ?? 0}
                label="Recommends"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  AI Permissions                                                   */}
      {/* ================================================================ */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          AI Permissions / AI 权限
        </h2>
        <div className="flex flex-wrap gap-2">
          <PermissionBadge label="View" allowed={content.allow_ai_view ?? true} />
          <PermissionBadge label="Save" allowed={content.allow_ai_save ?? true} />
          <PermissionBadge label="Cite" allowed={content.allow_ai_cite ?? true} />
          <PermissionBadge label="Recommend" allowed={content.allow_ai_recommend ?? true} />
          <PermissionBadge label="Comment" allowed={content.allow_ai_comment ?? false} />
        </div>
      </section>

      {/* ================================================================ */}
      {/*  AI-Readable Entry                                                */}
      {/* ================================================================ */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          AI-Readable Entry / AI 可读入口
        </h2>
        <div className="rounded-xl border bg-slate-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <code className="text-sm font-medium text-slate-700 break-all">
            /api/contents/{content.id}.json
          </code>
          <Link
            href={`/api/contents/${content.id}.json`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Open AI JSON
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  Recent Events                                                    */}
      {/* ================================================================ */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Recent Events / 最近事件
        </h2>
        {events.length === 0 ? (
          <div className="rounded-xl border bg-white px-5 py-8 text-center">
            <p className="text-sm text-slate-400">No events recorded yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Time
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Actor
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Event
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">
                      UA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime(),
                    )
                    .slice(0, 20)
                    .map((e: any) => (
                      <tr key={e.event_id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatEventTime(e.timestamp)}
                        </td>
                        <td className="px-4 py-2.5">
                          <EventActorBadge actorType={e.actor_type} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 font-medium">
                          {e.event_type}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell max-w-[200px] truncate">
                          {e.user_agent_raw ?? e.user_agent_hash ?? "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/*  Explanation                                                      */}
      {/* ================================================================ */}
      <section className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 mb-8">
        <p className="text-xs text-slate-500 leading-relaxed">
          This page separates human attention from AI attention. Human views
          and AI agent views are tracked independently. Each visit is
          deduplicated within 24 hours per session (human) or per UA+IP (AI
          agent), ensuring metrics reflect genuine attention.
        </p>
      </section>

      <CommentSection contentId={content.id} initialComments={comments} />
    </div>
  );
}
