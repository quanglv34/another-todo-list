import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { createAuth } from "#/server/auth";

/**
 * Catch-all mount for Better Auth. Every `/api/auth/*` request is forwarded to
 * the per-request auth handler, which constructs its D1-backed instance from
 * the request-scoped `env`.
 */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => createAuth(env).handler(request),
      POST: ({ request }) => createAuth(env).handler(request),
    },
  },
});
