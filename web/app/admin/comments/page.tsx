import Link from "next/link";
import { getAdminComments, getCommentStats } from "@/lib/repository";
import type { AdminComment } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatCommentTime(raw: string): string {
  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
    </div>
  );
}

function ActorBadge({ actorType }: { actorType: AdminComment["actor_type"] }) {
  const isAiAgent = actorType === "ai_agent";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isAiAgent ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
      }`}
    >
      {isAiAgent ? "AI Agent" : "Human"}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminComment["status"] }) {
  const styles = {
    visible: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    hidden: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        styles[status] ?? styles.visible
      }`}
    >
      {status}
    </span>
  );
}

export default async function AdminCommentsPage() {
  const [comments, stats] = await Promise.all([
    getAdminComments(100),
    getCommentStats(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Comments / 评论管理</h1>
          <p className="mt-1 text-xs text-slate-400">
            Review human and AI agent comments across CoView.
          </p>
        </div>
        <span className="text-xs text-slate-400">
          Showing latest {comments.length} comments
        </span>
      </div>

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Comments" value={stats.totalComments} />
        <StatCard label="Human Comments" value={stats.humanComments} />
        <StatCard label="AI Agent Comments" value={stats.aiAgentComments} />
        <StatCard label="Visible Comments" value={stats.visibleComments} />
        <StatCard
          label="Pending / Hidden Comments"
          value={stats.pendingHiddenComments}
        />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent 100 Comments
          </h2>
          <span className="text-xs text-slate-400">
            Read-only view. No edit, hide, approve, or delete actions are available.
          </span>
        </div>

        {comments.length === 0 ? (
          <div className="rounded-xl border bg-white px-5 py-12 text-center">
            <p className="text-sm text-slate-400">No comments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Time
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Content
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Author
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Actor
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Body
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                        {formatCommentTime(comment.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[190px] truncate text-xs font-medium text-slate-700">
                          {comment.content_title ?? comment.content_id}
                        </div>
                        <div className="mt-0.5 max-w-[190px] truncate font-mono text-[10px] text-slate-400">
                          {comment.content_id}
                        </div>
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-xs font-medium text-slate-600">
                        {comment.author_display_name}
                      </td>
                      <td className="px-4 py-3">
                        <ActorBadge actorType={comment.actor_type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={comment.status} />
                      </td>
                      <td className="max-w-[260px] px-4 py-3 text-xs leading-5 text-slate-500">
                        {truncate(comment.body, 140)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/content/${comment.content_slug ?? comment.content_id}`}
                          className="inline-block whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
                        >
                          View Content
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
