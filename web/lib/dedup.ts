import { createHash } from "crypto";
import { readEvents } from "./data-source";

export function hashUA(userAgent: string): string {
  return createHash("sha256").update(userAgent).digest("hex").substring(0, 16);
}

export function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").substring(0, 16);
}

export function shouldCountHumanView(
  sessionId: string,
  contentId: string,
): boolean {
  const events = readEvents();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  const duplicate = events.find(
    (e: any) =>
      e.event_type === "human_view" &&
      e.content_id === contentId &&
      e.session_id === sessionId &&
      e.timestamp >= since,
  );
  return !duplicate;
}

export function shouldCountAiAgentView(
  userAgentHash: string,
  ipHash: string,
  contentId: string,
): boolean {
  const events = readEvents();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  const duplicate = events.find(
    (e: any) =>
      e.event_type === "ai_agent_view" &&
      e.content_id === contentId &&
      e.user_agent_hash === userAgentHash &&
      e.ip_hash === ipHash &&
      e.timestamp >= since,
  );
  return !duplicate;
}
