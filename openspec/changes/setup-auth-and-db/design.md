## Context

`apps/web` is a TanStack Start (React 19, SSR) app in a pnpm + vite-plus monorepo; `packages/todo-list-core` holds pure domain logic. Todos today live only in React `useState`. We are adding authentication and persistence and committing to **Cloudflare** as the deployment target.

Cloudflare Workers is not a Node server. This drives almost every decision below:

- The D1 binding (`env.DB`) exists **only inside a request**, not at module load.
- Native Node modules (e.g. `better-sqlite3`) are unavailable; `nodejs_compat` is required for the Node APIs Drizzle/crypto need.
- Background work after the response must be registered with `ctx.waitUntil` or the isolate is killed.

Decisions are grounded in current (2026) guidance: [TanStack Start on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/), [Drizzle + D1](https://orm.drizzle.team/docs/connect-cloudflare-d1), [Better Auth 1.5 (native D1)](https://better-auth.com/blog/1-5), and the [Better Auth + Cloudflare Workers integration notes](https://github.com/better-auth/better-auth/discussions/7963).

## Goals / Non-Goals

**Goals:**

- Anonymous-first auth with an email/password upgrade path, via Better Auth.
- Per-user todos persisted in D1 through Drizzle and server functions.
- A correct Workers wiring pattern (per-request `db`/auth, `waitUntil`, `nodejs_compat`).
- A repeatable migration workflow that works locally (Miniflare) and in production.
- Clean monorepo placement (`packages/db`) consistent with `todo-list-core`.

**Non-Goals:**

- Offline-first / local-first sync (deferred — see `docs/02-capabilities.md` C1).
- OAuth/social providers, email verification, password reset (later).
- Multi-device conflict resolution, time-tracking, collections, calendar views.
- Teams / sharing.

## Decisions

### D1: Database = Cloudflare D1 via Drizzle (`drizzle-orm/d1`)

**Why:** D1 is SQLite, co-located with the Worker, free-tier friendly, and the native Cloudflare choice. Drizzle's D1 driver keeps schema/queries portable if we later move to Postgres/Hyperdrive.
**Alternatives:** libSQL/Turso (viable, but D1 is more native to the chosen platform); Neon Postgres (needs Hyperdrive for pooling, heavier than the MVP warrants).

### D2: `db` and auth are created **per request**, never at module scope

**Why:** The D1 binding only exists on the request `env`. A module-level `betterAuth({...})` or `drizzle(process.env...)` works on Node but **breaks on Workers**.
**Approach:** `createDb(env)` returns a Drizzle instance from `env.DB`; `createAuth(env, ctx)` builds the Better Auth instance from that db. Resolve `env`/`ctx` once per request and pass the instances down (store on request context); do **not** create a second Drizzle wrapper around the same binding.
**Trade-off:** Slightly more plumbing than a global singleton, but it is the only correct pattern on Workers.

### D3: Better Auth wiring = catch-all API route + Drizzle adapter

**Why:** Better Auth exposes `auth.handler(request) → Response`. The idiomatic TanStack Start mount is a server route `apps/web/src/routes/api/auth/$.ts` whose `GET`/`POST` call `createAuth(env, ctx).handler(request)`.
**Adapter:** `drizzleAdapter(createDb(env), { provider: "sqlite" })`. (Better Auth 1.5 can also take a raw D1 binding, but we use the Drizzle adapter so auth tables and app tables share one ORM/migration workflow.)
**Plugins:** `emailAndPassword: { enabled: true }` + `anonymous()` plugin.

### D4: `ctx.waitUntil` is passed to Better Auth

**Why:** Better Auth performs session/token writes _after_ sending the response. On Workers, without `waitUntil` the isolate exits early → intermittent "Network connection lost" / lost session writes.

### D5: Session reaches the router via a `getSession` server function + `beforeLoad`

**Why:** Routes need `user` for guards and UI. `getSession` calls `auth.api.getSession({ headers })` server-side; `__root` `beforeLoad` puts the result in router context; protected routes check it and `redirect()`.

### D6: Schema + client live in a new `packages/db` package

**Why:** Mirrors the `todo-list-core` split — shared data layer, not app-specific. Holds Drizzle schema (auth tables + `todos`) and `createDb(env)`. The Better Auth _instance_ stays in `apps/web/src/server/auth.ts` because it needs app env, the API route, and `waitUntil`.

### D7: Migration workflow = drizzle-kit generate → wrangler d1 migrations apply

**Why:** Versioned, reviewable SQL that applies identically to local Miniflare D1 and production. Auth tables are generated once via the Better Auth CLI (`@better-auth/cli generate`) into the Drizzle schema, then maintained with the same drizzle-kit flow.
**Note:** The Better Auth CLI cannot read a live Workers binding; point it at the Drizzle schema/config (or a local sqlite file) for generation only — not at runtime D1.

### D8: Deployment config

`wrangler.jsonc` with a `DB` D1 binding (+ `migrations_dir`), `compatibility_flags: ["nodejs_compat"]`; Nitro preset `cloudflare-module`; `@cloudflare/vite-plugin` added in `vite.config.ts` alongside the existing `tanstackStart()`/`viteReact()`/`tailwindcss()` plugins. Secrets `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` via `.env` (dev) and `wrangler secret` (prod).

## Risks / Trade-offs

- **vite-plus minimum-release-age guardrail** → new deps (`better-auth`, `drizzle-orm`, `drizzle-kit`, `@cloudflare/vite-plugin`, `wrangler`) may be blocked if freshly published. **Mitigation:** add catalog pins, same pattern as the existing `nanoid: 3.3.11` override.
- **Local-dev double-Drizzle write lock** → two Drizzle wrappers around the same local D1 binding deadlock on SQLite's single-writer WAL. **Mitigation:** exactly one `createDb` per request, shared via context (D2).
- **Module-scope binding access** → easy to accidentally write Node-style globals that crash only on Workers. **Mitigation:** lint/review for any top-level `env`/`db` use; keep factories the only construction path.
- **Missing `waitUntil`** → flaky session writes. **Mitigation:** wire it in D4 and add a smoke test for session persistence.
- **MVP is online-only** → contradicts the original offline-first vision doc. **Mitigation:** update `docs/02-capabilities.md` sequencing note; treat offline as an explicit later change.
- **Windows + Miniflare/wrangler** → occasional path/native quirks. **Mitigation:** rely on wrangler's bundled workerd (no node-gyp), verify `pnpm wrangler dev` early.

## Migration Plan

1. Land `packages/db` (schema + `createDb`) with no app wiring — verify it builds.
2. Add deps + catalog pins; confirm vite-plus accepts them.
3. Add Cloudflare config (`wrangler.jsonc`, Nitro preset, vite plugin); verify `wrangler dev` boots the app.
4. Generate auth schema + initial migration; apply to local D1; confirm tables.
5. Wire `createAuth`, `/api/auth/$`, `getSession`, router context; verify anonymous session + email/password.
6. Rewire `/todos` to server functions; verify persistence + per-user isolation.
7. Provision production D1, set secrets, apply migrations, deploy.

**Rollback:** the change is additive and pre-launch; revert by removing the new route/config and pointing `/todos` back at the in-memory implementation. No user data to preserve yet.

## Open Questions

- Minimum password policy for the MVP (length only, or more)?
- Do we want email verification before "registered" status, or defer entirely? (Currently deferred.)
- Should `packages/todo-list-core` pure functions be reused server-side over Drizzle rows, or do server functions own their own logic? (Lean: reuse core for validation/derivations.)
- Production secret management: `wrangler secret` only, or a `.dev.vars` + CI flow?
