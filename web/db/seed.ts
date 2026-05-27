/**
 * Seed script: imports `../data/contents.json` and `../data/events.json`
 * into PostgreSQL via Drizzle ORM.
 *
 * Run with: npx tsx db/seed.ts
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { getDatabaseUrl, getPgPoolConfig, logDatabaseError } from "./utils";

const DATA_DIR = path.resolve(process.cwd(), "..", "data");
const REQUIRED_TABLES = ["profiles", "contents", "content_metrics", "events", "ai_decisions"];

function readJSON(filename: string): any[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function parseTime(str: string): Date {
  if (!str) return new Date();
  // Supports "2026-05-27 02:04" and "2026-05-27 02:11:44"
  const normalised = str.replace(" ", "T");
  const d = new Date(normalised + (normalised.length === 16 ? ":00" : ""));
  return isNaN(d.getTime()) ? new Date() : d;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function stableUuidFromLegacyId(id: string): string {
  if (isUuid(id)) return id;

  const hash = createHash("sha256").update(`coview:${id}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

async function main() {
  const contents = readJSON("contents.json");
  const events = readJSON("events.json");

  console.log(`Found ${contents.length} contents, ${events.length} events`);

  const databaseUrl =
    getDatabaseUrl() ??
    "postgresql://postgres:postgres@localhost:5432/coview";
  const pool = new Pool(getPgPoolConfig(databaseUrl));
  const db = drizzle(pool, { schema });

  try {
    await assertMigrationComplete(pool);

    // --- Insert contents ---
    const contentIdMap = new Map<string, string>();
    for (const c of contents) {
      const dbContentId = stableUuidFromLegacyId(c.id);
      contentIdMap.set(c.id, dbContentId);

      const existing = await db
        .select()
        .from(schema.contents)
        .where(eq(schema.contents.slug, c.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  SKIP content "${c.title}" (already exists)`);
        continue;
      }

      await db.insert(schema.contents).values({
        id: dbContentId,
        slug: c.id,
        title: c.title,
        body: c.body,
        tags: c.tags ?? [],
        authorDisplayName: c.author_display_name ?? "CoView Demo Author",
        createdAt: parseTime(c.created_at),
        updatedAt: parseTime(c.created_at),
        aiSummary: c.ai_summary ?? null,
        aiTags: c.ai_tags ?? [],
        aiRecommendedScenarios: c.ai_recommended_scenarios ?? [],
        aiCitationSuitability: c.ai_citation_suitability ?? "Low",
        aiValueScore: c.ai_value_score ?? 0,
        aiReason: c.ai_reason ?? null,
        allowAiView: c.allow_ai_view ?? true,
        allowAiSave: c.allow_ai_save ?? true,
        allowAiCite: c.allow_ai_cite ?? true,
        allowAiRecommend: c.allow_ai_recommend ?? true,
      });

      const m = c.metrics ?? {};
      await db
        .insert(schema.contentMetrics)
        .values({
          contentId: dbContentId,
          humanViews: m.human_views ?? 0,
          humanLikes: m.human_likes ?? 0,
          humanSaves: m.human_saves ?? 0,
          aiAgentViews: m.ai_views ?? 0,
          aiAgentSaves: m.ai_saves ?? 0,
          aiAgentCitations: m.ai_citations ?? 0,
          aiRecommendations: c.ai_recommendations ?? 0,
        })
        .onConflictDoNothing();

      // Insert ai_decision if present
      const d = c.ai_decision;
      if (d && Object.keys(d).length > 0) {
        await db.insert(schema.aiDecisions).values({
          contentId: dbContentId,
          shouldRead: d.should_read ?? true,
          shouldSave: d.should_save ?? false,
          shouldCite: d.should_cite ?? false,
          shouldRecommend: d.should_recommend ?? false,
          shouldRejectCitation: d.should_reject_citation ?? false,
          decisionReason: d.decision_reason ?? null,
          confidenceScore: d.confidence_score?.toString() ?? null,
        });
      }

      console.log(`  OK content: "${c.title}"`);
    }

    // --- Insert events ---
    let eventCount = 0;
    for (const e of events) {
      // Map legacy actor_type "ai" → "ai_agent"
      let actorType = e.actor_type;
      if (actorType === "ai") actorType = "ai_agent";

      // Map legacy AI event types to formal Next.js names.
      let eventType = e.event_type;
      if (eventType === "ai_view") eventType = "ai_agent_view";
      if (eventType === "ai_save") eventType = "ai_agent_save";
      if (eventType === "ai_citation") eventType = "ai_agent_cite";

      const existing = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, e.event_id))
        .limit(1);

      if (existing.length > 0) continue;

      await db.insert(schema.events).values({
        id: e.event_id,
        contentId: e.content_id ? contentIdMap.get(e.content_id) ?? null : null,
        eventType,
        actorType,
        userAgentHash: e.user_agent_hash ?? null,
        ipHash: e.ip_hash ?? null,
        sessionId: e.session_id ?? null,
        routeAccessed: e.route_accessed ?? null,
        extraFields: e.extra_fields ?? {},
        createdAt: parseTime(e.timestamp),
      });

      eventCount++;
    }
    console.log(`  OK ${eventCount} events inserted (${events.length - eventCount} skipped)`);

    console.log("\nSeed complete.");
  } catch (err: unknown) {
    logDatabaseError("Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function assertMigrationComplete(pool: Pool): Promise<void> {
  await pool.query("SELECT 1");

  const result = await pool.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
    `,
    [REQUIRED_TABLES],
  );
  const existingTables = new Set(result.rows.map((row) => row.table_name));
  const missingTables = REQUIRED_TABLES.filter((table) => !existingTables.has(table));

  if (missingTables.length > 0) {
    throw new Error(
      "Migration has not completed. Missing tables: " +
        missingTables.join(", ") +
        ". Run `npx tsx db/migrate.ts` successfully before `npx tsx db/seed.ts`.",
    );
  }
}

main();
