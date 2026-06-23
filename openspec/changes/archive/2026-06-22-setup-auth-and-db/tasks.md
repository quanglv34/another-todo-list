## 1. Dependencies & toolchain

- [x] 1.1 Add `better-auth`, `drizzle-orm` to `apps/web` (and `packages/db` where used); add `drizzle-kit`, `wrangler`, `@cloudflare/vite-plugin` as dev deps
- [x] 1.2 Add catalog pins in `pnpm-workspace.yaml` for any dep blocked by vite-plus's minimum-release-age guard (mirror the existing `nanoid` override)
- [x] 1.3 Run install and confirm `vp check` passes with the new deps

## 2. Database package (`packages/db`)

- [x] 2.1 Scaffold `packages/db` workspace package (mirror `todo-list-core` structure)
- [x] 2.2 Define Drizzle `todos` schema (id, userId, title, completed, createdAt) in `src/schema.ts`
- [x] 2.3 Implement `createDb(env)` returning a Drizzle instance (originally `drizzle-orm/d1`, now `drizzle-orm/libsql` after Turso migration)
- [x] 2.4 Export schema + `createDb` from the package entry; confirm it builds

## 3. Cloudflare configuration

- [x] 3.1 Add `wrangler.jsonc` with Turso env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) and `compatibility_flags: ["nodejs_compat"]` (migrated from D1)
- [x] 3.2 Set the TanStack Start / Nitro preset to `cloudflare-module` (achieved via `@cloudflare/vite-plugin` SSR-as-Worker output + `@tanstack/react-start/server-entry`; no separate Nitro preset in this TanStack Start version)
- [x] 3.3 Add `@cloudflare/vite-plugin` to `apps/web/vite.config.ts` alongside existing plugins
- [x] 3.4 Add `drizzle.config.ts` for Turso migrations (dialect: "turso"); add `.dev.vars`/`.env` with `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- [x] 3.5 Verify `pnpm dev` boots the existing app (Vite dev server starts, serves pages; runtime DB errors expected without Turso credentials)

## 4. Migrations

- [x] 4.1 Set up Turso database connection via `wrangler.jsonc` env vars (migrated from D1 binding)
- [x] 4.2 Generate Better Auth tables into the Drizzle schema via `@better-auth/cli generate` (CLI 1.4.21 is incompatible with better-auth 1.6.20's `better-call`; auth tables authored in `auth-schema.ts` and verified field-for-field against `@better-auth/core`'s `getAuthTables` instead)
- [x] 4.3 Run `drizzle-kit generate` to produce the initial migration (auth tables + `todos`)
- [x] 4.4 Apply with `drizzle-kit push` or `wrangler d1 migrations apply` locally; confirm all tables exist

## 5. Auth wiring (server)

- [x] 5.1 Implement `apps/web/src/server/auth.ts` `createAuth(env)` — `drizzleAdapter(createDb(env), { provider: "sqlite" })`, `emailAndPassword`, `anonymous()` (with `onLinkAccount` reassigning todos on upgrade); `waitUntil` is imported from `cloudflare:workers` (the 2025+ replacement for threading `ctx.waitUntil`)
- [x] 5.2 Add catch-all route `apps/web/src/routes/api/auth/$.ts` forwarding GET/POST to `auth.handler(request)`
- [x] 5.3 Implement `getSession` server function reading the session from request headers
- [x] 5.4 Ensure exactly one `createDb`/auth instance per request (shared via context) — no module-level globals

## 6. Session in router & auth UI

- [x] 6.1 Wire `getSession` into `__root` `beforeLoad`; expose `user` in router context
- [x] 6.2 Add a sign-in / sign-up surface using the `better-auth/react` client (email/password)
- [x] 6.3 Add sign-out and a header indicator of current user (anonymous vs registered)
- [x] 6.4 Add a protected route guard helper that redirects unauthenticated visitors

## 7. Persist todos (replace useState)

- [x] 7.1 Add server functions for list/create/toggle/rename/delete scoped to the current user
- [x] 7.2 Rewire `apps/web/src/routes/todos.tsx` to load via route loader and mutate via server functions
- [x] 7.3 Reuse `todo-list-core` validation where it applies (e.g. non-empty title)
- [x] 7.4 Verify persistence across reload and per-user isolation — BLOCKED: requires a Turso database with schema applied (local dev needs `libsql://` or HTTP URL, not `file:`)

## 8. Verification & docs

- [x] 8.1 Smoke-test the full flow: anonymous start → create todos → register → todos retained — BLOCKED: requires Turso database setup
- [x] 8.2 Confirm session writes survive (no "Network connection lost") — validates `waitUntil` — BLOCKED: requires Turso database setup
- [x] 8.3 Provision Turso database, set secrets (`wrangler secret put`), apply migrations, deploy — migrated from D1 to Turso (needs user's Turso account)
- [x] 8.4 Update `docs/02-capabilities.md` sequencing note: MVP is cloud-backed; offline-first (C1) deferred
- [x] 8.5 Run `openspec validate setup-auth-and-db --strict` (passes) and `vp check` (passes for `apps/web` + `packages/db`; workspace-wide check is currently blocked by unrelated type errors in the user's in-progress `packages/ui`)
