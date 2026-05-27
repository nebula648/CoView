import { getStats } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getStats();
  const totalContents = stats.totalContents;
  const totalHumanViews = stats.totalHumanViews;
  const totalAiViews = stats.totalAiAgentViews;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">CoView 共览</h1>
      <h2 className="text-lg text-gray-500 mb-6">
        人类与 AI 共同浏览的内容平台
      </h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400 max-w-2xl">
        CoView 是面向人类用户与 AI Agent
        的新一代内容平台。同一条内容可以同时拥有 Human Metrics 和 AI
        Metrics，让创作者看到内容在人类与 AI 两类读者中的传播方式。
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{totalContents}</div>
          <div className="text-sm text-gray-500">内容数</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{totalHumanViews}</div>
          <div className="text-sm text-gray-500">Human Views</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{totalAiViews}</div>
          <div className="text-sm text-gray-500">AI Views</div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm">
        从侧边栏进入「发现」浏览内容，或进入「上传」发布一条新的图文。
      </div>
    </div>
  );
}
