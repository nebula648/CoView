import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./db/utils";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl()!,
  },
});
