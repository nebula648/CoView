import { getRecentEvents } from "@/lib/repository";

export const dynamic = "force-dynamic";

function formatEventTime(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return raw;
  }
}

export default async function AdminEventsPage() {
  const events = await getRecentEvents(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Event Log</h1>
        <span className="text-xs text-slate-400">
          {events.length} recent events
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border bg-white px-5 py-12 text-center">
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
                    Event Type
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">
                    Content
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">
                    UA / Hash
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((e: any) => (
                  <tr key={e.event_id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {formatEventTime(e.timestamp)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          e.actor_type === "human"
                            ? "bg-blue-100 text-blue-700"
                            : e.actor_type === "ai_agent"
                              ? "bg-purple-100 text-purple-700"
                              : e.actor_type === "search_crawler"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {e.actor_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 font-medium">
                      {e.event_type}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell max-w-[200px] truncate">
                      {e.content_title ?? e.content_id ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-400 font-mono hidden md:table-cell max-w-[160px] truncate">
                      {e.user_agent_hash
                        ? e.user_agent_hash.slice(0, 16) + "..."
                        : e.session_id
                          ? "session:" + e.session_id.slice(0, 8) + "..."
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
