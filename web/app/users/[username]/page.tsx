import {
  getPublicProfileByUsername,
  getContentsByProfileId,
  getCommentsByProfileId,
} from "@/lib/repository";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ContentCard } from "@/components/content-card";

export const dynamic = "force-dynamic";

interface Params {
  username: string;
}

function formatDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return raw;
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) notFound();

  const [contents, comments] = await Promise.all([
    getContentsByProfileId(profile.id),
    getCommentsByProfileId(profile.id),
  ]);

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6"
      >
        <span aria-hidden="true">&larr;</span> Back to Discover / 返回发现
      </Link>

      {/* Profile Header */}
      <section className="mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-slate-500">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {profile.display_name}
            </h1>
            <p className="text-sm text-slate-500">@{profile.username}</p>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 rounded-lg border bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">{profile.bio}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
          <span>Joined {formatDate(profile.created_at)}</span>
          <span>
            {contents.length} post{contents.length !== 1 ? "s" : ""}
          </span>
          <span>
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Human User
          </span>
        </div>
      </section>

      {/* Posts section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Posts by {profile.display_name} / 发布的内容
        </h2>
        {contents.length === 0 ? (
          <div className="rounded-xl border bg-white px-5 py-8 text-center">
            <p className="text-sm text-slate-400">
              No content published yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {contents.map((content: any) => {
              const m = content.metrics ?? {};
              return (
                <ContentCard
                  key={content.id}
                  id={content.id}
                  slug={content.slug ?? content.id}
                  title={content.title}
                  body={content.body}
                  tags={content.tags ?? []}
                  createdAt={content.created_at}
                  authorDisplayName={content.author_display_name}
                  authorType={content.author_type ?? "human"}
                  authorAgentId={content.author_agent_id ?? null}
                  authorUsername={profile.username}
                  aiSummary={content.ai_summary ?? null}
                  aiTags={content.ai_tags ?? []}
                  humanViews={m.human_views ?? 0}
                  humanLikes={m.human_likes ?? 0}
                  humanSaves={m.human_saves ?? 0}
                  aiAgentViews={m.ai_views ?? 0}
                  aiSaves={m.ai_saves ?? 0}
                  aiCitations={m.ai_citations ?? 0}
                  aiRecommendations={content.ai_recommendations ?? m.ai_recommendations ?? 0}
                  allowAiView={content.allow_ai_view ?? true}
                  allowAiSave={content.allow_ai_save ?? true}
                  allowAiCite={content.allow_ai_cite ?? true}
                  allowAiRecommend={content.allow_ai_recommend ?? true}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Comments section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Recent Comments by {profile.display_name} / 最近评论
        </h2>
        {comments.length === 0 ? (
          <div className="rounded-xl border bg-white px-5 py-6 text-sm text-slate-400">
            No comments yet.
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment: any) => (
              <article
                key={comment.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/content/${comment.content_id}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View content / 查看内容
                  </Link>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Human User
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {comment.body}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
