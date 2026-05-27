import { getDB } from "@/lib/db";
import { schema } from "@/lib/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { readContents, readEvents, writeContents, writeEvents } from "@/lib/data-source";
import { hashUA, hashIP } from "@/lib/dedup";

/* ------------------------------------------------------------------ */
/*  Content CRUD                                                        */
/* ------------------------------------------------------------------ */

export async function getAllContents(): Promise<any[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select({
          content: schema.contents,
          metrics: schema.contentMetrics,
        })
        .from(schema.contents)
        .leftJoin(
          schema.contentMetrics,
          eq(schema.contentMetrics.contentId, schema.contents.id),
        )
        .orderBy(desc(schema.contents.createdAt));

      return rows.map((row: any) => attachMetrics(mapDBContent(row.content), row.metrics));
    },
    () => readContents().map(ensureLegacyShape),
  );
}

export async function getContentBySlug(slug: string): Promise<any | null> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.contents)
        .where(eq(schema.contents.id, slug))
        .limit(1);
      if (rows.length === 0) return null;
      const content = mapDBContent(rows[0]);
      const metricsRow = await db
        .select()
        .from(schema.contentMetrics)
        .where(eq(schema.contentMetrics.contentId, slug))
        .limit(1);
      if (metricsRow.length > 0) {
        attachMetrics(content, metricsRow[0]);
      }
      return content;
    },
    () => {
      const contents = readContents();
      return contents.find((c: any) => c.id === slug) ?? null;
    },
  );
}

export async function createContent(payload: {
  title: string;
  body: string;
  tags: string[];
  allowAiView: boolean;
  allowAiSave: boolean;
  allowAiCite: boolean;
  allowAiRecommend: boolean;
}): Promise<{ id: string }> {
  const db = getDB();
  if (db) {
    try {
      const id = crypto.randomUUID();
      const slug = id;
      await db.insert(schema.contents).values({
        id,
        slug,
        title: payload.title,
        body: payload.body,
        tags: payload.tags,
        allowAiView: payload.allowAiView,
        allowAiSave: payload.allowAiSave,
        allowAiCite: payload.allowAiCite,
        allowAiRecommend: payload.allowAiRecommend,
      });
      await db.insert(schema.contentMetrics).values({ contentId: id });
      return { id };
    } catch { /* fall through to JSON fallback */ }
  }

  const contents = readContents();
  const newContent: any = {
    id: crypto.randomUUID(),
    title: payload.title,
    body: payload.body,
    tags: payload.tags,
    created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    metrics: { human_views: 0, human_likes: 0, human_saves: 0, ai_views: 0, ai_saves: 0, ai_citations: 0 },
    ai_summary: "尚未生成 AI Summary。",
    ai_tags: [],
    ai_recommended_scenarios: [],
    ai_citation_suitability: "Low",
    ai_value_score: 0,
    ai_reason: "尚未生成 AI Reason。",
    ai_recommendations: 0,
    ai_decision: {},
    allow_ai_view: payload.allowAiView,
    allow_ai_save: payload.allowAiSave,
    allow_ai_cite: payload.allowAiCite,
    allow_ai_recommend: payload.allowAiRecommend,
  };
  contents.unshift(newContent);
  writeContents(contents);
  return { id: newContent.id };
}

/* ------------------------------------------------------------------ */
/*  Metrics                                                             */
/* ------------------------------------------------------------------ */

export async function updateHumanViews(contentId: string): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      await db
        .update(schema.contentMetrics)
        .set({ humanViews: sql`${schema.contentMetrics.humanViews} + 1` })
        .where(eq(schema.contentMetrics.contentId, contentId));
      return;
    } catch { /* fall through to JSON fallback */ }
  }
  const contents = readContents();
  const c = contents.find((x: any) => x.id === contentId);
  if (c) {
    c.metrics.human_views = (c.metrics.human_views ?? 0) + 1;
    writeContents(contents);
  }
}

export async function updateAiAgentViews(contentId: string): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      await db
        .update(schema.contentMetrics)
        .set({ aiAgentViews: sql`${schema.contentMetrics.aiAgentViews} + 1` })
        .where(eq(schema.contentMetrics.contentId, contentId));
      return;
    } catch { /* fall through to JSON fallback */ }
  }
  const contents = readContents();
  const c = contents.find((x: any) => x.id === contentId);
  if (c) {
    c.metrics.ai_views = (c.metrics.ai_views ?? 0) + 1;
    writeContents(contents);
  }
}

export async function updateSearchCrawlerViews(contentId: string): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      await db
        .update(schema.contentMetrics)
        .set({ searchCrawlerViews: sql`${schema.contentMetrics.searchCrawlerViews} + 1` })
        .where(eq(schema.contentMetrics.contentId, contentId));
    } catch { /* no JSON fallback for crawler views */ }
  }
}

export async function updateUnknownBotViews(contentId: string): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      await db
        .update(schema.contentMetrics)
        .set({ unknownBotViews: sql`${schema.contentMetrics.unknownBotViews} + 1` })
        .where(eq(schema.contentMetrics.contentId, contentId));
    } catch { /* no JSON fallback for unknown bot views */ }
  }
}

/* ------------------------------------------------------------------ */
/*  Events                                                              */
/* ------------------------------------------------------------------ */

export async function createEvent(event: {
  contentId: string;
  eventType: string;
  actorType: string;
  userAgentRaw?: string | null;
  userAgentHash?: string | null;
  ipHash?: string | null;
  sessionId?: string | null;
  routeAccessed?: string | null;
  extraFields?: Record<string, unknown>;
}): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      await db.insert(schema.events).values({
        contentId: event.contentId,
        eventType: event.eventType,
        actorType: event.actorType,
        userAgentRaw: event.userAgentRaw ?? null,
        userAgentHash: event.userAgentHash ?? null,
        ipHash: event.ipHash ?? null,
        sessionId: event.sessionId ?? null,
        routeAccessed: event.routeAccessed ?? null,
        extraFields: event.extraFields ?? {},
      });
      return;
    } catch { /* fall through to JSON fallback */ }
  }

  const events = readEvents();
  events.push({
    event_id: crypto.randomUUID(),
    content_id: event.contentId,
    event_type: event.eventType,
    actor_type: event.actorType,
    session_id: event.sessionId ?? undefined,
    user_agent_raw: event.userAgentRaw ?? undefined,
    user_agent_hash: event.userAgentHash ?? undefined,
    ip_hash: event.ipHash ?? undefined,
    route_accessed: event.routeAccessed ?? undefined,
    extra_fields: event.extraFields ?? undefined,
    ...(event.extraFields ?? {}),
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
  });
  writeEvents(events);
}

export async function findDuplicateHumanView(
  sessionId: string,
  contentId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.events)
        .where(
          and(
            eq(schema.events.eventType, "human_view"),
            eq(schema.events.contentId, contentId),
            eq(schema.events.sessionId, sessionId),
            gte(schema.events.createdAt, since),
          ),
        )
        .limit(1);
      return rows.length > 0;
    },
    () => {
      const events = readEvents();
      const sinceStr = since.toISOString().replace("T", " ").substring(0, 19);
      return events.some(
        (e: any) =>
          e.event_type === "human_view" &&
          e.content_id === contentId &&
          e.session_id === sessionId &&
          e.timestamp >= sinceStr,
      );
    },
  );
}

export async function findDuplicateAiAgentView(
  uaHash: string,
  ipHash: string,
  contentId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.events)
        .where(
          and(
            eq(schema.events.eventType, "ai_agent_view"),
            eq(schema.events.contentId, contentId),
            eq(schema.events.userAgentHash, uaHash),
            eq(schema.events.ipHash, ipHash),
            gte(schema.events.createdAt, since),
          ),
        )
        .limit(1);
      return rows.length > 0;
    },
    () => {
      const events = readEvents();
      const sinceStr = since.toISOString().replace("T", " ").substring(0, 19);
      return events.some(
        (e: any) =>
          normalizeEventType(e.event_type) === "ai_agent_view" &&
          e.content_id === contentId &&
          e.user_agent_hash === uaHash &&
          e.ip_hash === ipHash &&
          e.timestamp >= sinceStr,
      );
    },
  );
}

/* ------------------------------------------------------------------ */
/*  Events (read)                                                        */
/* ------------------------------------------------------------------ */

export async function getEventsByContent(contentId: string): Promise<any[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.contentId, contentId))
        .orderBy(desc(schema.events.createdAt));
      return rows.map((e: any) => ({
        event_id: e.id,
        content_id: e.contentId,
        event_type: e.eventType,
        actor_type: e.actorType,
        session_id: e.sessionId,
        user_agent_hash: e.userAgentHash,
        ip_hash: e.ipHash,
        timestamp: e.createdAt
          ? new Date(e.createdAt).toISOString().replace("T", " ").substring(0, 19)
          : "",
      }));
    },
    () => {
      const events = readEvents();
      return events
        .filter((e: any) => e.content_id === contentId)
        .map(normalizeLegacyEvent)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  );
}

export async function getRecentEvents(limit: number = 50): Promise<any[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select({
          event: schema.events,
          contentTitle: schema.contents.title,
        })
        .from(schema.events)
        .leftJoin(schema.contents, eq(schema.events.contentId, schema.contents.id))
        .orderBy(desc(schema.events.createdAt))
        .limit(limit);
      return rows.map((row: any) => ({
        event_id: row.event.id,
        content_id: row.event.contentId,
        content_title: row.contentTitle ?? null,
        event_type: normalizeAnalyticsEventType(row.event.eventType),
        actor_type: normalizeActorType(row.event.actorType),
        session_id: row.event.sessionId,
        user_agent_hash: row.event.userAgentHash,
        ip_hash: row.event.ipHash,
        route_accessed: row.event.routeAccessed,
        timestamp: row.event.createdAt
          ? new Date(row.event.createdAt).toISOString().replace("T", " ").substring(0, 19)
          : "",
      }));
    },
    () => {
      const contents = readContents();
      const events = readEvents();
      return events
        .map(normalizeLegacyEvent)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
        .map((e: any) => {
          const c = contents.find((x: any) => x.id === e.content_id);
          return {
            ...e,
            event_type: normalizeAnalyticsEventType(e.event_type),
            actor_type: normalizeActorType(e.actor_type),
            content_title: c?.title ?? null,
          };
        });
    },
  );
}

export async function getEventAnalytics(): Promise<{
  totalEvents: number;
  actorCounts: Record<string, number>;
  eventTypeCounts: Record<string, number>;
  recentEvents: any[];
}> {
  const trackedEventTypes = [
    "human_view",
    "ai_agent_view",
    "search_crawler_view",
    "unknown_bot_view",
    "ai_agent_save",
    "ai_agent_citation",
    "ai_agent_recommendation",
    "ai_action_blocked",
  ];

  return tryDB(
    async (db) => {
      const rows = await db
        .select({
          event: schema.events,
          contentTitle: schema.contents.title,
        })
        .from(schema.events)
        .leftJoin(schema.contents, eq(schema.events.contentId, schema.contents.id))
        .orderBy(desc(schema.events.createdAt));
      return buildEventAnalytics(
        rows.map((row: any) => ({
          event_id: row.event.id,
          content_id: row.event.contentId,
          content_title: row.contentTitle ?? null,
          event_type: row.event.eventType,
          actor_type: row.event.actorType,
          session_id: row.event.sessionId,
          user_agent_hash: row.event.userAgentHash,
          ip_hash: row.event.ipHash,
          route_accessed: row.event.routeAccessed,
          timestamp: row.event.createdAt
            ? new Date(row.event.createdAt).toISOString().replace("T", " ").substring(0, 19)
            : "",
        })),
        trackedEventTypes,
      );
    },
    () => {
      const contents = readContents();
      const events = readEvents()
        .map(normalizeLegacyEvent)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((e: any) => {
          const c = contents.find((x: any) => x.id === e.content_id);
          return { ...e, content_title: c?.title ?? null };
        });
      return buildEventAnalytics(events, trackedEventTypes);
    },
  );
}

/* ------------------------------------------------------------------ */
/*  Stats                                                               */
/* ------------------------------------------------------------------ */

export async function getStats(): Promise<{
  totalContents: number;
  totalHumanViews: number;
  totalAiAgentViews: number;
  totalSearchCrawlerViews: number;
  totalUnknownBotViews: number;
  totalAiSaves: number;
  totalAiCitations: number;
  totalEvents: number;
  humanEvents: number;
  aiEvents: number;
  crawlerEvents: number;
  botEvents: number;
  allowAiViewCount: number;
  forbidAiViewCount: number;
}> {
  return tryDB(
    async (db) => {
      const contents = await db.select().from(schema.contents);
      const metrics = await db.select().from(schema.contentMetrics);
      const events = await db.select().from(schema.events);
      const totalHumanViews = metrics.reduce((s: number, m: any) => s + (m.humanViews ?? 0), 0);
      const totalAiAgentViews = metrics.reduce((s: number, m: any) => s + (m.aiAgentViews ?? 0), 0);
      const totalSearchCrawlerViews = metrics.reduce((s: number, m: any) => s + (m.searchCrawlerViews ?? 0), 0);
      const totalUnknownBotViews = metrics.reduce((s: number, m: any) => s + (m.unknownBotViews ?? 0), 0);
      const totalAiSaves = metrics.reduce((s: number, m: any) => s + (m.aiAgentSaves ?? 0), 0);
      const totalAiCitations = metrics.reduce((s: number, m: any) => s + (m.aiAgentCitations ?? 0), 0);
      return {
        totalContents: contents.length,
        totalHumanViews,
        totalAiAgentViews,
        totalSearchCrawlerViews,
        totalUnknownBotViews,
        totalAiSaves,
        totalAiCitations,
        totalEvents: events.length,
        humanEvents: events.filter((e: any) => normalizeActorType(e.actorType) === "human").length,
        aiEvents: events.filter((e: any) => normalizeActorType(e.actorType) === "ai_agent").length,
        crawlerEvents: events.filter((e: any) => normalizeActorType(e.actorType) === "search_crawler").length,
        botEvents: events.filter((e: any) => normalizeActorType(e.actorType) === "unknown_bot").length,
        allowAiViewCount: contents.filter((c: any) => c.allowAiView).length,
        forbidAiViewCount: contents.filter((c: any) => !c.allowAiView).length,
      };
    },
    () => {
      const contents = readContents();
      const events = readEvents();
      const totalHumanViews = contents.reduce((s: number, c: any) => s + (c.metrics?.human_views ?? 0), 0);
      const totalAiViews = contents.reduce((s: number, c: any) => s + (c.metrics?.ai_views ?? 0), 0);
      const totalSearchCrawlerViews = events.filter((e: any) => normalizeActorType(e.actor_type) === "search_crawler").length;
      const totalUnknownBotViews = events.filter((e: any) => normalizeActorType(e.actor_type) === "unknown_bot").length;
      const totalAiSaves = contents.reduce((s: number, c: any) => s + (c.metrics?.ai_saves ?? 0), 0);
      const totalAiCitations = contents.reduce((s: number, c: any) => s + (c.metrics?.ai_citations ?? 0), 0);
      return {
        totalContents: contents.length,
        totalHumanViews,
        totalAiAgentViews: totalAiViews,
        totalSearchCrawlerViews,
        totalUnknownBotViews,
        totalAiSaves,
        totalAiCitations,
        totalEvents: events.length,
        humanEvents: events.filter((e: any) => e.actor_type === "human").length,
        aiEvents: events.filter((e: any) => normalizeActorType(e.actor_type) === "ai_agent").length,
        crawlerEvents: events.filter((e: any) => normalizeActorType(e.actor_type) === "search_crawler").length,
        botEvents: events.filter((e: any) => normalizeActorType(e.actor_type) === "unknown_bot").length,
        allowAiViewCount: contents.filter((c: any) => c.allow_ai_view ?? true).length,
        forbidAiViewCount: contents.filter((c: any) => !(c.allow_ai_view ?? true)).length,
      };
    },
  );
}

/* ------------------------------------------------------------------ */
/*  AI Index                                                            */
/* ------------------------------------------------------------------ */

export async function getAiIndex(): Promise<any[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.contents)
        .where(eq(schema.contents.allowAiView, true))
        .orderBy(desc(schema.contents.createdAt));
      return rows.map((c: any) => ({
        contentId: c.id,
        slug: c.slug,
        title: c.title,
        aiSummary: c.aiSummary,
        aiTags: c.aiTags,
        aiValueScore: c.aiValueScore,
        citationSuitability: c.aiCitationSuitability,
        allowAiCite: c.allowAiCite,
        allowAiRecommend: c.allowAiRecommend,
        jsonUrl: `/api/contents/${c.id}.json`,
      }));
    },
    () => {
      const contents = readContents();
      return contents
        .filter((c: any) => c.allow_ai_view ?? true)
        .map((c: any) => ({
          contentId: c.id,
          slug: c.id,
          title: c.title,
          aiSummary: c.ai_summary ?? null,
          aiTags: c.ai_tags ?? [],
          aiValueScore: c.ai_value_score ?? 0,
          citationSuitability: c.ai_citation_suitability ?? "Low",
          allowAiCite: c.allow_ai_cite ?? true,
          allowAiRecommend: c.allow_ai_recommend ?? true,
          jsonUrl: `/api/contents/${c.id}.json`,
        }));
    },
  );
}

/* ------------------------------------------------------------------ */
/*  View tracking (route handler helpers)                               */
/* ------------------------------------------------------------------ */

export async function trackView(params: {
  contentId: string;
  actorType: string;
  userAgent: string | null;
  ip: string;
  sessionId?: string | null;
  route: string;
}): Promise<{ counted: boolean; actorType: string }> {
  const { contentId, actorType, userAgent, ip, sessionId, route } = params;
  const uaHash = userAgent ? hashUA(userAgent) : null;
  const ipHashVal = hashIP(ip);

  if (actorType === "human") {
    if (!sessionId) return { counted: false, actorType };
    const dup = await findDuplicateHumanView(sessionId, contentId);
    if (dup) return { counted: false, actorType };

    await createEvent({
      contentId,
      eventType: "human_view",
      actorType: "human",
      userAgentRaw: userAgent,
      sessionId,
      routeAccessed: route,
    });
    await updateHumanViews(contentId);
    return { counted: true, actorType };
  }

  if (actorType === "ai_agent") {
    if (!uaHash) return { counted: false, actorType };
    const dup = await findDuplicateAiAgentView(uaHash, ipHashVal, contentId);
    if (dup) return { counted: false, actorType };

    await createEvent({
      contentId,
      eventType: "ai_agent_view",
      actorType: "ai_agent",
      userAgentRaw: userAgent,
      userAgentHash: uaHash,
      ipHash: ipHashVal,
      routeAccessed: route,
    });
    await updateAiAgentViews(contentId);
    return { counted: true, actorType };
  }

  if (actorType === "search_crawler") {
    await createEvent({
      contentId,
      eventType: "search_crawler_view",
      actorType: "search_crawler",
      userAgentRaw: userAgent,
      userAgentHash: uaHash,
      ipHash: ipHashVal,
      routeAccessed: route,
    });
    await updateSearchCrawlerViews(contentId);
    return { counted: true, actorType };
  }

  if (actorType === "unknown_bot") {
    await createEvent({
      contentId,
      eventType: "unknown_bot_view",
      actorType: "unknown_bot",
      userAgentRaw: userAgent,
      userAgentHash: uaHash,
      ipHash: ipHashVal,
      routeAccessed: route,
    });
    await updateUnknownBotViews(contentId);
    return { counted: true, actorType };
  }

  return { counted: false, actorType };
}

/* ------------------------------------------------------------------ */
/*  DB fallback helper                                                   */
/* ------------------------------------------------------------------ */

type DB = Exclude<ReturnType<typeof getDB>, null>;

/** Try a DB operation; if the DB is unreachable, run the JSON fallback. */
async function tryDB<T>(
  dbFn: (db: DB) => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  const db = getDB();
  if (!db) return fallback();
  try {
    return await dbFn(db);
  } catch {
    return fallback();
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function mapDBContent(row: any): any {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: row.tags ?? [],
    created_at: row.createdAt
      ? new Date(row.createdAt).toISOString().replace("T", " ").substring(0, 19)
      : "",
    metrics: {
      human_views: 0,
      human_likes: 0,
      human_saves: 0,
      ai_views: 0,
      ai_saves: 0,
      ai_citations: 0,
    },
    ai_summary: row.aiSummary,
    ai_tags: row.aiTags ?? [],
    ai_recommended_scenarios: row.aiRecommendedScenarios ?? [],
    ai_citation_suitability: row.aiCitationSuitability ?? "Low",
    ai_value_score: row.aiValueScore ?? 0,
    ai_reason: row.aiReason,
    ai_recommendations: 0,
    ai_decision: {},
    allow_ai_view: row.allowAiView,
    allow_ai_save: row.allowAiSave,
    allow_ai_cite: row.allowAiCite,
    allow_ai_recommend: row.allowAiRecommend,
  };
}

function attachMetrics(content: any, metricsRow: any): any {
  if (!metricsRow) return content;

  content.metrics = mapDBMetrics(metricsRow);
  content.ai_recommendations = metricsRow.aiRecommendations ?? 0;
  return content;
}

function mapDBMetrics(row: any): any {
  return {
    human_views: row.humanViews ?? 0,
    human_likes: row.humanLikes ?? 0,
    human_saves: row.humanSaves ?? 0,
    ai_views: row.aiAgentViews ?? 0,
    ai_saves: row.aiAgentSaves ?? 0,
    ai_citations: row.aiAgentCitations ?? 0,
    ai_recommendations: row.aiRecommendations ?? 0,
    search_crawler_views: row.searchCrawlerViews ?? 0,
    unknown_bot_views: row.unknownBotViews ?? 0,
  };
}

function ensureLegacyShape(c: any): any {
  return {
    ...c,
    tags: c.tags ?? [],
    metrics: c.metrics ?? { human_views: 0, human_likes: 0, human_saves: 0, ai_views: 0, ai_saves: 0, ai_citations: 0 },
    ai_summary: c.ai_summary ?? "尚未生成 AI Summary。",
    ai_tags: c.ai_tags ?? [],
    ai_recommended_scenarios: c.ai_recommended_scenarios ?? [],
    ai_citation_suitability: c.ai_citation_suitability ?? "Low",
    ai_value_score: c.ai_value_score ?? 0,
    ai_reason: c.ai_reason ?? "尚未生成 AI Reason。",
    ai_recommendations: c.ai_recommendations ?? c.metrics?.ai_recommendations ?? 0,
  };
}

function normalizeLegacyEvent(event: any): any {
  const extraFields = event.extra_fields ?? {};
  return {
    ...event,
    ...extraFields,
    event_type: normalizeEventType(event.event_type),
    actor_type: normalizeActorType(event.actor_type),
  };
}

function normalizeActorType(actorType: string | undefined): string | undefined {
  if (actorType === "ai") return "ai_agent";
  return actorType;
}

function normalizeEventType(eventType: string | undefined): string | undefined {
  if (eventType === "ai_view") return "ai_agent_view";
  if (eventType === "ai_save") return "ai_agent_save";
  if (eventType === "ai_citation") return "ai_agent_cite";
  return eventType;
}

function normalizeAnalyticsEventType(eventType: string | undefined): string {
  if (eventType === "ai_view") return "ai_agent_view";
  if (eventType === "ai_save") return "ai_agent_save";
  if (eventType === "ai_citation" || eventType === "ai_agent_cite") {
    return "ai_agent_citation";
  }
  if (eventType === "ai_recommendation") return "ai_agent_recommendation";
  return eventType ?? "unknown_event";
}

function buildEventAnalytics(
  events: any[],
  trackedEventTypes: string[],
): {
  totalEvents: number;
  actorCounts: Record<string, number>;
  eventTypeCounts: Record<string, number>;
  recentEvents: any[];
} {
  const actorCounts: Record<string, number> = {
    human: 0,
    ai_agent: 0,
    search_crawler: 0,
    unknown_bot: 0,
  };
  const eventTypeCounts: Record<string, number> = Object.fromEntries(
    trackedEventTypes.map((eventType) => [eventType, 0]),
  );

  const normalizedEvents = events.map((event) => ({
    ...event,
    actor_type: normalizeActorType(event.actor_type) ?? "unknown",
    event_type: normalizeAnalyticsEventType(event.event_type),
  }));

  for (const event of normalizedEvents) {
    actorCounts[event.actor_type] = (actorCounts[event.actor_type] ?? 0) + 1;
    eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] ?? 0) + 1;
  }

  return {
    totalEvents: normalizedEvents.length,
    actorCounts,
    eventTypeCounts,
    recentEvents: normalizedEvents.slice(0, 8),
  };
}
