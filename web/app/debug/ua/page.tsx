"use client";

import { useState } from "react";

const PRESETS = [
  { label: "GPTBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot" },
  { label: "ChatGPT-User", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bots" },
  { label: "ClaudeBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0; +https://anthropic.com/claudebot" },
  { label: "PerplexityBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai" },
  { label: "Googlebot", ua: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  { label: "Bingbot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" },
  { label: "AhrefsBot", ua: "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)" },
  { label: "Mozilla/5.0", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
];

export default function DebugUAPage() {
  const [ua, setUa] = useState("");
  const [result, setResult] = useState<{
    actor_type: string;
    user_agent: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function classify(uaString: string) {
    setLoading(true);
    setUa(uaString);
    try {
      const res = await fetch("/api/events?" + new URLSearchParams({ test_ua: uaString }));
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ actor_type: "error", user_agent: null });
    }
    setLoading(false);
  }

  const badgeColor: Record<string, string> = {
    human: "bg-green-100 text-green-800 border-green-300",
    ai_agent: "bg-purple-100 text-purple-800 border-purple-300",
    search_crawler: "bg-blue-100 text-blue-800 border-blue-300",
    unknown_bot: "bg-yellow-100 text-yellow-800 border-yellow-300",
    error: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">UA 分类测试</h1>
      <p className="text-sm text-gray-500 mb-6">
        测试 classifyUA() 对 User-Agent 字符串的四级分类逻辑。
      </p>

      <div className="flex gap-2 flex-wrap mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => classify(p.ua)}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={ua}
          onChange={(e) => setUa(e.target.value)}
          placeholder="输入 User-Agent 字符串"
          className="flex-1 border rounded px-3 py-2 text-sm bg-white dark:bg-neutral-900"
        />
        <button
          onClick={() => classify(ua)}
          disabled={loading || !ua.trim()}
          className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded text-sm font-medium hover:opacity-80 disabled:opacity-40"
        >
          {loading ? "..." : "Classify"}
        </button>
      </div>

      {result && (
        <div className="border rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-500">分类结果</span>
              <div className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-semibold border ${badgeColor[result.actor_type] ?? badgeColor.error}`}
                >
                  {result.actor_type}
                </span>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">User-Agent (截取)</span>
              <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 break-all">
                {result.user_agent ?? "(empty)"}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-xs font-medium text-gray-500 mb-2">分类对照表</h3>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {Object.entries({
                ai_agent: "GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Gemini...",
                search_crawler: "Googlebot, Bingbot, Baiduspider, YandexBot...",
                unknown_bot: "AhrefsBot, SemrushBot, 通用 /bot/ 模式...",
                human: "浏览器 UA 或空 UA",
              }).map(([key, desc]) => (
                <div key={key} className={`border rounded p-2 ${key === result.actor_type ? "ring-2 ring-black dark:ring-white" : ""}`}>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${badgeColor[key]}`}>
                    {key}
                  </span>
                  <p className="mt-1 text-gray-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
