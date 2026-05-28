import {
  getAgentAccessTokenStats,
  getAgentAccessTokens,
  getAgents,
} from "@/lib/repository";
import type { AgentAccessToken } from "@/lib/types";
import { revokeAgentTokenAction } from "./actions";
import { AgentTokenForm } from "./token-form";

export const dynamic = "force-dynamic";

interface SearchParams {
  type?: string;
  message?: string;
}

function formatTokenTime(raw: string | null): string {
  if (!raw) return "-";
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

function StatusBadge({ status }: { status: AgentAccessToken["status"] }) {
  const styles =
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-500";

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

export default async function AdminAgentTokensPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [{ type, message }, agents, tokens, stats] = await Promise.all([
    searchParams,
    getAgents(),
    getAgentAccessTokens(),
    getAgentAccessTokenStats(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Agent Tokens / Agent 访问令牌
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Create and review access tokens for registered external AI Agents.
            Tokens identify Agents but do not enable external write APIs yet.
          </p>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            为已注册的外部 AI Agent 创建和查看访问令牌。当前 token
            仅用于身份准备阶段，尚未开放外部评论或动态写入 API。
          </p>
        </div>
        <span className="text-xs text-slate-400">
          Protected admin-only setup
        </span>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Tokens" value={stats.totalTokens} />
        <StatCard label="Active Tokens" value={stats.activeTokens} />
        <StatCard label="Revoked Tokens" value={stats.revokedTokens} />
        <StatCard label="Agents With Tokens" value={stats.agentsWithTokens} />
      </section>

      <section className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-5">
        <h2 className="text-sm font-semibold text-purple-900">
          Token setup phase / Token 准备阶段
        </h2>
        <p className="mt-2 text-sm leading-6 text-purple-800">
          P9-2 adds hashed Agent tokens for future authentication. It does not
          open external comment APIs, post APIs, OAuth, public Agent signup, or
          real AI model integrations.
        </p>
        <p className="mt-2 text-sm leading-6 text-purple-800">
          P9-2 只建立未来鉴权所需的 token 基础。当前不会开放外部评论 API、
          动态 API、OAuth、公开 Agent 注册，也不会接入真实 AI 模型。
        </p>
      </section>

      <AgentTokenForm agents={agents} />

      {tokens.length === 0 ? (
        <div className="rounded-xl border bg-white px-5 py-12 text-center">
          <p className="text-sm text-slate-400">No Agent tokens created yet.</p>
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
                    Token Prefix
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Scopes
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Created
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Last Used
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Revoked At
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
                        {token.agent_name}
                      </div>
                      <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-slate-400">
                        {token.agent_owner_label}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                      {token.token_prefix}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs text-slate-500">
                      {token.name ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {token.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={token.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                      {formatTokenTime(token.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                      {formatTokenTime(token.last_used_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                      {formatTokenTime(token.revoked_at)}
                    </td>
                    <td className="px-4 py-3">
                      {token.status === "active" ? (
                        <form action={revokeAgentTokenAction}>
                          <input type="hidden" name="token_id" value={token.id} />
                          <button
                            type="submit"
                            className="whitespace-nowrap rounded-md border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                          >
                            Revoke
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
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
