import { account, createDb, session, todos, user, verification } from "@workspace/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins/anonymous";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { eq } from "drizzle-orm";

/**
 * The slice of the Worker `env` Better Auth needs. Resolved per request from
 * `cloudflare:workers` — never at module scope (the D1 binding does not exist
 * until a request is in flight). See `getAuth()`.
 */
export interface AuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

/**
 * Build a Better Auth instance from a request-scoped `env`.
 *
 * - Drizzle adapter over the same D1 client (`createDb`) the app uses, so auth
 *   tables and app tables share one ORM and migration workflow.
 * - `anonymous()` gives every visitor a guest account on first interaction.
 * - `emailAndPassword` enables registration / sign-in and the anon→registered
 *   upgrade path.
 * - `tanstackStartCookies()` MUST be last so it can wrap the other plugins'
 *   responses and propagate Set-Cookie through TanStack Start.
 *
 * Background session/token writes are extended via the `waitUntil` imported
 * from `cloudflare:workers` (see `session.ts`), which keeps the isolate alive
 * until they settle — the modern replacement for threading `ctx.waitUntil`.
 */
export function createAuth(env: AuthEnv) {
  const db = createDb(env);
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    plugins: [
      anonymous({
        // When an anonymous visitor registers, Better Auth links and then
        // deletes the anonymous user. `todos.user_id` cascades on that delete,
        // so reassign the anonymous user's todos to the new account here
        // (before deletion) to retain their data through the upgrade.
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await db
            .update(todos)
            .set({ userId: newUser.user.id })
            .where(eq(todos.userId, anonymousUser.user.id));
        },
      }),
      tanstackStartCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
