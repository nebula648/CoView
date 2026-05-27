import { getAllContents, getStats } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const contents = await getAllContents();
  const stats = await getStats();

  const totalHumanViews = contents.reduce(
    (sum: number, c: any) => sum + (c.metrics?.human_views ?? 0),
    0,
  );
  const totalAiViews = contents.reduce(
    (sum: number, c: any) => sum + (c.metrics?.ai_views ?? 0),
    0,
  );
  const totalAiSaves = contents.reduce(
    (sum: number, c: any) => sum + (c.metrics?.ai_saves ?? 0),
    0,
  );
  const totalAiCitations = contents.reduce(
    (sum: number, c: any) => sum + (c.metrics?.ai_citations ?? 0),
    0,
  );

  const avgHumanViews = contents.length
    ? totalHumanViews / contents.length
    : 0;
  const avgAiViews = contents.length ? totalAiViews / contents.length : 0;

  const groups = {
    "双高内容": [] as any[],
    "人类热门内容": [] as any[],
    "AI 价值内容": [] as any[],
    "低活跃内容": [] as any[],
  };

  for (const c of contents) {
    const hv = c.metrics?.human_views ?? 0;
    const av = c.metrics?.ai_views ?? 0;
    if (hv >= avgHumanViews && av >= avgAiViews) groups["双高内容"].push(c);
    else if (hv >= avgHumanViews) groups["人类热门内容"].push(c);
    else if (av >= avgAiViews) groups["AI 价值内容"].push(c);
    else groups["低活跃内容"].push(c);
  }

  const permissionCounts = {
    allowView: contents.filter((c: any) => c.allow_ai_view ?? true).length,
    allowCite: contents.filter((c: any) => c.allow_ai_cite ?? true).length,
    forbidCite: contents.filter((c: any) => !(c.allow_ai_cite ?? true)).length,
    forbidRec: contents.filter((c: any) => !(c.allow_ai_recommend ?? true)).length,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">数据看板</h1>
      <p className="text-gray-500 text-sm mb-6">
        CoView 双轨数据统计总览
      </p>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{contents.length}</div>
          <div className="text-xs text-gray-500">Total Contents</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{totalHumanViews}</div>
          <div className="text-xs text-gray-500">Total Human Views</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{totalAiViews}</div>
          <div className="text-xs text-gray-500">Total AI Views</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{totalAiSaves}</div>
          <div className="text-xs text-gray-500">Total AI Saves</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{totalAiCitations}</div>
          <div className="text-xs text-gray-500">Total AI Citations</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.totalEvents}</div>
          <div className="text-xs text-gray-500">Total Events</div>
        </div>
      </div>

      {/* Content type groups */}
      <h2 className="text-lg font-semibold mb-3">
        Human vs AI 内容类型判断
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        平均 Human Views: {avgHumanViews.toFixed(1)}；平均 AI Views:{" "}
        {avgAiViews.toFixed(1)}
      </p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(groups).map(([name, items]) => (
          <div key={name} className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">{name}</h3>
            {items.length === 0 ? (
              <p className="text-xs text-gray-400">暂无内容。</p>
            ) : (
              items.map((c: any) => (
                <div key={c.id} className="text-xs text-gray-600 mb-1">
                  {c.title}｜Human {c.metrics?.human_views ?? 0}｜AI{" "}
                  {c.metrics?.ai_views ?? 0}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {/* AI Permission Overview */}
      <h2 className="text-lg font-semibold mb-3">AI Permission Overview</h2>
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-xl font-bold">{permissionCounts.allowView}</div>
          <div className="text-xs text-gray-500">允许 AI 浏览</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-xl font-bold">{permissionCounts.allowCite}</div>
          <div className="text-xs text-gray-500">允许 AI 引用</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-xl font-bold">{permissionCounts.forbidCite}</div>
          <div className="text-xs text-gray-500">禁止 AI 引用</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-xl font-bold">{permissionCounts.forbidRec}</div>
          <div className="text-xs text-gray-500">禁止 AI 推荐</div>
        </div>
      </div>
    </div>
  );
}
