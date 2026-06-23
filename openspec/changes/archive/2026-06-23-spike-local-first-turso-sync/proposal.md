## Why

The product's core differentiator (C1 — offline-first sync, `docs/02-capabilities.md`) requires inverting today's **server-mediated** data path (browser → `todos.ts` server functions → one shared Turso DB) into a **local-first** one (browser WASM SQLite as source of truth → `push`/`pull` direct to a per-user Turso edge DB). That inversion moves write invariants off the server and bets the architecture on two unproven assumptions: that `@tursodatabase/sync` is viable **in the browser today**, and that **database-per-user** is operable within real Turso plan limits. We validate both with throwaway spikes and a documented go/no-go **before** any application code moves.

> **Scope note:** This change is **investigation only — no application code changes.** `todos.ts`, `auth.ts`, the schema, and the write path are untouched. The deliverable is a reference PoC plus a decision record. The actual write-path rewrite is a separate, later change gated on a "go" from here.

## What Changes

- Add a throwaway **browser PoC** (under a scratch/spike location, not wired into `apps/web`) that initializes WASM SQLite via `@tursodatabase/sync`, runs `push()`/`pull()` against a per-user Turso DB, and exercises the **silent token-refresh loop** (freeze queue → refresh scoped token → reinitialize → retry) on an auth rejection.
- Validate the **per-user database lifecycle**: provision-on-sync-opt-in, deprovision-on-delete, and the one-time **seed-push** that replaces the current anonymous→registered row-reassignment.
- Document the **real numbers** behind Turso's "unlimited DB" claim on the Developer Plan: DB-creation rate caps, active-DB ceiling, and per-DB provisioning latency.
- Record the four locked architecture decisions (database-per-user; auth tables remain the control plane; sync-opt-in provisioning; LWW within a single user's DB) and produce a **go/no-go recommendation** with an explicit **fallback to Option B** (shared DB + partial-sync filters) if either spike fails.
- **Explicitly out of scope (deferred to later changes):** the `todos` write-path rewrite, multi-region Turso groups (handoff Task C), CDC/analytics pipeline, and automated schema-propagation tooling.

## Capabilities

### New Capabilities

- `local-first-sync-validation`: A gated feasibility investigation that produces (a) a working browser PoC of WASM-SQLite sync with scoped per-user tokens and silent refresh, (b) a documented per-user DB lifecycle and Turso plan-limit findings, and (c) a go/no-go decision record with a defined Option-B fallback.

### Modified Capabilities

<!-- None. This change adds no requirements to the existing `authentication` or
     `data-persistence` capabilities and changes no production behavior; it only
     validates a future architecture. Any spec changes to those capabilities are
     deferred to the follow-up implementation change. -->

## Impact

- **No production code touched.** `apps/web/src/server/todos.ts`, `auth.ts`, `session.ts`, and `packages/db` schema are unchanged by this change.
- **New throwaway artifacts:** a spike PoC (scratch/spike directory) and a written decision record in this change's `design.md` / a findings doc. The PoC is removed or archived once the decision is made — it is not a maintained part of the app.
- **New external dependencies (spike-local only, not added to `apps/web`):** `@tursodatabase/sync` and the Turso CLI for provisioning experiments.
- **Accounts/infra:** requires a Turso account on the Developer Plan and CLI access to provision/deprovision throwaway per-user databases during the spike.
- **Downstream gating:** a "go" unlocks a follow-up change that rewrites the `todos` write path, relocates domain invariants (`todo-list-core` trim/reject-empty) to client + DB `CHECK` constraints, and defines the SSR-hydration story. A "no-go" pivots that follow-up to Option B.
