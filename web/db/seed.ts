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
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(process.cwd(), "..", "data");
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/coview";

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

async function main() {
  const contents = readJSON("contents.json");
  const events = readJSON("events.json");

  console.log(`Found ${contents.length} contents, ${events.length} events`);

  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema });

  try {
    // --- Insert contents ---
    for (const c of contents) {
      const existing = await db
        .select()
        .from(schema.contents)
        .where(eq(schema.contents.id, c.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  SKIP content "${c.title}" (already exists)`);
        continue;
      }

      await db.insert(schema.contents).values({
        id: c.id,
        slug: c.id,
        title: c.title,
        body: c.body,
        tags: c.tags ?? [],
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
          contentId: c.id,
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
          contentId: c.id,
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
        contentId: e.content_id ?? null,
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
  } catch (err: any) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
