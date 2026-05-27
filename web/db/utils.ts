import * as fs from "fs";
import * as path from "path";
import { inspect } from "util";
import type { PoolConfig } from "pg";

export function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function getDatabaseUrl(): string | undefined {
  loadEnvLocal();
  return process.env.DATABASE_URL;
}

export function getSslConfigForDatabaseUrl(databaseUrl: string): PoolConfig["ssl"] {
  const lowerUrl = databaseUrl.toLowerCase();
  const isLocalDatabase =
    lowerUrl.includes("@localhost:") ||
    lowerUrl.includes("@127.0.0.1:") ||
    lowerUrl.includes("@[::1]:");
  const requiresSsl =
    lowerUrl.includes("sslmode=require") ||
    lowerUrl.includes("supabase.com") ||
    lowerUrl.includes("pooler.supabase.com");

  if (isLocalDatabase || !requiresSsl) {
    return undefined;
  }

  return { rejectUnauthorized: false };
}

export function getPgPoolConfig(
  databaseUrl: string | undefined = getDatabaseUrl(),
  max = 1,
): PoolConfig {
  const url = databaseUrl ?? "";
  const ssl = getSslConfigForDatabaseUrl(url);
  return {
    connectionString: ssl ? removeSslMode(url) : url,
    max,
    ssl,
    connectionTimeoutMillis: 5000,
  };
}

function removeSslMode(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export function logDatabaseError(label: string, err: unknown): void {
  console.error(label);

  if (err instanceof Error) {
    console.error("name:", err.name);
    console.error("message:", err.message || "(empty message)");
    if (err.stack) console.error("stack:", err.stack);
    if ("cause" in err) {
      console.error("cause:", inspect(err.cause, { depth: 5 }));
    }
  }

  if (err && typeof err === "object") {
    const pgError = err as Record<string, unknown>;
    for (const key of [
      "code",
      "severity",
      "detail",
      "hint",
      "position",
      "schema",
      "table",
      "column",
      "constraint",
      "routine",
    ]) {
      if (pgError[key]) {
        console.error(`${key}:`, pgError[key]);
      }
    }
  }

  console.error("raw:", inspect(err, { depth: 8 }));
}
