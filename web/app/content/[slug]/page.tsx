import { getContentBySlug, getEventsByContent } from "@/lib/repository";
import { notFound } from "next/navigation";
import { HumanViewTracker } from "./human-view-tracker";

export const dynamic = "force-dynamic";

interface Params {
  slug: string;
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content) notFound();

  const events = await getEventsByContent(content.id);

  return (
    <div>
      <HumanViewTracker contentId={content.id} />

      <a href="/discover" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← 返回发现
      </a>

      <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
      <p className="text-xs text-gray-500 mb-4">
        发布于 {content.created_at} · 标签：
        {(content.tags ?? []).length > 0 ? content.tags.join(", ") : "无"}
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-8 whitespace-pre-wrap">
        {content.body}
      </p>

      {/* Human Metrics */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">双轨数据</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Human Metrics</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="font-semibold">{content.metrics?.human_views ?? 0}</span>{" "}
                Views
              </div>
              <div>
                <span className="font-semibold">{content.metrics?.human_likes ?? 0}</span>{" "}
                Likes
              </div>
              <div>
                <span className="font-semibold">{content.metrics?.human_saves ?? 0}</span>{" "}
                Saves
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">AI Metrics</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="font-semibold">{content.metrics?.ai_views ?? 0}</span>{" "}
                Views
              </div>
              <div>
                <span className="font-semibold">{content.metrics?.ai_saves ?? 0}</span>{" "}
                Saves
              </div>
              <div>
                <span className="font-semibold">{content.metrics?.ai_citations ?? 0}</span>{" "}
                Cites
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Permissions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">AI Permissions</h2>
        <div className="grid grid-cols-4 gap-2 text-sm">
          {[
            ["AI View", content.allow_ai_view ?? true],
            ["AI Save", content.allow_ai_save ?? true],
            ["AI Cite", content.allow_ai_cite ?? true],
            ["AI Recommend", content.allow_ai_recommend ?? true],
          ].map(([label, allowed]) => (
            <div key={label} className="border rounded p-2 text-center">
              <div className="font-medium">{label}</div>
              <div className={allowed ? "text-green-600" : "text-red-500"}>
                {allowed ? "Allowed" : "Blocked"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Analysis */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">AI Analysis</h2>
        <p className="text-sm mb-2">
          <strong>AI Summary:</strong>{" "}
          {content.ai_summary || "尚未生成 AI Summary。"}
        </p>
        {content.ai_tags?.length > 0 && (
          <p className="text-sm mb-2">
            <strong>AI Tags:</strong> {content.ai_tags.join(", ")}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            Citation Suitability:{" "}
            <span className="font-semibold">
              {content.ai_citation_suitability ?? "Low"}
            </span>
          </div>
          <div>
            AI Value Score:{" "}
            <span className="font-semibold">{content.ai_value_score ?? 0}</span>
          </div>
        </div>
        {content.ai_reason && (
          <p className="text-sm text-gray-500 mt-2">AI Reason: {content.ai_reason}</p>
        )}
      </section>

      {/* Recent Events */}
      <section>
        <h2 className="text-lg font-semibold mb-3">最近事件</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">暂无事件。</p>
        ) : (
          <div className="text-sm flex flex-col gap-1">
            {events
              .sort(
                (a: any, b: any) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
              )
              .slice(0, 10)
              .map((e: any) => (
                <div key={e.event_id} className="flex gap-3 text-gray-500">
                  <span>{e.timestamp}</span>
                  <span className="font-medium">{e.actor_type}</span>
                  <span>{e.event_type}</span>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
