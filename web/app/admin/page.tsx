import { getStats, getRecentEvents } from "@/lib/repository";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getStats();
  const recentEvents = await getRecentEvents(10);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Admin Console</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <div className="rounded-xl border bg-white px-4 py-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-slate-800">
            {stats.totalContents}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Contents</div>
        </div>
        <div className="rounded-xl border bg-white px-4 py-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalHumanViews}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Human Views</div>
        </div>
        <div className="rounded-xl border bg-white px-4 py-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {stats.totalAiAgentViews}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">AI Agent Views</div>
        </div>
        <div className="rounded-xl border bg-white px-4 py-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-slate-800">
            {stats.totalEvents}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Events</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        <Link
          href="/admin/contents"
          className="rounded-lg border bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
        >
          Manage Contents
        </Link>
        <Link
          href="/admin/comments"
          className="rounded-lg border bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
        >
          Comments
        </Link>
        <Link
          href="/admin/events"
          className="rounded-lg border bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
        >
          Event Log
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
        >
          Public Dashboard ↗
        </Link>
        <Link
          href="/discover"
          className="rounded-lg border bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
        >
          Discover ↗
        </Link>
      </div>

      {/* Recent events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent Events
          </h2>
          <Link
            href="/admin/events"
            className="text-xs text-blue-500 hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="rounded-xl border bg-white px-5 py-8 text-center">
            <p className="text-sm text-slate-400">No events recorded yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
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
                    Content
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentEvents.map((e: any) => (
                  <tr key={e.event_id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                      {e.timestamp?.slice(0, 16) ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          e.actor_type === "human"
                            ? "bg-blue-100 text-blue-700"
                            : e.actor_type === "ai_agent"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {e.actor_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 font-medium">
                      {e.event_type}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell max-w-[180px] truncate">
                      {e.content_title ?? e.content_id ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
