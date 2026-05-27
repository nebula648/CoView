import { getAllContents } from "@/lib/repository";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return raw;
  }
}

export default async function AdminContentsPage() {
  const contents = await getAllContents();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manage Contents</h1>
        <span className="text-xs text-slate-400">{contents.length} total</span>
      </div>

      {contents.length === 0 ? (
        <div className="rounded-xl border bg-white px-5 py-12 text-center">
          <p className="text-sm text-slate-400">No content yet.</p>
          <Link
            href="/upload"
            className="inline-block mt-3 text-sm text-blue-500 hover:underline"
          >
            Upload content →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">
                    Created
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Human
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    AI
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">
                    Cite
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">
                    Permissions
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Links
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contents.map((c: any) => {
                  const m = c.metrics ?? {};
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-800 max-w-[220px] truncate">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {c.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap hidden sm:table-cell">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-semibold text-center">
                        {m.human_views ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-purple-600 font-semibold text-center">
                        {m.ai_views ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-semibold text-center hidden md:table-cell">
                        {m.ai_citations ?? 0}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                              (c.allow_ai_view ?? true)
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {(c.allow_ai_view ?? true) ? "View" : "NoView"}
                          </span>
                          <span
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                              (c.allow_ai_cite ?? true)
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {(c.allow_ai_cite ?? true) ? "Cite" : "NoCite"}
                          </span>
                          <span
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                              (c.allow_ai_recommend ?? true)
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {(c.allow_ai_recommend ?? true) ? "Rec" : "NoRec"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/content/${c.id}`}
                            className="inline-block rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap"
                          >
                            Page
                          </Link>
                          <Link
                            href={`/api/contents/${c.id}.json`}
                            className="inline-block rounded-md bg-purple-50 px-2 py-1 text-[10px] font-medium text-purple-600 hover:bg-purple-100 transition-colors whitespace-nowrap"
                          >
                            JSON
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
