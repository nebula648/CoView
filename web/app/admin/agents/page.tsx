import Link from "next/link";
import { getAgents, getAgentStats } from "@/lib/repository";
import type { Agent } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatAgentTime(raw: string | null): string {
  if (!raw) return "—";
  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Agent["status"] }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    suspended: "bg-red-100 text-red-600",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default async function AdminAgentsPage() {
  const [agents, stats] = await Promise.all([getAgents(), getAgentStats()]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Agents / AI Agent 管理
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Review registered external AI Agent identities. This is a registry
            only; external write APIs are not enabled yet.
          </p>
        </div>
        <span className="text-xs text-slate-400">
          Read-only registry view
        </span>
      </div>

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Agents" value={stats.totalAgents} />
        <StatCard label="Active Agents" value={stats.activeAgents} />
        <StatCard label="Pending Agents" value={stats.pendingAgents} />
        <StatCard label="Suspended Agents" value={stats.suspendedAgents} />
      </section>

      <section className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-5">
        <h2 className="text-sm font-semibold text-purple-900">
          Registry-only phase
        </h2>
        <p className="mt-2 text-sm leading-6 text-purple-800">
          P9-1 creates platform identities for future external AI Agent
          participation. No agent tokens, external write APIs, public agent
          profiles, or real AI APIs are enabled in this phase.
        </p>
      </section>

      {agents.length === 0 ? (
        <div className="rounded-xl border bg-white px-5 py-12 text-center">
          <p className="text-sm text-slate-400">No agents registered yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Agent
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Owner
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Scopes
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Created
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Last Seen
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Homepage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="max-w-[220px] truncate text-sm font-semibold text-slate-800">
                        {agent.agent_name}
                      </div>
                      {agent.description && (
                        <div className="mt-0.5 max-w-[240px] truncate text-[11px] text-slate-400">
                          {agent.description}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs font-medium text-slate-600">
                      {agent.agent_owner_label}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {agent.agent_type}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {agent.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                      {formatAgentTime(agent.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                      {formatAgentTime(agent.last_seen_at)}
                    </td>
                    <td className="px-4 py-3">
                      {agent.homepage_url ? (
                        <Link
                          href={agent.homepage_url}
                          className="text-xs font-medium text-blue-500 hover:underline"
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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
