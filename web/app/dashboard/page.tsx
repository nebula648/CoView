import Link from "next/link";
import { getAllContents, getEventAnalytics, getStats } from "@/lib/repository";

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

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  tone?: "slate" | "blue" | "purple" | "amber" | "zinc";
}) {
  const color = {
    slate: "text-slate-800",
    blue: "text-blue-600",
    purple: "text-purple-600",
    amber: "text-amber-600",
    zinc: "text-zinc-600",
  }[tone];

  return (
    <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}

function RankingList({
  title,
  items,
  metricLabel,
  getValue,
}: {
  title: string;
  items: any[];
  metricLabel: string;
  getValue: (content: any) => number;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">No content yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((content, index) => (
            <div
              key={content.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-700">
                  {index + 1}. {content.title}
                </div>
                <div className="text-[11px] text-slate-400">
                  {metricLabel}: {getValue(content)}
                </div>
              </div>
              <Link
                href={`/content/${content.id}`}
                className="shrink-0 rounded-md bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-slate-700"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EventBadge({ actorType }: { actorType: string }) {
  const styles: Record<string, string> = {
    human: "bg-blue-100 text-blue-700",
    ai_agent: "bg-purple-100 text-purple-700",
    search_crawler: "bg-amber-100 text-amber-700",
    unknown_bot: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        styles[actorType] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {actorType}
    </span>
  );
}

export default async function DashboardPage() {
  const contents = await getAllContents();
  const stats = await getStats();
  const eventAnalytics = await getEventAnalytics();

  const totalHumanViews = stats.totalHumanViews;
  const totalAiViews = stats.totalAiAgentViews;
  const totalSearchCrawlerViews = stats.totalSearchCrawlerViews ?? 0;
  const totalUnknownBotViews = stats.totalUnknownBotViews ?? 0;
  const totalAiSaves = stats.totalAiSaves;
  const totalAiCitations = stats.totalAiCitations;
  const attentionRatio =
    totalAiViews === 0
      ? totalHumanViews > 0
        ? `${totalHumanViews}:0`
        : "0:0"
      : `${(totalHumanViews / totalAiViews).toFixed(1)}:1`;

  const sortedByHuman = [...contents]
    .sort((a, b) => (b.metrics?.human_views ?? 0) - (a.metrics?.human_views ?? 0))
    .slice(0, 5);
  const sortedByAi = [...contents]
    .sort((a, b) => (b.metrics?.ai_views ?? 0) - (a.metrics?.ai_views ?? 0))
    .slice(0, 5);
  const sortedByCitations = [...contents]
    .sort((a, b) => (b.metrics?.ai_citations ?? 0) - (a.metrics?.ai_citations ?? 0))
    .slice(0, 5);

  const avgHumanViews = contents.length ? totalHumanViews / contents.length : 0;
  const avgAiViews = contents.length ? totalAiViews / contents.length : 0;

  const groups = {
    "High Engagement / 高活跃": [] as any[],
    "Human Favorites / 人类热门": [] as any[],
    "AI Valued / AI 价值": [] as any[],
    "Low Activity / 低活跃": [] as any[],
  };

  for (const content of contents) {
    const humanViews = content.metrics?.human_views ?? 0;
    const aiViews = content.metrics?.ai_views ?? 0;
    if (humanViews >= avgHumanViews && aiViews >= avgAiViews) {
      groups["High Engagement / 高活跃"].push(content);
    } else if (humanViews >= avgHumanViews) {
      groups["Human Favorites / 人类热门"].push(content);
    } else if (aiViews >= avgAiViews) {
      groups["AI Valued / AI 价值"].push(content);
    } else {
      groups["Low Activity / 低活跃"].push(content);
    }
  }

  const permissionCounts = {
    allowView: contents.filter((c: any) => c.allow_ai_view ?? true).length,
    allowCite: contents.filter((c: any) => c.allow_ai_cite ?? true).length,
    forbidCite: contents.filter((c: any) => !(c.allow_ai_cite ?? true)).length,
    forbidRec: contents.filter((c: any) => !(c.allow_ai_recommend ?? true)).length,
    allowComment: contents.filter((c: any) => c.allow_ai_comment ?? false).length,
  };

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Dashboard / 数据看板</h1>
      <p className="mb-6 text-sm text-slate-500">
        CoView tracks human attention, AI agent access, crawler traffic, and
        unknown bot behavior separately.
      </p>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Traffic Overview / 流量概览
          </h2>
          <span className="text-xs text-slate-400">
            Human vs AI attention ratio: {attentionRatio}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Human Views" value={totalHumanViews} tone="blue" />
          <MetricCard label="AI Agent Views" value={totalAiViews} tone="purple" />
          <MetricCard
            label="Search Crawler Views"
            value={totalSearchCrawlerViews}
            tone="amber"
          />
          <MetricCard
            label="Unknown Bot Views"
            value={totalUnknownBotViews}
            tone="zinc"
          />
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Contents" value={contents.length} />
        <MetricCard label="Total AI Saves" value={totalAiSaves} tone="purple" />
        <MetricCard
          label="Total AI Citations"
          value={totalAiCitations}
          tone="purple"
        />
        <MetricCard label="Total Events" value={stats.totalEvents} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Event Type Distribution / 事件类型分布
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {EVENT_TYPES.map((eventType) => (
            <div key={eventType} className="rounded-lg border bg-white p-3">
              <div className="text-lg font-bold text-slate-800">
                {eventAnalytics.eventTypeCounts[eventType] ?? 0}
              </div>
              <div className="mt-0.5 break-words text-[11px] text-slate-400">
                {eventType}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Content Leaderboards / 内容排行榜
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RankingList
            title="Top Human Attention"
            items={sortedByHuman}
            metricLabel="Human Views"
            getValue={(content) => content.metrics?.human_views ?? 0}
          />
          <RankingList
            title="Top AI Agent Attention"
            items={sortedByAi}
            metricLabel="AI Agent Views"
            getValue={(content) => content.metrics?.ai_views ?? 0}
          />
          <RankingList
            title="Top AI Citations"
            items={sortedByCitations}
            metricLabel="AI Citations"
            getValue={(content) => content.metrics?.ai_citations ?? 0}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Recent Events Summary / 最近事件摘要
        </h2>
        <div className="rounded-xl border bg-white shadow-sm">
          {eventAnalytics.recentEvents.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">
              No events recorded yet.
            </p>
          ) : (
            <div className="divide-y">
              {eventAnalytics.recentEvents.map((event) => (
                <div
                  key={event.event_id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <EventBadge actorType={event.actor_type} />
                      <span className="text-xs font-semibold text-slate-700">
                        {event.event_type}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-400">
                      {event.content_title ?? event.content_id ?? "No content"}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {event.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Content Categories / 内容分类
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Avg Human Views: {avgHumanViews.toFixed(1)} · Avg AI Views:{" "}
          {avgAiViews.toFixed(1)}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(groups).map(([name, items]) => (
            <div key={name} className="rounded-xl border bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                {name}
              </h3>
              {items.length === 0 ? (
                <p className="text-xs text-slate-400">No content yet.</p>
              ) : (
                items.map((content: any) => (
                  <div key={content.id} className="mb-1 text-xs text-slate-600">
                    {content.title}｜Human {content.metrics?.human_views ?? 0}
                    ｜AI {content.metrics?.ai_views ?? 0}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          AI Permission Overview / AI 权限概览
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricCard label="Allow AI View" value={permissionCounts.allowView} />
          <MetricCard label="Allow AI Cite" value={permissionCounts.allowCite} />
          <MetricCard label="Forbid AI Cite" value={permissionCounts.forbidCite} />
          <MetricCard label="Forbid AI Rec" value={permissionCounts.forbidRec} />
          <MetricCard label="Allow AI Comment" value={permissionCounts.allowComment} />
        </div>
      </section>
    </div>
  );
}
