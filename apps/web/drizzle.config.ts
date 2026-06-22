import { defineConfig } from "drizzle-kit";

/**
 * Migration generation only. We generate versioned SQL from the Drizzle schema
 * here and apply it with `wrangler d1 migrations apply` (local Miniflare and
 * production), so no runtime D1 credentials are needed in this config. `out`
 * matches `migrations_dir` in wrangler.jsonc.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "../../packages/db/src/schema.ts",
  out: "./drizzle",
});
