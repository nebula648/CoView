import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { getPgPoolConfig } from "@/db/utils";

let dbInstance: NodePgDatabase<typeof schema> | null = null;
let initError: string | null = null;

export function getDB(): NodePgDatabase<typeof schema> | null {
  if (initError) return null;
  if (dbInstance) return dbInstance;

  const url = process.env.DATABASE_URL;
  if (!url) {
    initError = "DATABASE_URL not set";
    return null;
  }

  try {
    const pool = new Pool(getPgPoolConfig(url, 5));
    dbInstance = drizzle(pool, { schema });
    return dbInstance;
  } catch (e: any) {
    initError = e.message ?? "Unknown DB init error";
    return null;
  }
}

export function hasDB(): boolean {
  return getDB() !== null;
}

export { schema };
