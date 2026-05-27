import Link from "next/link";

interface ContentCardProps {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  humanViews: number;
  aiAgentViews: number;
  aiValueScore: number;
  citationSuitability: string;
  allowAiView: boolean;
}

export function ContentCard({
  slug,
  title,
  body,
  tags,
  createdAt,
  humanViews,
  aiAgentViews,
  aiValueScore,
  citationSuitability,
}: ContentCardProps) {
  const preview =
    body.length > 160 ? body.slice(0, 160) + "..." : body;

  return (
    <div className="border rounded-lg p-5 bg-white dark:bg-neutral-900 shadow-sm">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-2">
        发布于 {createdAt} · 标签：{tags.length > 0 ? tags.join(", ") : "无"}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{preview}</p>

      <div className="flex items-center gap-4 text-sm mb-3">
        <span title="Human Views">Human {humanViews}</span>
        <span title="AI Agent Views">AI {aiAgentViews}</span>
        <span title="AI Value Score">Score {aiValueScore}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-xs ${
            citationSuitability === "High"
              ? "bg-green-100 text-green-800"
              : citationSuitability === "Medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {citationSuitability}
        </span>
      </div>

      <Link
        href={`/content/${slug}`}
        className="text-sm text-blue-600 hover:underline"
      >
        进入详情 →
      </Link>
    </div>
  );
}
