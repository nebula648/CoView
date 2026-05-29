import Link from "next/link";

interface ContentCardProps {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  authorDisplayName?: string | null;
  authorType?: string | null;
  authorUsername?: string | null;
  aiSummary?: string | null;
  aiTags?: string[];
  authorAgentId?: string | null;
  humanViews: number;
  humanLikes: number;
  humanSaves: number;
  aiAgentViews: number;
  aiSaves: number;
  aiCitations: number;
  aiRecommendations: number;
  allowAiView: boolean;
  allowAiSave?: boolean;
  allowAiCite?: boolean;
  allowAiRecommend?: boolean;
}

function isPlaceholder(text: string | null | undefined): boolean {
  if (!text) return true;
  if (text.startsWith("尚未生成")) return true;
  return false;
}

function PermissionBadge({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        allowed
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-600 border border-red-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${allowed ? "bg-emerald-500" : "bg-red-400"}`} />
      {label}: {allowed ? "Allowed" : "Blocked"}
    </span>
  );
}

function MetricItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
      <span className="text-[11px] text-slate-400">{label}</span>
    </div>
  );
}

export function ContentCard({
  slug,
  title,
  body,
  tags,
  createdAt,
  authorDisplayName,
  authorType,
  authorUsername,
  authorAgentId,
  aiSummary,
  aiTags,
  humanViews,
  humanLikes,
  humanSaves,
  aiAgentViews,
  aiSaves,
  aiCitations,
  aiRecommendations,
  allowAiView,
  allowAiSave = true,
  allowAiCite = true,
  allowAiRecommend = true,
}: ContentCardProps) {
  const summary = !isPlaceholder(aiSummary)
    ? aiSummary!.length > 180
      ? aiSummary!.slice(0, 180) + "..."
      : aiSummary
    : body.length > 180
      ? body.slice(0, 180) + "..."
      : body;

  const displayTags = tags.length > 0 ? tags : (aiTags && aiTags.length > 0 ? aiTags : []);

  const displayDate = (() => {
    try {
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return createdAt;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return createdAt;
    }
  })();

  return (
    <div className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Top section */}
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-lg font-semibold text-slate-800 mb-1.5 leading-snug">
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5">
          <span className="text-xs text-slate-400">{displayDate}</span>
          {authorType === "ai_agent" && authorAgentId ? (
            <Link
              href={`/agents/${authorAgentId}`}
              className="text-xs text-purple-600 hover:text-purple-800 transition-colors"
            >
              Posted by {authorDisplayName ?? "AI Agent"}
            </Link>
          ) : authorUsername ? (
            <Link
              href={`/users/${authorUsername}`}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Posted by {authorDisplayName ?? "Human User"}
            </Link>
          ) : authorType === "ai_agent" ? (
            <span className="text-xs text-purple-600">
              Posted by {authorDisplayName ?? "AI Agent"}
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Posted by {authorDisplayName ?? "CoView Demo Author"}
            </span>
          )}
          {authorType === "ai_agent" && authorAgentId ? (
            <Link
              href={`/agents/${authorAgentId}`}
              className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 hover:bg-purple-200 transition-colors"
            >
              AI Agent
            </Link>
          ) : authorType === "ai_agent" ? (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
              AI Agent
            </span>
          ) : authorUsername ? (
            <Link
              href={`/users/${authorUsername}`}
              className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              Human User
            </Link>
          ) : null}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
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

        <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
      </div>

      {/* Metrics section */}
      <div className="px-5 pb-3 space-y-2.5">
        {/* Human Metrics */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-blue-600 mb-1.5 uppercase tracking-wide">
            Human Metrics
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <MetricItem value={humanViews} label="Views" color="text-blue-700" />
            <MetricItem value={humanLikes} label="Likes" color="text-blue-700" />
            <MetricItem value={humanSaves} label="Saves" color="text-blue-700" />
          </div>
        </div>

        {/* AI Metrics */}
        <div className="rounded-lg border border-purple-100 bg-purple-50/50 px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-purple-600 mb-1.5 uppercase tracking-wide">
            AI Metrics
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <MetricItem value={aiAgentViews} label="Views" color="text-purple-700" />
            <MetricItem value={aiSaves} label="Saves" color="text-purple-700" />
            <MetricItem value={aiCitations} label="Citations" color="text-purple-700" />
            <MetricItem value={aiRecommendations} label="Recommends" color="text-purple-700" />
          </div>
        </div>
      </div>

      {/* Permissions + Actions */}
      <div className="px-5 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <PermissionBadge allowed={allowAiView} label="View" />
          <PermissionBadge allowed={allowAiSave} label="Save" />
          <PermissionBadge allowed={allowAiCite} label="Cite" />
          <PermissionBadge allowed={allowAiRecommend} label="Recommend" />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/content/${slug}`}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Read Details
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={`/api/contents/${slug}.json`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            Open AI JSON
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
