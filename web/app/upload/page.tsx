"use client";

import { useState } from "react";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [allowAiView, setAllowAiView] = useState(true);
  const [allowAiSave, setAllowAiSave] = useState(true);
  const [allowAiCite, setAllowAiCite] = useState(true);
  const [allowAiRecommend, setAllowAiRecommend] = useState(true);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setStatus({ type: "error", msg: "标题和正文不能为空。" });
      return;
    }

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_content",
        title: title.trim(),
        body: body.trim(),
        tags,
        allowAiView,
        allowAiSave,
        allowAiCite,
        allowAiRecommend,
      }),
    });

    if (res.ok) {
      setStatus({ type: "success", msg: "发布成功！" });
      setTitle("");
      setBody("");
      setTagsText("");
    } else {
      setStatus({ type: "error", msg: "发布失败，请重试。" });
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">上传</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            placeholder="输入标题"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">正文</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            placeholder="输入正文内容"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            标签（英文逗号分隔）
          </label>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            placeholder="AI, 内容平台, 共创"
          />
        </div>

        <fieldset className="border rounded p-4">
          <legend className="text-sm font-medium px-1">AI 使用权限</legend>
          <div className="grid grid-cols-4 gap-3">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={allowAiView}
                onChange={(e) => setAllowAiView(e.target.checked)}
              />
              允许 AI 浏览
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={allowAiSave}
                onChange={(e) => setAllowAiSave(e.target.checked)}
              />
              允许 AI 收藏
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={allowAiCite}
                onChange={(e) => setAllowAiCite(e.target.checked)}
              />
              允许 AI 引用
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={allowAiRecommend}
                onChange={(e) => setAllowAiRecommend(e.target.checked)}
              />
              允许 AI 推荐
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded text-sm font-medium hover:opacity-80 w-fit"
        >
          发布
        </button>

        {status && (
          <div
            className={`text-sm p-3 rounded ${
              status.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {status.msg}
          </div>
        )}
      </form>
    </div>
  );
}
