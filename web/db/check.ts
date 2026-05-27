/**
 * PostgreSQL connection check.
 * Run with: npx tsx db/check.ts
 */
import { Pool } from "pg";
import { getDatabaseUrl, logDatabaseError } from "./utils";

const DATABASE_URL = getDatabaseUrl();

async function main() {
  console.log("Checking PostgreSQL connection...");
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });

  try {
    const result = await pool.query<{
      database_name: string;
      user_name: string;
      server_version: string;
    }>(
      `
      SELECT
        current_database() AS database_name,
        current_user AS user_name,
        version() AS server_version
      `,
    );
    const row = result.rows[0];
    console.log("Connection OK.");
    console.log("database:", row.database_name);
    console.log("user:", row.user_name);
    console.log("server:", row.server_version);
  } catch (err: unknown) {
    logDatabaseError("Connection check failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
