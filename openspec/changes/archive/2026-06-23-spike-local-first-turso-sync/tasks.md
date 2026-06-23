## 1. Spike setup (throwaway, isolated from apps/web)

- [x] 1.1 Create a scratch/spike workspace for the PoC that does NOT import from or modify `apps/web` or `packages/db` (per design Decision 5)
- [x] 1.2 Add `@tursodatabase/sync` and the Turso CLI as spike-local tooling only (not in `apps/web` dependencies)
- [x] 1.3 Create a Turso account/access and confirm CLI can provision and deprovision a throwaway database (NOTE: account is **starter** plan, not Developer — DB cap is 100, not "unlimited"; provision+destroy confirmed)

## 2. Spike 1 — Browser WASM-SQLite sync viability [BLOCKER]

- [x] 2.1 Initialize a WASM SQLite instance from a browser context — **PASS in a real browser**: `@tursodatabase/sync-wasm` loaded the OPFS-backed WASM instance (`client A connected ✔`). (CORRECTED: `@tursodatabase/sync` is native-only; the browser pkg is `@tursodatabase/sync-wasm`, esnext + COOP/COEP.)
- [x] 2.2 Round-trip (write → push → fresh client pull) — **PASS in the browser**: client B pulled the row via OPFS; only the Turso edge host was contacted (confirms 2.3 in-browser too) (spec: Browser WASM-SQLite sync PoC)
- [x] 2.3 Scoped token validated at the **edge** (HTTP 400 on bad token) with NO app-server/control-plane call in the data path — PASS (transport-level, runtime-independent)
- [x] 2.4 Silent-refresh loop: forced an auth rejection, swapped token via `authToken` callback, retried with no data loss — PASS. **Finding: refresh is native; the manual freeze/reinit interceptor is NOT required**
- [x] 2.5 Single-user multi-device LWW: concurrent offline edits → converged on last-writer, lossless — PASS (design Decision 4)
- [x] 2.6 Probe `pull()` additive-DDL on an older-schema client — **PASS**: after `ALTER TABLE todos ADD COLUMN note TEXT` on the remote, an existing older-schema browser client's `pull()` applied the column (`note=null`). Additive nullable DDL propagates through the sync protocol natively.
- [x] 2.7 Spike 1 verdict recorded in FINDINGS.md: **GO** — browser WASM/OPFS round-trip confirmed in a real browser; edge-only data path confirmed

## 3. Spike 2 — Per-user DB lifecycle & plan limits [BLOCKER]

- [x] 3.1 Provision-on-sync-opt-in: client started local-only via `url: () => null`, synced only after opt-in — PASS (design Decision 3)
- [x] 3.2 Seed-push: a single `push()` seeded 3 local rows into the fresh empty DB (verified count=3) — PASS, not a cross-DB migration (spec: Seed-push replaces row reassignment)
- [x] 3.3 Deprovision-on-delete: `turso db destroy` tore down the DB in 2.5s — PASS (spec: Deprovision on account deletion)
- [x] 3.4 Real plan limits measured (N=20): provisioning p50 **2.4s** / p95 **6.8s**, no rate cap at 20 rapid creates, hard ceiling **100 DBs** (starter) — recorded actual numbers (spec: Turso plan-limit findings)
- [x] 3.5 Spike 2 verdict: **GO** — lifecycle operable; only caveat is the 100-DB plan cap (billing decision, not architectural)

## 4. Decision gate & teardown

- [x] 4.1 Go/no-go recorded in FINDINGS.md: **GO, conditional** on the one live-browser OPFS confirmation; evidence from both spikes cited (spec: Go/no-go decision record with Option-B fallback)
- [x] 4.2 Option-B fallback documented (shared DB + `partialSyncExperimental` query filters; reintroduces handoff Task B) — not triggered
- [x] 4.3 GO obligations documented in FINDINGS.md §4.3 (use `sync-wasm`+esnext+COOP/COEP, ~3.3MB wasm budget, relocate invariants, SSR-hydration, Platform-API token minting, opt-in URL wiring, replace `onLinkAccount` UPDATE, plan-tier decision)
- [x] 4.4 Teardown: all throwaway Turso DBs destroyed (`spike-user-alice`, `spike-user-bob`, 20× `spike-limit-*`); spike `.env` (scoped token) removed; real DBs untouched. **PoC workspace `spike/local-first-turso/` intentionally retained as the reference implementation for the gated follow-up change — remove once that change lands.**
