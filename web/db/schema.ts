import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  numeric,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayNumber: integer("display_number").unique().notNull(),
  displayName: text("display_name").unique().notNull(),
  profileType: text("profile_type").default("human_guest").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contents = pgTable("contents", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tags: text("tags").array().default([]).notNull(),
  authorId: uuid("author_id").references(() => profiles.id, { onDelete: "set null" }),
  authorDisplayName: text("author_display_name").default("CoView Demo Author").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  aiSummary: text("ai_summary"),
  aiTags: text("ai_tags").array().default([]).notNull(),
  aiRecommendedScenarios: text("ai_recommended_scenarios").array().default([]).notNull(),
  aiCitationSuitability: text("ai_citation_suitability").default("Low").notNull(),
  aiValueScore: integer("ai_value_score").default(0).notNull(),
  aiReason: text("ai_reason"),

  allowAiView: boolean("allow_ai_view").default(true).notNull(),
  allowAiSave: boolean("allow_ai_save").default(true).notNull(),
  allowAiCite: boolean("allow_ai_cite").default(true).notNull(),
  allowAiRecommend: boolean("allow_ai_recommend").default(true).notNull(),
});

export const contentMetrics = pgTable("content_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentId: uuid("content_id")
    .references(() => contents.id, { onDelete: "cascade" })
    .unique()
    .notNull(),

  humanViews: integer("human_views").default(0).notNull(),
  humanLikes: integer("human_likes").default(0).notNull(),
  humanSaves: integer("human_saves").default(0).notNull(),

  aiAgentViews: integer("ai_agent_views").default(0).notNull(),
  aiAgentSaves: integer("ai_agent_saves").default(0).notNull(),
  aiAgentCitations: integer("ai_agent_citations").default(0).notNull(),
  aiRecommendations: integer("ai_recommendations").default(0).notNull(),

  searchCrawlerViews: integer("search_crawler_views").default(0).notNull(),
  unknownBotViews: integer("unknown_bot_views").default(0).notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id").references(() => contents.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    actorType: text("actor_type").notNull(),
    userAgentRaw: text("user_agent_raw"),
    userAgentHash: text("user_agent_hash"),
    ipHash: text("ip_hash"),
    sessionId: text("session_id"),
    routeAccessed: text("route_accessed"),
    extraFields: jsonb("extra_fields").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_events_content").on(table.contentId),
    index("idx_events_actor").on(table.actorType),
    index("idx_events_type").on(table.eventType),
    index("idx_events_time").on(table.createdAt.desc()),
    index("idx_events_dedup").on(
      table.userAgentHash,
      table.ipHash,
      table.contentId,
      table.createdAt,
    ),
  ],
);

export const aiDecisions = pgTable("ai_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentId: uuid("content_id")
    .references(() => contents.id, { onDelete: "cascade" })
    .notNull(),
  shouldRead: boolean("should_read").default(true).notNull(),
  shouldSave: boolean("should_save").default(false).notNull(),
  shouldCite: boolean("should_cite").default(false).notNull(),
  shouldRecommend: boolean("should_recommend").default(false).notNull(),
  shouldRejectCitation: boolean("should_reject_citation").default(false).notNull(),
  decisionReason: text("decision_reason"),
  confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
