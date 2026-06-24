# Findings — spike-local-first-turso-sync

Results from real runs on 2026-06-23 against a live Turso edge. The one item
not yet executed (live in-browser OPFS round-trip) is marked **OPEN** — every
other result below is observed evidence, not a guess.

## Environment

- `@tursodatabase/sync` (native) version run: **0.6.1**
- `@tursodatabase/sync-wasm` (browser) version: **0.6.1** (the actual browser pkg)
- Turso plan: **starter** (org `personal`, user `quanglv34`) — _not_ the
  Developer Plan the handoff assumed. DB limit **100**, 5 GB storage, 3 GB
  embedded-sync bandwidth/mo, 1 group, 3 locations. Region: `aws-ap-south-1`.
- Runtime for Node harnesses: Node v23.9.0, macOS arm64. Browser: **not yet run**.

## Established from the API + package internals (verified, no GUI needed)

- `connect({ path, url, authToken, transform, fetch, partialSyncExperimental })`
  → `Database` with `push/pull/exec/prepare/stats/transaction/close`. **Same API
  in native and wasm builds** — harness logic ports with only the import changed.
- **CORRECTION TO HANDOFF:** the handoff says use `@tursodatabase/sync` in the
  browser. That package is **native-only** — it loads a per-platform `.node`
  N-API addon (`sync.darwin-arm64.node`) and ships **no `.wasm`** (true even in
  `0.7.0-pre.10`). The browser build is a **separate** package:
  **`@tursodatabase/sync-wasm`** (ships `sync.wasm32-wasi.wasm`, OPFS + Web
  Worker, `:memory:` fallback). An even-earlier `@tursodatabase/sync-browser`
  exists at `0.1.5-pre.2` (less mature — avoid).
- **Sync-opt-in is a native primitive:** `url: () => string | null` — local-only
  until the URL returns non-empty. Confirms design Decision 3 is first-class.
- **Token refresh is a native primitive:** `authToken: () => Promise<string>`
  re-invoked per request.
- **LWW conflict hook:** `transform(mutation) => skip|rewrite|null`.
- **Option-B fallback mechanism exists:** `partialSyncExperimental.bootstrapStrategy
= { kind: 'query', query }` (EXPERIMENTAL).

---

## Spike 1 — Browser WASM-SQLite viability [BLOCKER]

### 2.1 / 2.2 Round-trip

- Sync **mechanic** (connect → write → push → fresh client pull sees row):
  **PASS** — proven in Node against the real edge (`smoke.mjs`), `authToken`
  invoked 3× (per-request minting).
- **Browser** build identified + bundles: **PASS** — `@tursodatabase/sync-wasm`
  builds under Vite (after fixes below); ships a **10.5 MB wasm (3.3 MB gzip)**.
- **Live in-browser OPFS round-trip: PASS** — ran `pnpm browser` in a real
  browser: `@tursodatabase/sync-wasm` loaded the OPFS-backed WASM instance
  (`client A connected ✔`), client A pushed, and a separate client B pulled the
  row back (`ROUND-TRIP CONFIRMED`). The BLOCKER is cleared: the browser can be
  the write source of truth and reach the Turso edge directly.
- The only host contacted during sync was `spike-user-alice-…turso.io` (the
  Turso edge) — **no app server in the data path**, confirming 2.3 in-browser.
- **Bundler-integration constraints found (real, must carry to production):**
  1. `sync-wasm` uses **top-level await** → build target must be `esnext`/es2022+
     (default es2020 build _fails_). Fixed in `vite.config.js`.
  2. OPFS sync-access-handles run in a **Web Worker** needing **cross-origin
     isolation** → server must send `COOP: same-origin` + `COEP: require-corp`.
     In prod the Cloudflare Worker must set these on the `/todos` route.

### 2.3 Edge validates scoped token, no control-plane call

- **PASS.** A deliberately bad token made the **Turso edge** reject the push with
  HTTP **400** — rejection happened at the edge, with **no app server / Better
  Auth DB in the data path**. (Transport-level; runtime-independent.)

### 2.4 Silent token refresh

- **PASS.** After the bad-token rejection, swapping the credential source and
  retrying `push()` recovered cleanly; the post-rejection row reached the edge
  (verified by a fresh puller) — **no data loss**. `authToken` was re-invoked
  (6 mints over the session).
- **Conclusion:** manual freeze→reinit→retry interceptor **NOT required**. The
  handoff's Task A is largely dead code — the `authToken` callback is the refresh
  mechanism. (Caveat: the Turso **CLI** mints only day-granularity/`never`
  tokens; true short-lived scoped tokens need the **Platform API** — that's what
  the future `/api/refresh-session` endpoint must call.)

### 2.5 Single-user multi-device LWW

- **PASS.** Two devices edited the same row offline; after both pushed (laptop
  last) and pulled, both **converged on the last writer's value**
  (`edited-on-laptop`) — predictable, lossless. Matches C1's acceptance signal.

### 2.6 Additive-DDL propagation via pull()

- **PASS.** After `ALTER TABLE todos ADD COLUMN note TEXT` on the remote primary
  (out-of-band via `turso db shell`), an **existing older-schema** browser client
  called `pull()` and the new column appeared (`note=null`) — the additive,
  nullable DDL propagated through the sync protocol to a client that had only the
  old schema. Validates the handoff's "new columns must be nullable/DEFAULT" rule.
- **Caveat for follow-up:** only an _additive nullable_ column was tested, applied
  directly to the primary. Non-additive changes (drop/rename/NOT-NULL-without-
  default) and the multi-tenant fan-out (Turso Multi-DB Schemas pushing one
  parent migration to N per-user DBs) are NOT covered here — that's the deferred
  schema-propagation-automation work.

### 2.7 SPIKE 1 VERDICT

**GO.** The browser WASM/OPFS round-trip is confirmed in a real browser, on top
of the already-proven scoped-token edge validation, native silent refresh, and
single-user LWW. The data path is browser → Turso edge with no app server.
Carry the two integration constraints (esnext/TLA, COOP/COEP) and the ~3.3 MB
gzip wasm first-load into the follow-up.

---

## Spike 2 — Per-user DB lifecycle & plan limits [BLOCKER]

### 3.1 Provision-on-opt-in

- **PASS.** Provisioned a fresh per-user DB on demand; the client started
  **local-only** via `url: () => null` and only synced once the URL went
  non-empty (3 rows written entirely offline first).

### 3.2 Seed-push (replaces row reassignment)

- **PASS.** On opt-in, a **single `push()`** seeded all 3 local rows into the
  previously-empty DB (verified count = 3 via fresh puller). The anon→registered
  upgrade is a one-time seed-push — **no cross-DB row migration**. This replaces
  the `auth.ts` `onLinkAccount` UPDATE.

### 3.3 Deprovision-on-delete

- **PASS.** `turso db destroy` tore down the user's data-plane DB in **2.5s** —
  clean teardown path confirmed.

### 3.4 Real plan limits (`plan-limits.mjs`, N=20)

- **Per-DB provisioning latency:** min **2130 ms**, p50 **2387 ms**, p95/max
  **6838 ms**. Provisioning is **~2.4s typical, not instant**.
- **Creation rate:** 20 back-to-back creates, **no throttle/429** observed.
- **Active-DB ceiling:** plan hard cap **100 databases** (starter). So
  database-per-user on this plan maxes at ~95 real users — production scale needs
  Scale/Enterprise. The ~2.4s/DB cost is also why per-anonymous-visitor
  provisioning would be a storm; **provision-on-opt-in is vindicated**.

### 3.5 SPIKE 2 VERDICT

**GO.** The full lifecycle (provision-on-opt-in → seed-push → deprovision) works,
with measured, acceptable latencies. The only operational caveat is the 100-DB
cap on the current plan — a billing/plan decision, not an architectural blocker.

---

## 4. Decision gate

### 4.1 Overall GO / NO-GO

**GO.**

- Spike 1 evidence: live in-browser WASM/OPFS round-trip PASS; scoped-token edge
  validation + native silent refresh + single-user LWW all PASS; edge-only path.
- Spike 2 evidence: lifecycle (provision-on-opt-in → seed-push → deprovision)
  PASS end-to-end; limits measured and acceptable (caveat: 100-DB plan cap).
- 2.6 DDL propagation: additive nullable column propagates via `pull()` (PASS).

### 4.2 If NO-GO → Option B pivot

Not triggered. If the live OPFS round-trip fails, fall back to Option B (single
shared DB + `partialSyncExperimental` query filters), which re-introduces the
tenant row-isolation risk (handoff Task B returns). Scope that follow-up
accordingly.

### 4.3 If GO → follow-up obligations (do NOT mistake GO for "done")

- [ ] Use **`@tursodatabase/sync-wasm`** (not `@tursodatabase/sync`) on the
      client; build target **esnext**; serve **COOP/COEP** on the sync route.
- [ ] Budget the **~3.3 MB gzip wasm** first-load (lazy-load behind sync opt-in).
- [ ] Relocate `todo-list-core` trim/reject-empty invariants → client + DB
      `CHECK`/`NOT NULL` constraints (server no longer guards writes).
- [ ] Design SSR-hydration for `/todos` (local-first source of truth vs SSR).
- [ ] Build the scoped-token minting endpoint against Better Auth using the
      **Platform API** (short-lived, DB-scoped) — likely `/api/refresh-session`.
- [ ] Wire client `url: () => syncEnabled ? dbUrl : null` for opt-in.
- [ ] Replace `auth.ts` `onLinkAccount` UPDATE with the seed-push on opt-in.
- [ ] Decide the plan tier given the **100-DB cap** vs expected synced users.

### 4.4 Teardown status

- Destroyed: `spike-user-bob`, all 20 `spike-limit-*`. **Kept:**
  `spike-user-alice` (+ `.env`) for the live browser test. Destroy it after:
  `turso db destroy spike-user-alice --yes`, then `rm -rf spike/local-first-turso`.
