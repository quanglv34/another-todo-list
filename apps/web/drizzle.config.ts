import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for Turso / libSQL.
 *
 * Uses environment variables for the Turso connection so migrations can be
 * applied against both local (`file:` URL) and remote databases without
 * changing this file.
 */
export default defineConfig({
  dialect: "turso",
  schema: "../../packages/db/src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
