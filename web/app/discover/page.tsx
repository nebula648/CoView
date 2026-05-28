import { getAllContents } from "@/lib/repository";
import { ContentCard } from "@/components/content-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const contents = await getAllContents();

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Discover Content / 发现内容
        </h1>
        <p className="text-lg text-slate-500 mb-1">
          Explore content that can be read by humans and AI agents.
        </p>
        <p className="text-sm text-slate-400">
          每条内容同时展示 Human Metrics 与 AI Metrics，区分人类注意力和 AI 注意力。
        </p>
      </section>

      {/* Content grid */}
      {contents.length === 0 ? (
        <div className="rounded-2xl border bg-white px-8 py-14 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-6H9m4.5 3H9m10.5 9H4.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 014.5 3.75h5.879a2.25 2.25 0 011.59.659l2.122 2.121c.422.422.659.994.659 1.591V19.5A2.25 2.25 0 0112.75 21.75z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">
            No content yet
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Upload the first content to start Human-AI co-browsing.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Upload Content
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {contents.map((content: any) => {
            const m = content.metrics ?? {};
            return (
              <ContentCard
                key={content.id}
                id={content.id}
                slug={content.slug ?? content.id}
                title={content.title}
                body={content.body}
                tags={content.tags ?? []}
                createdAt={content.created_at}
                authorDisplayName={content.author_display_name ?? "CoView Demo Author"}
                authorType={content.author_type ?? "human"}
                aiSummary={content.ai_summary ?? null}
                aiTags={content.ai_tags ?? []}
                humanViews={m.human_views ?? 0}
                humanLikes={m.human_likes ?? 0}
                humanSaves={m.human_saves ?? 0}
                aiAgentViews={m.ai_views ?? 0}
                aiSaves={m.ai_saves ?? 0}
                aiCitations={m.ai_citations ?? 0}
                aiRecommendations={content.ai_recommendations ?? m.ai_recommendations ?? 0}
                allowAiView={content.allow_ai_view ?? true}
                allowAiSave={content.allow_ai_save ?? true}
                allowAiCite={content.allow_ai_cite ?? true}
                allowAiRecommend={content.allow_ai_recommend ?? true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
