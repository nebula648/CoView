import { getDB } from "@/lib/db";
import { schema } from "@/lib/db";
import { eq, and, gte, desc, sql, or } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import {
  readAgents,
  readComments,
  readContents,
  readEvents,
  readProfiles,
  writeComments,
  writeContents,
  writeEvents,
  writeProfiles,
} from "@/lib/data-source";
import { hashUA, hashIP } from "@/lib/dedup";
import type {
  AdminComment,
  Agent,
  AgentAccessToken,
  AgentAccessTokenStats,
  AgentTokenValidationResult,
  AgentStats,
  CommentStats,
} from "@/lib/types";

const DEFAULT_AUTHOR_NAME = "CoView Demo Author";

/* ------------------------------------------------------------------ */
/*  External AI Agents                                                  */
/* ------------------------------------------------------------------ */

export async function getAgents(): Promise<Agent[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.agents)
        .orderBy(desc(schema.agents.createdAt));
      return rows.map(mapDBAgent);
    },
    () => readAgents().map(ensureAgentShape),
  );
}

export async function getAgentStats(): Promise<AgentStats> {
  const agents = await getAgents();
  return {
    totalAgents: agents.length,
    activeAgents: agents.filter((agent) => agent.status === "active").length,
    pendingAgents: agents.filter((agent) => agent.status === "pending").length,
    suspendedAgents: agents.filter((agent) => agent.status === "suspended").length,
  };
}

/* ------------------------------------------------------------------ */
/*  External AI Agent Tokens                                            */
/* ------------------------------------------------------------------ */

export async function getAgentAccessTokens(): Promise<AgentAccessToken[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select({
          token: schema.agentAccessTokens,
          agentName: schema.agents.agentName,
          agentOwnerLabel: schema.agents.agentOwnerLabel,
        })
        .from(schema.agentAccessTokens)
        .leftJoin(schema.agents, eq(schema.agentAccessTokens.agentId, schema.agents.id))
        .orderBy(desc(schema.agentAccessTokens.createdAt));

      return rows.map((row: any) =>
        mapDBAgentAccessToken(row.token, row.agentName, row.agentOwnerLabel),
      );
    },
    () => [],
  );
}

export async function getAgentAccessTokensByAgent(
  agentId: string,
): Promise<AgentAccessToken[]> {
  const tokens = await getAgentAccessTokens();
  return tokens.filter((token) => token.agent_id === agentId);
}

export async function getAgentAccessTokenStats(): Promise<AgentAccessTokenStats> {
  const tokens = await getAgentAccessTokens();
  return {
    totalTokens: tokens.length,
    activeTokens: tokens.filter((token) => token.status === "active").length,
    revokedTokens: tokens.filter((token) => token.status === "revoked").length,
    agentsWithTokens: new Set(tokens.map((token) => token.agent_id)).size,
  };
}

export async function createAgentAccessToken(input: {
  agentId: string;
  name?: string | null;
  scopes?: string[];
}): Promise<{ token: string; record: AgentAccessToken }> {
  const db = getDB();
  if (!db) {
    throw new Error("Agent token management requires database mode.");
  }

  const agentRows = await db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.id, input.agentId))
    .limit(1);

  if (agentRows.length === 0) {
    throw new Error("Agent not found.");
  }

  const agent = mapDBAgent(agentRows[0]);
  const scopes = input.scopes?.length ? input.scopes : agent.scopes;
  const token = generateAgentToken();
  const tokenHash = hashAgentToken(token);
  const tokenPrefix = `${token.slice(0, 18)}...`;

  const inserted = await db
    .insert(schema.agentAccessTokens)
    .values({
      agentId: input.agentId,
      tokenHash,
      tokenPrefix,
      name: input.name?.trim() || null,
      scopes,
      status: "active",
    })
    .returning();

  return {
    token,
    record: mapDBAgentAccessToken(
      inserted[0],
      agent.agent_name,
      agent.agent_owner_label,
    ),
  };
}

export async function revokeAgentAccessToken(tokenId: string): Promise<void> {
  const db = getDB();
  if (!db) {
    throw new Error("Agent token management requires database mode.");
  }

  await db
    .update(schema.agentAccessTokens)
    .set({
      status: "revoked",
      revokedAt: new Date(),
    })
    .where(eq(schema.agentAccessTokens.id, tokenId));
}

export async function validateAgentToken(
  token: string,
  requiredScope: string,
): Promise<AgentTokenValidationResult> {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    return { valid: false, reason: "missing_token" };
  }

  const db = getDB();
  if (!db) {
    return { valid: false, reason: "invalid_token" };
  }

  const tokenHash = hashAgentToken(normalizedToken);
  const rows = await db
    .select({
      token: schema.agentAccessTokens,
      agent: schema.agents,
    })
    .from(schema.agentAccessTokens)
    .leftJoin(schema.agents, eq(schema.agentAccessTokens.agentId, schema.agents.id))
    .where(eq(schema.agentAccessTokens.tokenHash, tokenHash))
    .limit(1);

  if (rows.length === 0) {
    return { valid: false, reason: "invalid_token" };
  }

  const tokenRow = rows[0].token;
  const agent = rows[0].agent ? mapDBAgent(rows[0].agent) : undefined;
  const tokenScopes = Array.isArray(tokenRow.scopes) ? tokenRow.scopes : [];
  const partialResult = {
    agent,
    token_id: tokenRow.id,
    token_prefix: tokenRow.tokenPrefix,
    token_scopes: tokenScopes,
  };

  if (tokenRow.status !== "active" || tokenRow.revokedAt) {
    return { valid: false, reason: "token_revoked", ...partialResult };
  }

  if (!agent || agent.status !== "active") {
    return { valid: false, reason: "agent_suspended", ...partialResult };
  }

  if (
    !tokenScopes.includes(requiredScope) ||
    !agent.scopes.includes(requiredScope)
  ) {
    return { valid: false, reason: "missing_scope", ...partialResult };
  }

  await db
    .update(schema.agentAccessTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.agentAccessTokens.id, tokenRow.id));

  return {
    valid: true,
    agent,
    token_id: tokenRow.id,
    token_prefix: tokenRow.tokenPrefix,
    token_scopes: tokenScopes,
  };
}

export async function createAgent(input: {
  agentName: string;
  agentType: string;
  description?: string | null;
  homepageUrl?: string | null;
}): Promise<{ agent: Agent; token: string }> {
  const db = getDB();
  if (!db) {
    throw new Error("Agent registration requires database mode.");
  }

  const agentRows = await db
    .insert(schema.agents)
    .values({
      agentName: input.agentName.trim(),
      agentOwnerLabel: "self-registered",
      agentOwnerContact: null,
      agentType: input.agentType.trim() || "assistant",
      status: "active",
      scopes: ["read", "comment", "cite", "recommend", "post"],
      description: input.description?.trim() || null,
      homepageUrl: input.homepageUrl?.trim() || null,
    })
    .returning();

  const agent = mapDBAgent(agentRows[0]);
  const token = generateAgentToken();
  const tokenHash = hashAgentToken(token);
  const tokenPrefix = `${token.slice(0, 18)}...`;

  await db.insert(schema.agentAccessTokens).values({
    agentId: agent.id,
    tokenHash,
    tokenPrefix,
    name: "default",
    scopes: ["read", "comment", "cite", "recommend", "post"],
    status: "active",
  });

  return { agent, token };
}

export async function getPublicAgents(): Promise<Agent[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.agents)
        .where(eq(schema.agents.status, "active"))
        .orderBy(desc(schema.agents.createdAt));
      return rows.map(mapDBAgent);
    },
    () => readAgents().filter((a: any) => a.status === "active").map(ensureAgentShape),
  );
}

export async function getAgentById(id: string): Promise<Agent | null> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.agents)
        .where(eq(schema.agents.id, id))
        .limit(1);
      return rows.length > 0 ? mapDBAgent(rows[0]) : null;
    },
    () => {
      const agents = readAgents();
      const agent = agents.find((a: any) => a.id === id);
      return agent ? ensureAgentShape(agent) : null;
    },
  );
}

export async function getContentsByAgent(agentId: string): Promise<any[]> {
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
        .where(
          and(
            eq(schema.contents.authorType, "ai_agent"),
            eq(schema.contents.authorAgentId, agentId),
          ),
        )
        .orderBy(desc(schema.contents.createdAt));
      return rows.map((row: any) => attachMetrics(mapDBContent(row.content), row.metrics));
    },
    () => {
      const contents = readContents();
      return contents
        .filter((c: any) => c.author_type === "ai_agent" && c.author_agent_id === agentId)
        .map(ensureLegacyShape);
    },
  );
}

export async function getCommentsByAgent(agentId: string, limit: number = 50): Promise<any[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.agentId, agentId))
        .orderBy(desc(schema.comments.createdAt))
        .limit(limit);
      return rows.map(mapDBComment);
    },
    () => {
      const comments = readComments();
      return comments
        .filter((c: any) => c.agent_id === agentId)
        .map(ensureCommentShape)
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, limit);
    },
  );
}

export async function getAgentProfileStats(agentId: string): Promise<{
  postsCount: number;
  commentsCount: number;
}> {
  const [contents, comments] = await Promise.all([
    getContentsByAgent(agentId),
    getCommentsByAgent(agentId),
  ]);
  return {
    postsCount: contents.length,
    commentsCount: comments.length,
  };
}

/* ------------------------------------------------------------------ */
/*  Profile-content queries                                             */
/* ------------------------------------------------------------------ */

export async function getContentsByProfileId(profileId: string): Promise<any[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select({
          content: schema.contents,
          metrics: schema.contentMetrics,
          profile: schema.profiles,
        })
        .from(schema.contents)
        .leftJoin(
          schema.contentMetrics,
          eq(schema.contentMetrics.contentId, schema.contents.id),
        )
        .leftJoin(
          schema.profiles,
          eq(schema.contents.authorId, schema.profiles.id),
        )
        .where(eq(schema.contents.authorId, profileId))
        .orderBy(desc(schema.contents.createdAt));
      return rows.map((row: any) => {
        const c = attachMetrics(mapDBContent(row.content), row.metrics);
        c.author_username = row.profile?.username ?? null;
        return c;
      });
    },
    () => {
      const profiles = readProfiles();
      const profileMap = new Map(profiles.map((p: any) => [p.id, p.username]));
      return readContents()
        .filter((c: any) => c.author_id === profileId)
        .map(ensureLegacyShape)
        .map((c: any) => {
          c.author_username = profileMap.get(c.author_id) ?? null;
          return c;
        });
    },
  );
}

export async function getCommentsByProfileId(
  profileId: string,
  limit: number = 50,
): Promise<any[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.authorId, profileId))
        .orderBy(desc(schema.comments.createdAt))
        .limit(limit);
      return rows.map(mapDBComment);
    },
    () => {
      return readComments()
        .filter((c: any) => c.author_id === profileId)
        .map(ensureCommentShape)
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, limit);
    },
  );
}

/* ------------------------------------------------------------------ */
/*  Lightweight Profiles                                                */
/* ------------------------------------------------------------------ */

export async function getProfileById(profileId: string): Promise<any | null> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.id, profileId))
        .limit(1);
      return rows.length > 0 ? mapDBProfile(rows[0]) : null;
    },
    () => {
      const profiles = readProfiles();
      return profiles.find((profile: any) => profile.id === profileId) ?? null;
    },
  );
}

export async function touchProfileLastSeen(profileId: string): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      await db
        .update(schema.profiles)
        .set({ lastSeenAt: new Date() })
        .where(eq(schema.profiles.id, profileId));
      return;
    } catch { /* fall through to JSON fallback */ }
  }

  const profiles = readProfiles();
  const profile = profiles.find((p: any) => p.id === profileId);
  if (profile) {
    profile.last_seen_at = new Date().toISOString();
    writeProfiles(profiles);
  }
}

export async function createProfile(): Promise<{
  id: string;
  display_name: string;
  profile_type: string;
}> {
  const db = getDB();
  if (db) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const maxRows = await db
          .select({
            maxDisplayNumber: sql<number>`coalesce(max(${schema.profiles.displayNumber}), 0)`,
          })
          .from(schema.profiles);
        const displayNumber = Number(maxRows[0]?.maxDisplayNumber ?? 0) + 1;
        const displayName = formatCoViewerName(displayNumber);
        const inserted = await db
          .insert(schema.profiles)
          .values({
            displayNumber,
            displayName,
            profileType: "human_guest",
          })
          .returning();
        return mapDBProfile(inserted[0]);
      } catch {
        // Retry possible display_number collisions from simultaneous first visits.
      }
    }
  }

  const profiles = readProfiles();
  const displayNumber =
    profiles.reduce((max: number, p: any) => Math.max(max, p.display_number ?? 0), 0) + 1;
  const now = new Date().toISOString();
  const profile = {
    id: crypto.randomUUID(),
    display_number: displayNumber,
    display_name: formatCoViewerName(displayNumber),
    profile_type: "human_guest",
    created_at: now,
    last_seen_at: now,
  };
  profiles.push(profile);
  writeProfiles(profiles);
  return profile;
}

export async function getUserByEmail(email: string): Promise<any | null> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.email, email.toLowerCase().trim()))
        .limit(1);
      return rows.length > 0 ? mapDBProfile(rows[0]) : null;
    },
    () => {
      const profiles = readProfiles();
      return profiles.find(
        (p: any) => p.email === email.toLowerCase().trim(),
      ) ?? null;
    },
  );
}

export async function getUserByUsername(username: string): Promise<any | null> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.username, username.toLowerCase().trim()))
        .limit(1);
      return rows.length > 0 ? mapDBProfile(rows[0]) : null;
    },
    () => {
      const profiles = readProfiles();
      return profiles.find(
        (p: any) => p.username === username.toLowerCase().trim(),
      ) ?? null;
    },
  );
}

// Public profile — only for human_user, never exposes email or password_hash
export async function getPublicProfileByUsername(username: string): Promise<any | null> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.profiles)
        .where(
          and(
            eq(schema.profiles.username, username.toLowerCase().trim()),
            eq(schema.profiles.profileType, "human_user"),
          ),
        )
        .limit(1);
      return rows.length > 0 ? mapDBPublicProfile(rows[0]) : null;
    },
    () => {
      const profiles = readProfiles();
      const match = profiles.find(
        (p: any) =>
          p.username === username.toLowerCase().trim() &&
          p.profile_type === "human_user",
      );
      // Strip sensitive fields from JSON fallback
      if (!match) return null;
      const safe = { ...match };
      delete safe.email;
      delete safe.password_hash;
      return safe;
    },
  );
}

// Own profile for settings — includes email, excludes password_hash
export async function getUserProfileOwn(profileId: string): Promise<any | null> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.id, profileId))
        .limit(1);
      if (rows.length === 0) return null;
      const full = mapDBProfile(rows[0]);
      delete full.password_hash;
      return full;
    },
    () => {
      const profiles = readProfiles();
      const match = profiles.find((p: any) => p.id === profileId);
      if (!match) return null;
      const safe = { ...match };
      delete safe.password_hash;
      return safe;
    },
  );
}

export async function registerUser(params: {
  username: string;
  displayName: string;
  passwordHash: string;
  email?: string;
}): Promise<any> {
  const db = getDB();
  if (db) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const maxRows = await db
          .select({
            maxDisplayNumber: sql<number>`coalesce(max(${schema.profiles.displayNumber}), 0)`,
          })
          .from(schema.profiles);
        const displayNumber = Number(maxRows[0]?.maxDisplayNumber ?? 0) + 1;
        const inserted = await db
          .insert(schema.profiles)
          .values({
            displayNumber,
            displayName: params.displayName,
            email: params.email?.toLowerCase().trim() ?? null,
            username: params.username.toLowerCase().trim(),
            passwordHash: params.passwordHash,
            profileType: "human_user",
          })
          .returning();
        return mapDBProfile(inserted[0]);
      } catch {
        // Retry on display_number collision
      }
    }
    throw new Error("Failed to register user after retries");
  }

  // JSON fallback
  const profiles = readProfiles();
  if (profiles.some((p: any) => p.username === params.username.toLowerCase().trim())) {
    throw new Error("Username already taken");
  }
  const displayNumber =
    profiles.reduce((max: number, p: any) => Math.max(max, p.display_number ?? 0), 0) + 1;
  const now = new Date().toISOString();
  const profile = {
    id: crypto.randomUUID(),
    display_number: displayNumber,
    display_name: params.displayName,
    profile_type: "human_user",
    email: params.email?.toLowerCase().trim() ?? null,
    username: params.username.toLowerCase().trim(),
    password_hash: params.passwordHash,
    bio: null,
    avatar_url: null,
    created_at: now,
    last_seen_at: now,
  };
  profiles.push(profile);
  writeProfiles(profiles);
  return profile;
}

export async function updateUserProfile(
  profileId: string,
  fields: {
    displayName?: string;
    bio?: string | null;
    avatarUrl?: string | null;
  },
): Promise<any> {
  const db = getDB();
  if (db) {
    const updateData: Record<string, unknown> = {};
    if (fields.displayName !== undefined) {
      updateData.displayName = fields.displayName;
    }
    if (fields.bio !== undefined) {
      updateData.bio = fields.bio;
    }
    if (fields.avatarUrl !== undefined) {
      updateData.avatarUrl = fields.avatarUrl;
    }
    const updated = await db
      .update(schema.profiles)
      .set(updateData as any)
      .where(eq(schema.profiles.id, profileId))
      .returning();
    return mapDBPublicProfile(updated[0]);
  }
  const profiles = readProfiles();
  const idx = profiles.findIndex((p: any) => p.id === profileId);
  if (idx === -1) throw new Error("Profile not found");
  if (fields.displayName !== undefined) profiles[idx].display_name = fields.displayName;
  if (fields.bio !== undefined) profiles[idx].bio = fields.bio;
  if (fields.avatarUrl !== undefined) profiles[idx].avatar_url = fields.avatarUrl;
  writeProfiles(profiles);
  const safe = { ...profiles[idx] };
  delete safe.email;
  delete safe.password_hash;
  return safe;
}

/* ------------------------------------------------------------------ */
/*  Rate limit helpers                                                   */
/* ------------------------------------------------------------------ */

export async function countRecentEvents(params: {
  eventType: string;
  ipHash: string;
  sinceMs: number;
}): Promise<number> {
  return tryDB(
    async (db) => {
      const since = new Date(Date.now() - params.sinceMs);
      const rows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.events)
        .where(
          and(
            eq(schema.events.eventType, params.eventType),
            eq(schema.events.ipHash, params.ipHash),
            gte(schema.events.createdAt, since),
          ),
        );
      return rows[0]?.count ?? 0;
    },
    () => {
      const events = readEvents();
      const since = new Date(Date.now() - params.sinceMs);
      return events.filter(
        (e: any) =>
          e.event_type === params.eventType &&
          e.ip_hash === params.ipHash &&
          new Date(e.created_at) >= since,
      ).length;
    },
  );
}

export async function recordRateLimitEvent(params: {
  eventType: string;
  ipHash: string;
  extraFields?: Record<string, unknown>;
}): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      await db.insert(schema.events).values({
        contentId: null,
        eventType: params.eventType,
        actorType: "human",
        ipHash: params.ipHash,
        extraFields: params.extraFields ?? {},
      });
    } catch { /* best-effort */ }
    return;
  }
  // JSON fallback
  const events = readEvents();
  events.push({
    id: crypto.randomUUID(),
    event_type: params.eventType,
    actor_type: "human",
    ip_hash: params.ipHash,
    content_id: null,
    user_agent_raw: null,
    user_agent_hash: null,
    session_id: null,
    route_accessed: null,
    extra_fields: params.extraFields ?? {},
    created_at: new Date().toISOString(),
  });
  writeEvents(events);
}

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
          profile: schema.profiles,
        })
        .from(schema.contents)
        .leftJoin(
          schema.contentMetrics,
          eq(schema.contentMetrics.contentId, schema.contents.id),
        )
        .leftJoin(
          schema.profiles,
          eq(schema.contents.authorId, schema.profiles.id),
        )
        .orderBy(desc(schema.contents.createdAt));

      return rows.map((row: any) => {
        const c = attachMetrics(mapDBContent(row.content), row.metrics);
        c.author_username = row.profile?.username ?? null;
        return c;
      });
    },
    () => {
      const profiles = readProfiles();
      const profileMap = new Map(profiles.map((p: any) => [p.id, p.username]));
      return readContents()
        .map(ensureLegacyShape)
        .map((c: any) => {
          c.author_username = profileMap.get(c.author_id) ?? null;
          return c;
        });
    },
  );
}

export async function getContentBySlug(slug: string): Promise<any | null> {
  return getContentBySlugOrId(slug);
}

export async function getContentBySlugOrId(value: string): Promise<any | null> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select({
          content: schema.contents,
          profile: schema.profiles,
        })
        .from(schema.contents)
        .leftJoin(
          schema.profiles,
          eq(schema.contents.authorId, schema.profiles.id),
        )
        .where(or(eq(schema.contents.id, value), eq(schema.contents.slug, value)))
        .limit(1);
      if (rows.length === 0) return null;
      const content = mapDBContent(rows[0].content);
      content.author_username = rows[0].profile?.username ?? null;
      const metricsRow = await db
        .select()
        .from(schema.contentMetrics)
        .where(eq(schema.contentMetrics.contentId, content.id))
        .limit(1);
      if (metricsRow.length > 0) {
        attachMetrics(content, metricsRow[0]);
      }
      return content;
    },
    () => {
      const contents = readContents();
      const content = contents.find((c: any) => c.id === value || c.slug === value);
      if (!content) return null;
      const profiles = readProfiles();
      const profile = profiles.find((p: any) => p.id === content.author_id);
      const shaped = ensureLegacyShape(content);
      shaped.author_username = profile?.username ?? null;
      return shaped;
    },
  );
}

export async function createContent(payload: {
  title: string;
  body: string;
  tags: string[];
  authorId?: string | null;
  authorDisplayName?: string | null;
  authorType?: string;
  authorAgentId?: string | null;
  allowAiView: boolean;
  allowAiSave: boolean;
  allowAiCite: boolean;
  allowAiRecommend: boolean;
  allowAiComment?: boolean;
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
        authorId: payload.authorId ?? null,
        authorDisplayName: payload.authorDisplayName ?? DEFAULT_AUTHOR_NAME,
        authorType: payload.authorType ?? "human",
        authorAgentId: payload.authorAgentId ?? null,
        allowAiView: payload.allowAiView,
        allowAiSave: payload.allowAiSave,
        allowAiCite: payload.allowAiCite,
        allowAiRecommend: payload.allowAiRecommend,
        allowAiComment: payload.allowAiComment ?? false,
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
    author_id: payload.authorId ?? null,
    author_display_name: payload.authorDisplayName ?? DEFAULT_AUTHOR_NAME,
    author_type: payload.authorType ?? "human",
    author_agent_id: payload.authorAgentId ?? null,
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
    allow_ai_comment: payload.allowAiComment ?? false,
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
/*  Comments                                                            */
/* ------------------------------------------------------------------ */

export async function getCommentsByContentId(contentId: string): Promise<any[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select({
          comment: schema.comments,
          profile: schema.profiles,
        })
        .from(schema.comments)
        .leftJoin(
          schema.profiles,
          eq(schema.comments.authorId, schema.profiles.id),
        )
        .where(
          and(
            eq(schema.comments.contentId, contentId),
            eq(schema.comments.status, "visible"),
          ),
        )
        .orderBy(desc(schema.comments.createdAt));

      return rows.map((row: any) => {
        const c = mapDBComment(row.comment);
        c.author_username = row.profile?.username ?? null;
        return c;
      });
    },
    () => {
      const comments = readComments();
      const profiles = readProfiles();
      const profileMap = new Map(profiles.map((p: any) => [p.id, p.username]));
      return comments
        .filter(
          (comment: any) =>
            comment.content_id === contentId &&
            (comment.status ?? "visible") === "visible",
        )
        .map(ensureCommentShape)
        .map((c: any) => {
          c.author_username = profileMap.get(c.author_id) ?? null;
          return c;
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
    },
  );
}

export async function getAdminComments(limit: number = 100): Promise<AdminComment[]> {
  return tryDB(
    async (db) => {
      const rows = await db
        .select({
          comment: schema.comments,
          contentTitle: schema.contents.title,
          contentSlug: schema.contents.slug,
        })
        .from(schema.comments)
        .leftJoin(schema.contents, eq(schema.comments.contentId, schema.contents.id))
        .orderBy(desc(schema.comments.createdAt))
        .limit(limit);

      return rows.map((row: any) => ({
        ...mapDBComment(row.comment),
        content_title: row.contentTitle ?? null,
        content_slug: row.contentSlug ?? row.comment.contentId,
      }));
    },
    () => {
      const contents = readContents();
      return readComments()
        .map(ensureCommentShape)
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )
        .slice(0, limit)
        .map((comment: any) => {
          const content = contents.find((item: any) => item.id === comment.content_id);
          return {
            ...comment,
            content_title: content?.title ?? null,
            content_slug: content?.slug ?? content?.id ?? comment.content_id,
          };
        });
    },
  );
}

export async function getCommentStats(): Promise<CommentStats> {
  return tryDB(
    async (db) => {
      const comments = await db.select().from(schema.comments);
      return buildCommentStats(comments.map(mapDBComment));
    },
    () => buildCommentStats(readComments().map(ensureCommentShape)),
  );
}

export async function createComment(payload: {
  contentId: string;
  authorId?: string | null;
  authorDisplayName: string;
  body: string;
  actorType?: "human" | "ai_agent";
  agentId?: string | null;
  eventExtraFields?: Record<string, unknown>;
}): Promise<any> {
  const commentBody = payload.body.trim();
  const authorDisplayName = payload.authorDisplayName.trim() || DEFAULT_AUTHOR_NAME;
  const actorType = payload.actorType ?? "human";
  const db = getDB();

  if (db) {
    try {
      const inserted = await db
        .insert(schema.comments)
        .values({
          contentId: payload.contentId,
          authorId: payload.authorId ?? null,
          authorDisplayName,
          actorType,
          agentId: payload.agentId ?? null,
          body: commentBody,
          status: "visible",
        })
        .returning();

      const comment = mapDBComment(inserted[0]);
      await createEvent({
        contentId: payload.contentId,
        eventType: actorType === "ai_agent" ? "ai_agent_comment" : "human_comment",
        actorType,
        extraFields: {
          author_id: payload.authorId ?? null,
          author_display_name: authorDisplayName,
          comment_id: comment.id,
          ...(payload.eventExtraFields ?? {}),
        },
      });
      return comment;
    } catch { /* fall through to JSON fallback */ }
  }

  const comments = readComments();
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  const comment = {
    id: crypto.randomUUID(),
    content_id: payload.contentId,
    author_id: payload.authorId ?? null,
    author_display_name: authorDisplayName,
    actor_type: actorType,
    body: commentBody,
    status: "visible",
    created_at: now,
  };
  comments.push(comment);
  writeComments(comments);

  await createEvent({
    contentId: payload.contentId,
    eventType: actorType === "ai_agent" ? "ai_agent_comment" : "human_comment",
    actorType,
    extraFields: {
      author_id: payload.authorId ?? null,
      author_display_name: authorDisplayName,
      comment_id: comment.id,
      ...(payload.eventExtraFields ?? {}),
    },
  });

  return comment;
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
/*  Site-level AI visit tracking (non-content endpoints)                 */
/* ------------------------------------------------------------------ */

export async function trackSiteLevelAiVisit(params: {
  path: string;
  actorType: string;
  botFamily: string;
  userAgent: string | null;
  ip: string;
}): Promise<void> {
  const { path, actorType, botFamily, userAgent, ip } = params;
  const uaHash = userAgent ? hashUA(userAgent) : null;
  const ipHashVal = hashIP(ip);

  const db = getDB();
  if (db) {
    try {
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const existing = await db
        .select()
        .from(schema.events)
        .where(
          and(
            eq(schema.events.eventType, "ai_site_visit"),
            eq(schema.events.routeAccessed, path),
            eq(schema.events.ipHash, ipHashVal),
            gte(schema.events.createdAt, since),
          ),
        )
        .limit(1);

      if (existing.length > 0) return;

      await db.insert(schema.events).values({
        contentId: null,
        eventType: "ai_site_visit",
        actorType,
        userAgentRaw: userAgent,
        userAgentHash: uaHash,
        ipHash: ipHashVal,
        routeAccessed: path,
        extraFields: { bot_family: botFamily },
      });
      return;
    } catch {
      /* fire-and-forget: failure must not affect the response */
    }
  }

  /* JSON fallback: lightweight — just append, no dedup */
  try {
    const events = readEvents();
    events.push({
      event_id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content_id: null,
      event_type: "ai_site_visit",
      actor_type: actorType,
      user_agent_raw: userAgent,
      user_agent_hash: uaHash,
      ip_hash: ipHashVal,
      route_accessed: path,
      bot_family: botFamily,
      timestamp: new Date().toISOString(),
    });
    writeEvents(events);
  } catch {
    /* fire-and-forget */
  }
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
    slug: row.slug ?? row.id,
    title: row.title,
    body: row.body,
    tags: row.tags ?? [],
    author_id: row.authorId ?? null,
    author_display_name: row.authorDisplayName ?? DEFAULT_AUTHOR_NAME,
    author_type: row.authorType ?? row.author_type ?? "human",
    author_agent_id: row.authorAgentId ?? row.author_agent_id ?? null,
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
    allow_ai_comment: row.allowAiComment ?? false,
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
    slug: c.slug ?? c.id,
    tags: c.tags ?? [],
    author_id: c.author_id ?? null,
    author_display_name: c.author_display_name ?? DEFAULT_AUTHOR_NAME,
    author_type: c.author_type ?? "human",
    author_agent_id: c.author_agent_id ?? null,
    metrics: c.metrics ?? { human_views: 0, human_likes: 0, human_saves: 0, ai_views: 0, ai_saves: 0, ai_citations: 0 },
    ai_summary: c.ai_summary ?? "尚未生成 AI Summary。",
    ai_tags: c.ai_tags ?? [],
    ai_recommended_scenarios: c.ai_recommended_scenarios ?? [],
    ai_citation_suitability: c.ai_citation_suitability ?? "Low",
    ai_value_score: c.ai_value_score ?? 0,
    ai_reason: c.ai_reason ?? "尚未生成 AI Reason。",
    ai_recommendations: c.ai_recommendations ?? c.metrics?.ai_recommendations ?? 0,
    allow_ai_comment: c.allow_ai_comment ?? false,
  };
}

function mapDBProfile(row: any): any {
  return {
    id: row.id,
    display_number: row.displayNumber,
    display_name: row.displayName,
    profile_type: row.profileType,
    email: row.email ?? null,
    username: row.username ?? null,
    password_hash: row.passwordHash ?? null,
    bio: row.bio ?? null,
    avatar_url: row.avatarUrl ?? null,
    created_at: row.createdAt
      ? new Date(row.createdAt).toISOString()
      : "",
    last_seen_at: row.lastSeenAt
      ? new Date(row.lastSeenAt).toISOString()
      : "",
  };
}

// Public-safe mapper: intentionally omits email and password_hash
function mapDBPublicProfile(row: any): any {
  return {
    id: row.id,
    display_number: row.displayNumber,
    display_name: row.displayName,
    profile_type: row.profileType,
    username: row.username ?? null,
    bio: row.bio ?? null,
    avatar_url: row.avatarUrl ?? null,
    created_at: row.createdAt
      ? new Date(row.createdAt).toISOString()
      : "",
    last_seen_at: row.lastSeenAt
      ? new Date(row.lastSeenAt).toISOString()
      : "",
  };
}

function mapDBAgent(row: any): Agent {
  return {
    id: row.id,
    agent_name: row.agentName,
    agent_owner_label: row.agentOwnerLabel,
    agent_owner_contact: row.agentOwnerContact ?? null,
    agent_type: row.agentType ?? "assistant",
    status: normalizeAgentStatus(row.status),
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    description: row.description ?? null,
    homepage_url: row.homepageUrl ?? null,
    created_at: row.createdAt
      ? new Date(row.createdAt).toISOString().replace("T", " ").substring(0, 19)
      : "",
    last_seen_at: row.lastSeenAt
      ? new Date(row.lastSeenAt).toISOString().replace("T", " ").substring(0, 19)
      : null,
  };
}

function mapDBAgentAccessToken(
  row: any,
  agentName?: string | null,
  agentOwnerLabel?: string | null,
): AgentAccessToken {
  return {
    id: row.id,
    agent_id: row.agentId,
    agent_name: agentName ?? "Unknown Agent",
    agent_owner_label: agentOwnerLabel ?? "Unknown Owner",
    token_prefix: row.tokenPrefix,
    name: row.name ?? null,
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    status: row.status === "revoked" ? "revoked" : "active",
    created_at: row.createdAt
      ? new Date(row.createdAt).toISOString().replace("T", " ").substring(0, 19)
      : "",
    last_used_at: row.lastUsedAt
      ? new Date(row.lastUsedAt).toISOString().replace("T", " ").substring(0, 19)
      : null,
    revoked_at: row.revokedAt
      ? new Date(row.revokedAt).toISOString().replace("T", " ").substring(0, 19)
      : null,
  };
}

function generateAgentToken(): string {
  return `cva_live_${randomBytes(32).toString("base64url")}`;
}

function hashAgentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function ensureAgentShape(agent: any): Agent {
  return {
    id: agent.id ?? crypto.randomUUID(),
    agent_name: agent.agent_name ?? agent.agentName ?? "Unnamed Agent",
    agent_owner_label:
      agent.agent_owner_label ?? agent.agentOwnerLabel ?? "Unknown Owner",
    agent_owner_contact: agent.agent_owner_contact ?? agent.agentOwnerContact ?? null,
    agent_type: agent.agent_type ?? agent.agentType ?? "assistant",
    status: normalizeAgentStatus(agent.status),
    scopes: Array.isArray(agent.scopes) ? agent.scopes : [],
    description: agent.description ?? null,
    homepage_url: agent.homepage_url ?? agent.homepageUrl ?? null,
    created_at:
      agent.created_at ??
      agent.createdAt ??
      new Date().toISOString().replace("T", " ").substring(0, 19),
    last_seen_at: agent.last_seen_at ?? agent.lastSeenAt ?? null,
  };
}

function normalizeAgentStatus(status: string | undefined): Agent["status"] {
  if (status === "active" || status === "suspended") return status;
  return "pending";
}

function mapDBComment(row: any): any {
  return {
    id: row.id,
    content_id: row.contentId,
    author_id: row.authorId ?? null,
    author_display_name: row.authorDisplayName,
    actor_type: row.actorType === "ai_agent" ? "ai_agent" : "human",
    agent_id: row.agentId ?? null,
    body: row.body,
    status: normalizeCommentStatus(row.status),
    created_at: row.createdAt
      ? new Date(row.createdAt).toISOString().replace("T", " ").substring(0, 19)
      : "",
  };
}

function ensureCommentShape(comment: any): any {
  return {
    id: comment.id ?? comment.comment_id ?? crypto.randomUUID(),
    content_id: comment.content_id,
    author_id: comment.author_id ?? null,
    author_display_name: comment.author_display_name ?? DEFAULT_AUTHOR_NAME,
    actor_type: comment.actor_type === "ai_agent" ? "ai_agent" : "human",
    agent_id: comment.agent_id ?? null,
    body: comment.body ?? "",
    status: normalizeCommentStatus(comment.status),
    created_at:
      comment.created_at ??
      comment.timestamp ??
      new Date().toISOString().replace("T", " ").substring(0, 19),
  };
}

function normalizeCommentStatus(status: string | undefined): string {
  if (status === "pending" || status === "hidden") return status;
  return "visible";
}

function buildCommentStats(comments: any[]): CommentStats {
  return {
    totalComments: comments.length,
    humanComments: comments.filter((comment) => comment.actor_type === "human").length,
    aiAgentComments: comments.filter((comment) => comment.actor_type === "ai_agent").length,
    visibleComments: comments.filter((comment) => comment.status === "visible").length,
    pendingHiddenComments: comments.filter(
      (comment) => comment.status === "pending" || comment.status === "hidden",
    ).length,
  };
}

function formatCoViewerName(displayNumber: number): string {
  return `CoViewer-${String(displayNumber).padStart(4, "0")}`;
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
