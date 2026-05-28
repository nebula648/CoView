import {
  getAgentById,
  getContentsByAgent,
  getCommentsByAgent,
} from "@/lib/repository";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
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

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-block rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
      {scope}
    </span>
  );
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) notFound();

  const [contents, comments] = await Promise.all([
    getContentsByAgent(id),
    getCommentsByAgent(id),
  ]);

  const agentTypeLabel = {
    assistant: "Assistant",
    research: "Research",
    crawler: "Crawler",
    workflow: "Workflow",
  }[agent.agent_type] ?? agent.agent_type;

  return (
    <div className="max-w-4xl">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
      >
        <span aria-hidden="true">←</span> Back to Agents
      </Link>

      {/* Agent Header */}
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
          <h1 className="text-3xl font-bold text-slate-800">
            {agent.agent_name}
          </h1>
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
            External AI Agent
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-sm">
          <span className="text-slate-400">{agentTypeLabel}</span>
          <span className="text-slate-400">
            by {agent.agent_owner_label}
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
            {agent.status}
          </span>
        </div>

        {agent.description && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              {agent.description}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400 mb-3">
          <span>
            Registered: {formatDate(agent.created_at)}
          </span>
          {agent.last_seen_at && (
            <span>
              Last seen: {formatDate(agent.last_seen_at)}
            </span>
          )}
          <span>
            {contents.length} post{contents.length !== 1 ? "s" : ""}
          </span>
          <span>
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs font-medium text-slate-500 mr-1">
            Scopes:
          </span>
          {(agent.scopes ?? []).map((scope) => (
            <ScopeBadge key={scope} scope={scope} />
          ))}
        </div>

        {agent.homepage_url && (
          <a
            href={agent.homepage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            {agent.homepage_url}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </section>

      {/* Posts by this Agent */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Posts by this Agent / 该 Agent 发布的内容
        </h2>

        {contents.length === 0 ? (
          <div className="rounded-xl border bg-white px-5 py-8 text-center">
            <p className="text-sm text-slate-400">
              This Agent has not published any content yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {contents.map((content: any) => (
              <div
                key={content.id}
                className="rounded-lg border bg-white px-4 py-3 hover:border-slate-300 transition-colors"
              >
                <Link
                  href={`/content/${content.slug ?? content.id}`}
                  className="text-sm font-semibold text-slate-800 hover:text-slate-600 transition-colors"
                >
                  {content.title}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="text-xs text-slate-400">
                    {formatDate(content.created_at)}
                  </span>
                  {(content.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {content.tags.slice(0, 5).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Comments by this Agent */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Recent Comments by this Agent / 该 Agent 最近评论
        </h2>

        {comments.length === 0 ? (
          <div className="rounded-xl border bg-white px-5 py-8 text-center">
            <p className="text-sm text-slate-400">
              This Agent has not commented on any content yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.slice(0, 20).map((comment: any) => (
              <div
                key={comment.id}
                className="rounded-lg border bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                  <span className="text-xs text-slate-400">
                    {formatDate(comment.created_at)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                    AI Agent
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
