import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env, waitUntil } from "cloudflare:workers";
import { createAuth, type Auth } from "#/server/auth";

/** The resolved session payload Better Auth returns (or null when signed out). */
export type SessionPayload = Awaited<ReturnType<Auth["api"]["getSession"]>>;
export type SessionUser = NonNullable<SessionPayload>["user"];

/**
 * Read the current session from the request cookies. Constructs the auth
 * instance from the request-scoped `env` inside the handler (never at module
 * scope — Turso credentials only exist per request).
 */
export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionPayload> => {
    const auth = createAuth(env);
    const result = await auth.api.getSession({ headers: getRequestHeaders() });
    // Better Auth may extend the session lifetime with a background write after
    // returning; keep the isolate alive until it settles.
    waitUntil(Promise.resolve(result));
    return result;
  },
);

/**
 * Server-side guard: resolve the current user or throw if there is none.
 *
 * Delegates to the `getSession` server function rather than calling the
 * server-only `getRequestHeaders()` directly. That keeps every server-only
 * import (`getRequestHeaders`, `cloudflare:workers`) confined to the
 * `createServerFn` handler above, so TanStack Start can strip them from the
 * client bundle — this module is reachable from `__root.tsx`.
 */
export async function requireUser(): Promise<SessionUser> {
  const result = await getSession();
  if (!result?.user) {
    throw new Error("Unauthorized");
  }
  return result.user;
}
