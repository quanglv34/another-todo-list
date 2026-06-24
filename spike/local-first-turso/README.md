# Spike: local-first Turso sync (THROWAWAY)

PoC harness for OpenSpec change **`spike-local-first-turso-sync`**. Validates two
load-bearing unknowns before any production code moves:

1. **Spike 1 (BLOCKER):** does `@tursodatabase/sync` run as WASM SQLite _in the
   browser_ and round-trip to a per-user Turso edge DB, with scoped tokens and
   silent refresh?
2. **Spike 2 (BLOCKER):** is the per-user DB lifecycle (provision-on-opt-in,
   seed-push, deprovision) operable within real Turso Developer-Plan limits?

> **Isolation (design Decision 5):** this lives in `spike/`, _outside_ the pnpm
> workspace globs (`apps/*`, `packages/*`). It does **not** import from or modify
> `apps/web` or `packages/db`, and its deps are not added to the app. Delete or
> archive this directory once `FINDINGS.md` records the go/no-go (task 4.4).

## What's authored vs. what needs YOU

The harness code is complete. The remaining tasks need a live account + runtime
this environment doesn't have:

| Need                           | Why                                                  |
| ------------------------------ | ---------------------------------------------------- |
| A Turso Developer-Plan account | provision/deprovision real DBs (Spike 2)             |
| `turso` CLI, logged in         | `lifecycle.sh`, `plan-limits.mjs`                    |
| A real browser                 | Spike 1 is _browser_ viability — Node can't prove it |
| Real measured numbers          | plan limits / verdicts must be observed, not guessed |

## Setup

```sh
cd spike/local-first-turso
pnpm install                      # spike-local deps only

# Turso CLI (host tooling — NOT an npm dep):
brew install tursodatabase/tap/turso   # or: curl -sSfL https://get.tur.so/install.sh | bash
turso auth login

cp .env.example .env              # then fill it in (see below)
```

### Fill `.env`

- Provision a throwaway per-user DB and mint a short-lived, DB-scoped token:
  ```sh
  turso db create spike-user-alice --group default
  turso db show spike-user-alice --url          # -> TURSO_DB_URL
  turso db tokens create spike-user-alice --expiration 30s   # -> TURSO_DB_AUTH_TOKEN
  ```
- For the browser harness, Vite reads `VITE_`-prefixed vars, so also add:
  ```
  VITE_TURSO_DB_URL=<same as TURSO_DB_URL>
  VITE_TURSO_DB_AUTH_TOKEN=<same as TURSO_DB_AUTH_TOKEN>
  ```

## Run

| Task(s)       | Command                                           | Records into FINDINGS.md                 |
| ------------- | ------------------------------------------------- | ---------------------------------------- |
| 2.1, 2.2, 2.6 | `pnpm browser` → open the page, click the buttons | Spike 1 round-trip / DDL                 |
| 2.3, 2.4      | `pnpm token-refresh` (mint a 30s token first)     | scoped-token + silent refresh            |
| 2.5           | `pnpm lww`                                        | multi-device LWW                         |
| 3.1–3.3       | `pnpm lifecycle`                                  | provision / seed-push / deprovision      |
| 3.4           | `pnpm plan-limits 50`                             | real creation rate cap, ceiling, latency |

Then fill **`FINDINGS.md`** from what you observed and record the go/no-go.

## Teardown (task 4.4)

```sh
turso db list                     # confirm nothing throwaway remains
turso db destroy spike-user-alice --yes
# ...destroy any spike-limit-* leftovers...
cd ../.. && rm -rf spike/local-first-turso   # or archive it
```
