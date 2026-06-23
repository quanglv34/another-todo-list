/**
 * Turso / libSQL client factory.
 *
 * Connection credentials are passed per-request through the Worker `env` object
 * (never at module scope) so the same `createDb(env)` call-site used with D1
 * keeps working — only the shape of `DbEnv` changed.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.ts";

/** Environment variables required to connect to Turso. */
export interface DbEnv {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
}

export function createDb(env: DbEnv) {
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
