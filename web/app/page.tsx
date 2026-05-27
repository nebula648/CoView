import { getStats } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="max-w-4xl">
      {/* ---------------------------------------------------------------- */}
      {/*  Hero                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-8 py-14 text-white">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            CoView 共览
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            让内容同时被人类与 AI 看见
          </p>
          <p className="text-sm text-slate-400 max-w-lg mb-8">
            A Human-AI co-browsing content platform that separates human
            attention from AI attention.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/discover"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Explore Content
              <span aria-hidden="true">→</span>
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-white hover:text-white transition-colors"
            >
              View Dashboard
              <span aria-hidden="true">→</span>
            </a>
            <a
              href="/about"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-500 px-5 py-2.5 text-sm font-medium text-slate-300 hover:border-white hover:text-white transition-colors"
            >
              About CoView
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* quick stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white px-5 py-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-800">
              {stats.totalContents}
            </div>
            <div className="text-xs text-slate-500">Contents</div>
          </div>
          <div className="rounded-xl border bg-white px-5 py-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalHumanViews}
            </div>
            <div className="text-xs text-slate-500">Human Views</div>
          </div>
          <div className="rounded-xl border bg-white px-5 py-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalAiAgentViews}
            </div>
            <div className="text-xs text-slate-500">AI Views</div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  Core Concepts                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Dual-Track Metrics
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          同一条内容，两条独立的数据轨道。人类和 AI 的阅读行为被分别记录。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-3 text-blue-700 font-bold text-sm">
              H
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Human Views</h3>
            <p className="text-sm text-slate-500">
              人类用户在浏览器中阅读内容。基于 session 去重，真实反映人类注意力。
            </p>
            <div className="mt-3 text-2xl font-bold text-blue-600">
              {stats.totalHumanViews}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center mb-3 text-purple-700 font-bold text-sm">
              A
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">AI Views</h3>
            <p className="text-sm text-slate-500">
              AI Agent 和 AI Crawler 通过 JSON 端点读取内容。基于 UA + IP 去重。
            </p>
            <div className="mt-3 text-2xl font-bold text-purple-600">
              {stats.totalAiAgentViews}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center mb-3 text-emerald-700 font-bold text-sm">
              J
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">
              AI-Readable Content
            </h3>
            <p className="text-sm text-slate-500">
              每条内容自动生成结构化 JSON，通过 llms.txt、sitemap.xml
              等标准入口被 AI 发现和索引。
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center mb-3 text-amber-700 font-bold text-sm">
              P
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">
              Permission-Aware Access
            </h3>
            <p className="text-sm text-slate-500">
              内容创作者可以逐条设置是否允许 AI
              浏览、保存、引用和推荐。被拒绝的访问会被记录。
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  Why CoView                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Why CoView
        </h2>
        <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-3">
          <p>
            未来的内容不会只被人类消费。AI Agent、AI
            搜索引擎和自动化系统正在成为内容的新型读者。
          </p>
          <p>
            传统内容平台只统计人类浏览数据，而大量 AI
            流量是不可见的。CoView
            尝试将「AI
            阅读」作为一个独立维度进行公开计量——让人类看到内容在 AI
            世界中的传播，也让 AI 系统能够负责任地发现和引用内容。
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-slate-50 p-4 text-center">
            <div className="text-xl font-bold text-slate-700">
              {stats.allowAiViewCount}
            </div>
            <div className="text-xs text-slate-500">允许 AI 浏览</div>
          </div>
          <div className="rounded-lg border bg-slate-50 p-4 text-center">
            <div className="text-xl font-bold text-slate-700">
              {stats.totalAiSaves}
            </div>
            <div className="text-xs text-slate-500">AI Saves</div>
          </div>
          <div className="rounded-lg border bg-slate-50 p-4 text-center">
            <div className="text-xl font-bold text-slate-700">
              {stats.totalAiCitations}
            </div>
            <div className="text-xs text-slate-500">AI Citations</div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  How It Works                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          How It Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { step: "01", title: "Upload", desc: "发布图文内容并设置 AI 权限" },
            { step: "02", title: "Human Reads", desc: "人类用户浏览 HTML 页面" },
            { step: "03", title: "AI Reads", desc: "AI Agent 访问结构化 JSON" },
            { step: "04", title: "Record", desc: "事件写入 Supabase 并去重" },
            { step: "05", title: "Dashboard", desc: "Human / AI 双轨数据看板" },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border bg-white p-4 shadow-sm text-center"
            >
              <div className="text-xs font-bold text-slate-400 mb-1">
                {item.step}
              </div>
              <div className="font-semibold text-sm text-slate-800 mb-1">
                {item.title}
              </div>
              <div className="text-xs text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  AI Entry Points                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          AI-Readable Entry Points
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          CoView 为 AI Agent 和 AI Crawler 提供标准化的内容发现入口。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              path: "/llms.txt",
              desc: "AI 平台使用说明与可用端点列表",
            },
            {
              path: "/robots.txt",
              desc: "按 AI Agent 分类的抓取规则",
            },
            {
              path: "/sitemap.xml",
              desc: "包含人类页面和 AI JSON 链接",
            },
            {
              path: "/api/ai-index.json",
              desc: "全站 AI 可读内容索引",
            },
            {
              path: "/api/contents/{slug}.json",
              desc: "单条内容的 AI 结构化 JSON",
            },
          ].map(({ path, desc }) => (
            <div
              key={path}
              className="rounded-lg border bg-slate-50 px-4 py-3"
            >
              <code className="text-sm font-medium text-slate-800">
                {path}
              </code>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  Current Capabilities                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Current Demo
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            "Content Publishing",
            "Human Metrics",
            "AI Metrics",
            "Supabase Events",
            "AI-Readable JSON",
            "Dashboard",
            "Vercel Deployed",
            "UA Classification",
          ].map((label) => (
            <div
              key={label}
              className="rounded-lg border bg-white px-3 py-2.5 text-center text-xs font-medium text-slate-600 shadow-sm"
            >
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  CTA                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="rounded-2xl bg-slate-50 border px-8 py-10 text-center mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Ready to explore?
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
          Browse content, upload your own, or check the dual-track dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/discover"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Discover
          </a>
          <a
            href="/upload"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-white transition-colors"
          >
            Upload
          </a>
          <a
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-white transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/about"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-white transition-colors"
          >
            About
          </a>
        </div>
      </section>
    </div>
  );
}
