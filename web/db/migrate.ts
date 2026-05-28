/**
 * Programmatic schema migration.
 * Run with: npx tsx db/migrate.ts
 *
 * Creates all tables if they don't exist, using raw SQL via pg Pool.
 */
import { Pool } from "pg";
import { getDatabaseUrl, getPgPoolConfig, logDatabaseError } from "./utils";

const SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_number INTEGER UNIQUE NOT NULL,
  display_name TEXT UNIQUE NOT NULL,
  profile_type TEXT DEFAULT 'human_guest' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  agent_owner_label TEXT NOT NULL,
  agent_owner_contact TEXT,
  agent_type TEXT DEFAULT 'assistant' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  scopes JSONB DEFAULT '["read"]'::jsonb NOT NULL,
  description TEXT,
  homepage_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_created ON agents(created_at DESC);

CREATE TABLE IF NOT EXISTS contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_display_name TEXT DEFAULT 'CoView Demo Author' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ai_summary TEXT,
  ai_tags TEXT[] DEFAULT '{}' NOT NULL,
  ai_recommended_scenarios TEXT[] DEFAULT '{}' NOT NULL,
  ai_citation_suitability TEXT DEFAULT 'Low' NOT NULL,
  ai_value_score INTEGER DEFAULT 0 NOT NULL,
  ai_reason TEXT,
  allow_ai_view BOOLEAN DEFAULT true NOT NULL,
  allow_ai_save BOOLEAN DEFAULT true NOT NULL,
  allow_ai_cite BOOLEAN DEFAULT true NOT NULL,
  allow_ai_recommend BOOLEAN DEFAULT true NOT NULL,
  allow_ai_comment BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS author_display_name TEXT DEFAULT 'CoView Demo Author' NOT NULL;

ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS allow_ai_comment BOOLEAN DEFAULT false NOT NULL;

UPDATE contents
SET author_display_name = 'CoView Demo Author'
WHERE author_display_name IS NULL OR author_display_name = '';

UPDATE contents
SET allow_ai_comment = false
WHERE allow_ai_comment IS NULL;

CREATE TABLE IF NOT EXISTS content_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID UNIQUE NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  human_views INTEGER DEFAULT 0 NOT NULL,
  human_likes INTEGER DEFAULT 0 NOT NULL,
  human_saves INTEGER DEFAULT 0 NOT NULL,
  ai_agent_views INTEGER DEFAULT 0 NOT NULL,
  ai_agent_saves INTEGER DEFAULT 0 NOT NULL,
  ai_agent_citations INTEGER DEFAULT 0 NOT NULL,
  ai_recommendations INTEGER DEFAULT 0 NOT NULL,
  search_crawler_views INTEGER DEFAULT 0 NOT NULL,
  unknown_bot_views INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  user_agent_raw TEXT,
  user_agent_hash TEXT,
  ip_hash TEXT,
  session_id TEXT,
  route_accessed TEXT,
  extra_fields JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_content ON events(content_id);
CREATE INDEX IF NOT EXISTS idx_events_actor ON events(actor_type);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_time ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_dedup ON events(user_agent_hash, ip_hash, content_id, created_at);

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_display_name TEXT NOT NULL,
  actor_type TEXT DEFAULT 'human' NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'visible' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_time ON comments(created_at DESC);

CREATE TABLE IF NOT EXISTS ai_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  should_read BOOLEAN DEFAULT true NOT NULL,
  should_save BOOLEAN DEFAULT false NOT NULL,
  should_cite BOOLEAN DEFAULT false NOT NULL,
  should_recommend BOOLEAN DEFAULT false NOT NULL,
  should_reject_citation BOOLEAN DEFAULT false NOT NULL,
  decision_reason TEXT,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
`;

async function main() {
  const databaseUrl =
    getDatabaseUrl() ??
    "postgresql://postgres:postgres@localhost:5432/coview";
  console.log("Connecting to PostgreSQL...");
  const pool = new Pool(getPgPoolConfig(databaseUrl));

  try {
    await pool.query("SELECT 1");
    console.log("Connection OK.");
    await pool.query(SQL);
    console.log("Migration complete: all tables and indexes created.");
  } catch (err: unknown) {
    logDatabaseError("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
