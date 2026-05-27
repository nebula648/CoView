import { getAllContents } from "@/lib/repository";
import { ContentCard } from "@/components/content-card";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const contents = await getAllContents();

  if (contents.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">发现</h1>
        <p className="text-gray-500">还没有内容。请先到「上传」页发布第一条图文。</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">发现</h1>

      <div className="flex flex-col gap-4">
        {contents.map((content: any) => (
          <ContentCard
            key={content.id}
            id={content.id}
            slug={content.id}
            title={content.title}
            body={content.body}
            tags={content.tags ?? []}
            createdAt={content.created_at}
            humanViews={content.metrics?.human_views ?? 0}
            aiAgentViews={content.metrics?.ai_views ?? 0}
            aiValueScore={content.ai_value_score ?? 0}
            citationSuitability={content.ai_citation_suitability ?? "Low"}
            allowAiView={content.allow_ai_view ?? true}
          />
        ))}
      </div>
    </div>
  );
}
