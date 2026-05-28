import Link from "next/link";
import { getAllContents, getCommentsByContentId } from "@/lib/repository";
import { generateDemoAiComment } from "./actions";

export const dynamic = "force-dynamic";

interface SearchParams {
  type?: string;
  message?: string;
}

function PermissionBadge({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        allowed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
      }`}
    >
      {allowed ? "AI Comment Allowed" : "AI Comment Blocked"}
    </span>
  );
}

export default async function AdminAiCommentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { type, message } = await searchParams;
  const contents = (await getAllContents()).slice(0, 25);
  const rows = await Promise.all(
    contents.map(async (content: any) => ({
      content,
      commentCount: (await getCommentsByContentId(content.id)).length,
    })),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            AI Comment Demo / AI 评论模拟
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Generate clearly labeled demo AI Agent comments for contents that
            allow AI comments.
          </p>
        </div>
        <span className="text-xs text-slate-400">
          Showing latest {rows.length} contents
        </span>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-5">
        <h2 className="text-sm font-semibold text-purple-900">
          Demo-only AI comments
        </h2>
        <p className="mt-2 text-sm leading-6 text-purple-800">
          This page does not call a real AI model. It creates a fixed demo
          comment from CoView AI Agent (Demo), checks each content item&apos;s
          AI Comment permission, and records the corresponding event.
        </p>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-white px-5 py-12 text-center">
          <p className="text-sm text-slate-400">No content available yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Content
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Author
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Permission
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Comments
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Links
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(({ content, commentCount }) => (
                  <tr key={content.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="max-w-[240px] truncate text-sm font-medium text-slate-800">
                        {content.title}
                      </div>
                      <div className="mt-0.5 max-w-[240px] truncate font-mono text-[10px] text-slate-400">
                        {content.id}
                      </div>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs font-medium text-slate-600">
                      {content.author_display_name ?? "CoView Demo Author"}
                    </td>
                    <td className="px-4 py-3">
                      <PermissionBadge allowed={content.allow_ai_comment ?? false} />
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                      {commentCount}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/content/${content.id}`}
                        className="inline-block whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        View Content
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <form action={generateDemoAiComment}>
                        <input type="hidden" name="content_id" value={content.id} />
                        <button
                          type="submit"
                          className="whitespace-nowrap rounded-md bg-purple-600 px-3 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-purple-700"
                        >
                          Generate Demo AI Comment
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
