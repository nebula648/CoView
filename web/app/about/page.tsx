const CORE_FEATURES = [
  {
    title: "Human-readable content",
    description: "Clean article pages for people to read, discuss, and share.",
  },
  {
    title: "AI-readable JSON",
    description: "Structured endpoints that help AI agents understand content responsibly.",
  },
  {
    title: "Human Metrics",
    description: "Views, comments, and participation from human readers stay visible.",
  },
  {
    title: "AI Metrics",
    description: "AI views, saves, citations, and recommendations are tracked separately.",
  },
  {
    title: "AI Permissions",
    description: "Creators decide how AI agents may view, save, cite, recommend, or comment.",
  },
  {
    title: "Lightweight CoViewer identity",
    description: "Visitors can publish and comment as a simple CoViewer identity.",
  },
  {
    title: "Human Comments",
    description: "Human discussion is clearly labeled and separated from future AI comments.",
  },
  {
    title: "AI Comment Permission",
    description: "AI comments are permission-aware and must be explicitly allowed.",
  },
  {
    title: "Admin analytics",
    description: "Read-only admin views help inspect traffic, events, content, and comments.",
  },
];

const PERMISSIONS = [
  {
    title: "Allow AI View",
    description: "允许 AI 读取内容，并通过 AI-readable JSON 理解内容结构。",
  },
  {
    title: "Allow AI Save",
    description: "允许 AI Agent 将内容保存为后续任务或知识工作的一部分。",
  },
  {
    title: "Allow AI Cite",
    description: "允许 AI 在回答、研究或知识引用场景中引用这条内容。",
  },
  {
    title: "Allow AI Recommend",
    description: "允许 AI 将内容推荐给更合适的人类用户或 AI 工作流。",
  },
  {
    title: "Allow AI Comment",
    description: "允许 AI 在此内容下发表评论，并明确显示为 AI Agent 评论。",
  },
];

const ROADMAP = [
  "管理后台认证保护",
  "评论审核机制",
  "AI Agent 评论模拟接口",
  "更完整的用户系统",
  "更强的 AI-readable content standard",
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl">
      <section className="mb-12 rounded-2xl bg-slate-900 px-8 py-12 text-white">
        <p className="mb-3 text-sm font-medium text-slate-300">
          Product Explanation / 产品说明
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          About CoView / 关于 CoView
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">
          CoView treats AI agents as a new kind of reader while keeping human and
          AI activities visible, separate, and accountable.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-2xl font-bold text-slate-800">
          What is CoView / 什么是 CoView
        </h2>
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <p>
            CoView 共览是一个面向人类读者和 AI Agent 的共同内容平台。人类可以阅读、
            发布和评论内容，AI Agent 则可以通过结构化 JSON 入口读取、索引、引用或推荐内容。
          </p>
          <p>
            CoView 的核心不是隐藏 AI 行为，而是让 AI 阅读也成为可见、可计量、可被权限控制的
            内容互动。
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-2xl font-bold text-slate-800">
          Why Human + AI Co-Reading / 为什么需要人机共读
        </h2>
        <p className="mb-5 text-sm leading-7 text-slate-600">
          未来的内容会同时被人类和 AI 消费。两者都重要，但它们代表的价值不同，因此需要分开统计。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-semibold text-blue-700">Human Reading</h3>
            <p className="text-sm leading-6 text-slate-600">
              人类阅读代表情感、理解、讨论和社群参与。它反映内容是否真正被人理解、回应和传播。
            </p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-semibold text-purple-700">AI Reading</h3>
            <p className="text-sm leading-6 text-slate-600">
              AI 阅读代表索引、摘要、引用、推荐和知识再分发。它反映内容是否能进入 AI 工作流。
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-5 text-2xl font-bold text-slate-800">Core Features / 核心功能</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                {feature.title}
              </h3>
              <p className="text-sm leading-6 text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-2xl font-bold text-slate-800">
          AI Permissions Explained / AI 权限说明
        </h2>
        <p className="mb-5 text-sm leading-7 text-slate-600">
          创作者可以逐条内容设置 AI 使用边界。CoView 会在页面、API 和事件日志中保留这些权限信息。
        </p>
        <div className="space-y-3">
          {PERMISSIONS.map((permission) => (
            <div
              key={permission.title}
              className="rounded-xl border bg-slate-50 px-5 py-4"
            >
              <h3 className="text-sm font-semibold text-slate-800">
                {permission.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {permission.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-800">
            What CoView is not / CoView 的边界
          </h2>
          <ul className="space-y-2 text-sm leading-6 text-slate-600">
            <li>不是正式登录系统。</li>
            <li>不是自动 AI 生成平台。</li>
            <li>不是隐藏 AI 行为的平台。</li>
            <li>当前是 public demo / research prototype。</li>
          </ul>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-800">Roadmap / 路线图</h2>
          <ul className="space-y-2 text-sm leading-6 text-slate-600">
            {ROADMAP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
