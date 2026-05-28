"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAgentTokenAction,
  type CreateAgentTokenState,
} from "./actions";
import type { Agent } from "@/lib/types";

const initialCreateAgentTokenState: CreateAgentTokenState = {
  type: "idle",
  message: "",
};

export function AgentTokenForm({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id ?? "");
  const [state, formAction, isPending] = useActionState(
    createAgentTokenAction,
    initialCreateAgentTokenState,
  );

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId),
    [agents, selectedAgentId],
  );
  const scopes = selectedAgent?.scopes ?? [];

  useEffect(() => {
    if (state.type === "success") {
      router.refresh();
    }
  }, [router, state.type, state.tokenPrefix]);

  return (
    <section className="mb-8 rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Create Agent Token / 创建 Agent 访问令牌
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
          The full token is shown only once after creation. CoView stores only a
          SHA-256 hash and a short prefix.
        </p>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
          完整 token 只会在创建成功后显示一次。数据库只保存 hash 和短前缀。
        </p>
      </div>

      {state.type === "success" && state.token && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Copy this token now. It will not be shown again.
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            请现在复制此 token。离开当前状态后将不会再次显示完整 token。
          </p>
          <code className="mt-3 block overflow-x-auto rounded-md bg-white px-3 py-2 font-mono text-xs text-slate-800">
            {state.token}
          </code>
        </div>
      )}

      {state.type === "error" && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Agent
          </span>
          <select
            name="agent_id"
            value={selectedAgentId}
            onChange={(event) => setSelectedAgentId(event.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-purple-400"
            required
          >
            {agents.length === 0 ? (
              <option value="">No agents available</option>
            ) : (
              agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.agent_name}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Name
          </span>
          <input
            name="name"
            placeholder="Development token"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-purple-400"
          />
        </label>

        <div className="md:col-span-2">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Scopes / 权限范围
          </div>
          {scopes.length === 0 ? (
            <p className="text-sm text-slate-400">
              No scopes configured for this Agent.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {scopes.map((scope) => (
                <label
                  key={scope}
                  className="inline-flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"
                >
                  <input
                    type="checkbox"
                    name="scopes"
                    value={scope}
                    defaultChecked
                    className="h-3.5 w-3.5 accent-purple-600"
                  />
                  {scope}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending || agents.length === 0}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPending ? "Creating..." : "Create Token"}
          </button>
        </div>
      </form>
    </section>
  );
}
