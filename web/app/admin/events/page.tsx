import { getEventAnalytics, getRecentEvents } from "@/lib/repository";

export const dynamic = "force-dynamic";

const EVENT_TYPES = [
  "human_view",
  "ai_agent_view",
  "search_crawler_view",
  "unknown_bot_view",
  "ai_agent_save",
  "ai_agent_citation",
  "ai_agent_recommendation",
  "ai_action_blocked",
];

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

function EventActorBadge({ actorType }: { actorType: string }) {
  const styles: Record<string, string> = {
    human: "bg-blue-100 text-blue-700",
    ai_agent: "bg-purple-100 text-purple-700",
    search_crawler: "bg-amber-100 text-amber-700",
    unknown_bot: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        styles[actorType] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {actorType}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
    </div>
  );
}

function safeAgentLabel(event: any): string {
  if (event.user_agent_hash) return `${event.user_agent_hash.slice(0, 16)}...`;
  if (event.session_id) return `session:${event.session_id.slice(0, 8)}...`;
  return "—";
}

export default async function AdminEventsPage() {
  const events = await getRecentEvents(50);
  const analytics = await getEventAnalytics();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Event Log / 事件日志</h1>
          <p className="mt-1 text-xs text-slate-400">
            Read-only event analytics. IP addresses and raw user agents are not
            shown.
          </p>
        </div>
        <span className="text-xs text-slate-400">
          {events.length} recent events
        </span>
      </div>

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Events" value={analytics.totalEvents} />
        <StatCard label="Human Events" value={analytics.actorCounts.human ?? 0} />
        <StatCard
          label="AI Agent Events"
          value={analytics.actorCounts.ai_agent ?? 0}
        />
        <StatCard
          label="Crawler Events"
          value={analytics.actorCounts.search_crawler ?? 0}
        />
        <StatCard
          label="Bot Events"
          value={analytics.actorCounts.unknown_bot ?? 0}
        />
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Event Type Summary
          </h2>
          <span className="text-xs text-slate-400">
            Use this summary as the first-pass filter before scanning the table.
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {EVENT_TYPES.map((eventType) => (
            <div key={eventType} className="rounded-lg border bg-white p-3">
              <div className="text-lg font-bold text-slate-800">
                {analytics.eventTypeCounts[eventType] ?? 0}
              </div>
              <div className="mt-0.5 break-words text-[11px] text-slate-400">
                {eventType}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent 50 Events
          </h2>
          <span className="text-xs text-slate-400">
            UA/IP data is hash-only or session-truncated.
          </span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border bg-white px-5 py-12 text-center">
            <p className="text-sm text-slate-400">No events recorded yet.</p>
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
                      Actor
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Event Type
                    </th>
                    <th className="hidden px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:table-cell">
                      Content
                    </th>
                    <th className="hidden px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:table-cell">
                      UA Hash / Session
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((event: any) => (
                    <tr key={event.event_id} className="hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-500">
                        {formatEventTime(event.timestamp)}
                      </td>
                      <td className="px-4 py-2.5">
                        <EventActorBadge actorType={event.actor_type} />
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-600">
                        {event.event_type}
                      </td>
                      <td className="hidden max-w-[200px] truncate px-4 py-2.5 text-xs text-slate-400 sm:table-cell">
                        {event.content_title ?? event.content_id ?? "—"}
                      </td>
                      <td className="hidden max-w-[160px] truncate px-4 py-2.5 font-mono text-[11px] text-slate-400 md:table-cell">
                        {safeAgentLabel(event)}
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
