## Context

Today the app is **server-mediated**: the browser calls `createServerFn` RPCs in `apps/web/src/server/todos.ts`, which enforce domain invariants (`buildTodo` trim/reject-empty from `todo-list-core`) and ownership (`and(eq(todos.id), eq(todos.userId))`) before writing to a **single shared Turso database** through Drizzle. Auth tables (`user/session/account/verification`) live in that same Turso DB via the Better Auth Drizzle adapter (`apps/web/src/server/auth.ts`). The anonymous→registered upgrade is one statement in one DB: `UPDATE todos SET user_id = newUser WHERE user_id = anonUser`.

The C1 capability (`docs/02-capabilities.md`) calls for **local-first** as the differentiator and paywall: data is local first, sync is an optional paid layer, and free/local users keep data on-device. The handoff proposes inverting the data path to local WASM SQLite syncing directly to Turso edge, and the team has chosen **database-per-user** (Option A) for isolation.

This change does **not** build that. It validates whether the inversion is feasible before any production code moves. It exists because two assumptions are load-bearing and unproven: `@tursodatabase/sync` running in the browser, and database-per-user being operable within Turso plan limits.

## Goals / Non-Goals

**Goals:**

- Prove (or disprove) that WASM SQLite + `@tursodatabase/sync` `push`/`pull` works **in the browser** today, with scoped per-user tokens validated at the edge and a working silent-refresh loop.
- Prove (or disprove) that the **per-user DB lifecycle** (provision-on-sync-opt-in, seed-push, deprovision-on-delete) is operable, and document **real Turso Developer-Plan limits**.
- Produce a **go/no-go decision record** with a defined Option-B fallback, so the follow-up implementation change has a path either way.

**Non-Goals:**

- No changes to `todos.ts`, `auth.ts`, `session.ts`, `packages/db` schema, or any production code.
- No multi-region Turso groups (handoff Task C), no CDC/analytics pipeline, no automated schema-propagation tooling.
- No relocation of domain invariants or SSR-hydration design — those belong to the gated follow-up change.
- Not a tenant row-isolation matrix: under database-per-user there is no shared DB, so handoff Task B's cross-tenant collision concern is moot by construction (see Decisions).

## Decisions

### Decision 1: Database-per-user (Option A), not a shared DB with partial-sync filters

Per the team's choice. Each syncing user gets a physically separate Turso database, giving an absolute data boundary and simpler token scoping (a token grants access to exactly one DB, with no row-level allow-claims to get wrong).

- **Consequence:** Handoff **Task B ("Conflict Resolution & Row Isolation Matrix") largely evaporates.** With no shared DB there is no cross-user collision to defend against; the only remaining conflict surface is **one user editing on multiple devices**, resolved by last-write-wins (LWW) inside that user's own DB. The spike validates single-user multi-device LWW, not tenant isolation.
- **Alternative considered — Option B (shared DB + partial-sync filters):** trivially enables future cross-user collaboration and global aggregate queries, but relies on logical token-claim filtering where one mistake leaks data across users. Retained only as the **NO-GO fallback**.

### Decision 2: The existing Turso auth DB is the control plane — do not add D1 or Postgres

The handoff lists the control plane as "Cloudflare D1 or centralized PostgreSQL," but Better Auth already stores identity in Turso via Drizzle (`auth.ts:40-43`). That **is** the control plane. The split is: **auth/identity tables stay where they are; only `todos` (application data) peels out into per-user data-plane DBs.** Introducing D1/Postgres would add a dependency we don't need.

- **Alternative considered — new D1/Postgres control plane:** rejected; pure migration cost with no benefit for this app's scale.

### Decision 3: Provision a data-plane DB only on sync opt-in

Auth is anonymous-first — every visitor (including bots/crawlers) gets an account on first interaction. Provisioning a Turso DB per anonymous visitor (the literal handoff reading) creates a provisioning storm and a cleanup burden. Instead, **anonymous/free users stay local-WASM-only with no Turso DB**, exactly as C1 specifies ("data stays on-device for free/local users"). A per-user DB is provisioned **only when a user enables sync**.

- **Consequence:** The anonymous→registered upgrade stops being a cross-DB row migration. It becomes a **one-time seed-push** of the client's local rows into a freshly provisioned empty DB — strictly simpler, and aligned with the paywall (infrastructure exists only where revenue does).
- **Alternatives considered:** _provision on every registration_ (pay for a DB per registered user who may never sync); _provision per visitor_ (the storm). Both rejected.

### Decision 4: LWW within a single user's DB is the conflict model

Given Decision 1, conflict resolution is scoped to one user's devices. The spike confirms LWW behavior is predictable and lossless across a user's own offline edits on two clients — the C1 acceptance signal ("pull the network mid-edit on two devices → no data loss, predictable merge").

### Decision 5: Throwaway PoC, isolated from `apps/web`

The PoC lives in a scratch/spike location and is removed or archived once the decision is recorded. `@tursodatabase/sync` and the Turso CLI are spike-local, **not** added to `apps/web` dependencies. This keeps the production build and dependency surface untouched while the architecture is unproven.

## Risks / Trade-offs

- **`@tursodatabase/sync` browser maturity is unknown** → This is the primary gate (Spike 1). Embedded replicas historically needed a local file; the browser WASM offline-sync path is newer. If it is not production-viable, the change halts at NO-GO before any app code moves — which is the entire point of doing this as a spike.
- **"Unlimited" databases may hide real caps** → Spike 2 measures creation-rate caps, active-DB ceiling, and provisioning latency. Sync-opt-in provisioning (Decision 3) already shrinks the blast radius by removing per-anonymous-visitor DBs.
- **Invariants currently enforced server-side would move off the server in the real build** → Out of scope here, but flagged: a GO obliges the follow-up change to re-home `todo-list-core`'s trim/reject-empty rules to the client plus DB `CHECK`/`NOT NULL` constraints, and to design the SSR-hydration story for `/todos`. The decision record must call this out as follow-up cost so a GO is not mistaken for "done."
- **Spike code rotting into the app** → Mitigated by Decision 5: the PoC is throwaway and dependency-isolated; it is deleted/archived at decision time.
- **A GO is conditional, not absolute** → The decision record states GO/NO-GO _with evidence_; a GO still leaves the write-path rewrite, invariant relocation, and hydration design as explicit, separately-scoped follow-up work.

## Migration Plan

No production migration — no production code changes. Teardown for the spike: deprovision all throwaway per-user Turso databases created during Spike 2 via the Turso CLI, and remove/archive the PoC directory once `design.md`'s decision section (or a linked findings doc) records GO/NO-GO. A GO opens a new change for the write-path rewrite; a NO-GO opens a new change scoped to Option B.

## Open Questions

- Where does the scoped-token minting endpoint live in the real build — a new `/api/refresh-session` server route reusing the Better Auth session, or folded into existing session handling? (Resolve in the follow-up change, but the PoC should mint tokens in a shape that maps cleanly onto a Better Auth session check.)
- Does `@tursodatabase/sync`'s `pull()` apply DDL (schema changes) cleanly to an offline client holding an older schema, given the "new columns must be nullable or DEFAULT" rule? (Probe opportunistically in Spike 1; full schema-propagation automation is deferred.)
- What is the deprovisioning trigger in production — Better Auth account-deletion hook, or a reaper job? (Decide in follow-up; Spike 2 only proves teardown is possible.)
