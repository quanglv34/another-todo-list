/**
 * Cloudflare D1 client factory.
 *
 * The D1 binding only exists on the per-request `env`, never at module scope,
 * so we never construct a Drizzle instance at import time. Call `createDb(env)`
 * once per request and pass the result down — creating a second wrapper around
 * the same binding risks SQLite single-writer lock contention locally.
 */
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.ts";

/** Minimal shape of the Worker `env` this package needs: just the D1 binding. */
export interface DbEnv {
  DB: D1Database;
}

export function createDb(env: DbEnv) {
  return drizzle(env.DB, { schema });
}

export type Database = ReturnType<typeof createDb>;
