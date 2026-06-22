## Why

The app currently keeps todos in ephemeral React `useState` (`apps/web/src/routes/todos.tsx`) — nothing survives a reload, and there is no concept of a user. To become a real MVP we need persistent, per-user data. We are committing to a Cloudflare-deployed stack (TanStack Start on Workers + D1 + Drizzle) with Better Auth providing **anonymous-first** sign-in (zero-friction start) that can upgrade to email/password.

> **Scope note:** This MVP is intentionally **cloud-backed and online-dependent**. The offline-first / local-first engine described in `docs/02-capabilities.md` (C1) is explicitly deferred to a later phase. Anonymous auth preserves the "use it without signing up" feel, but data lives in D1, not on-device.

## What Changes

- Add **Better Auth** to the TanStack Start server with two methods: **anonymous** (auto guest account on first visit) and **email/password** (upgrade/link path).
- Add **Drizzle ORM** over **Cloudflare D1** as the persistence layer, in a new `packages/db` workspace package (schema + client factory).
- Mount auth via a catch-all API route (`/api/auth/$`) that forwards to a **per-request** `createAuth(env)` factory (Workers bindings are request-scoped).
- Expose a `getSession` server function and wire the session into the router context so routes can read `user` and guard access.
- Migrate the `/todos` route off in-memory `useState` onto Drizzle-backed server functions, scoping todos to the current user (anonymous or registered).
- Add Cloudflare deployment config: `wrangler.jsonc` (D1 binding, `nodejs_compat`), Nitro `cloudflare-module` preset, and a D1 migration workflow (`drizzle-kit generate` → `wrangler d1 migrations apply`).
- Add required env/secrets: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

## Capabilities

### New Capabilities

- `authentication`: Anonymous-first identity, email/password sign-up/sign-in, sign-out, session retrieval, and route protection.
- `data-persistence`: Per-user todos persisted in D1 via Drizzle through server functions, surviving reloads and scoped to the session's user.

### Modified Capabilities

<!-- None — no existing specs in openspec/specs/ yet. -->

## Impact

- **New dependencies:** `better-auth`, `drizzle-orm`, `drizzle-kit` (dev), `wrangler` (dev), `@cloudflare/vite-plugin`. Expect catalog pins to satisfy vite-plus's minimum-release-age guardrail (same pattern as the existing `nanoid` pin).
- **New package:** `packages/db` (Drizzle schema + `createDb(env)` client factory).
- **Modified:** `apps/web` — new `/api/auth/$` route, `src/server/auth.ts` (`createAuth` factory), `src/server/session.ts` (`getSession` server fn), `__root.tsx`/router context for session, `todos.tsx` rewired to server functions; `vite.config.ts` (Cloudflare plugin), new `wrangler.jsonc`, `.env`/secrets, `drizzle.config.ts`.
- **Runtime shift:** dev and prod now run on the Workers runtime (Miniflare locally), not plain Node — native Node modules are unavailable; D1 bindings are request-scoped.
- **Docs:** update `docs/02-capabilities.md` sequencing note to reflect cloud-backed MVP (offline-first deferred).
