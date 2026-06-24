## Context

The project is a TanStack Start app deployed to Cloudflare Workers using `@cloudflare/vite-plugin`. The database layer uses Turso (libSQL) via `drizzle-orm`. Currently, there is no CI/CD pipeline — deployment is manual via `wrangler deploy` from a developer's machine.

The project uses a Vite+ monorepo with pnpm workspaces. The deploy script in `apps/web/package.json` runs `vite build && wrangler deploy`.

## Goals / Non-Goals

**Goals:**

- Automated build, test, and deployment on push to `main` and `develop` branches
- Separate production (`another-todo-list`) and development (`another-todo-list-dev`) Workers from a single wrangler config
- Production gets custom domain `todos.quanglv.io.vn`, development uses `workers.dev`
- Combined lint/typecheck/test step for faster CI
- Turso secrets injected per environment via `wrangler secret put`

**Non-Goals:**

- Manual approval gates
- Preview deployments for PRs
- Multi-region failover
- Database migration automation in CI (handled separately)

## Decisions

### Decision: Two separate Workers instead of one Worker with shared routes

**Choice:** Two Workers (`another-todo-list` for prod, `another-todo-list-dev` for dev)

**Alternatives considered:**

1. Single Worker with `--env` flags — rejected because both branches would deploy to the same Worker name, causing conflicts when `develop` pushes after `main`
2. Branch-specific Worker names computed in workflow — rejected for simplicity; static names in wrangler config are clearer

**Rationale:** Separate Workers give independent deployment logs, error tracking, and rollback capability. No collision risk between branches.

### Decision: Wrangler config with env sections

**Choice:** Single `wrangler.jsonc` with `[env.production]` and `[env.development]` sections, each specifying `name` and `routes`

**Alternatives considered:**

1. Multiple `wrangler.prod.jsonc` / `wrangler.dev.jsonc` — rejected because it duplicates most of the config
2. CLI-only overrides via `--name` and `--routes` — rejected because env sections are more maintainable and self-documenting

**Rationale:** Env sections keep everything in one file while clearly separating Worker-specific config. The workflow passes `--env production` or `--env development`.

### Decision: Turso secrets via `wrangler secret put` in workflow

**Choice:** Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET` as Worker secrets using `wrangler secret put` commands in the workflow, reading from GitHub repository secrets.

**Alternatives considered:**

1. `--var` flag on `wrangler deploy` — rejected because secrets should not appear in command arguments or logs
2. `.dev.vars` committed to repo — rejected because it would contain plaintext secrets

**Rationale:** `wrangler secret put` is the standard approach for Worker secrets. It encrypts values at rest and doesn't expose them in workflow logs.

### Decision: Combined CI job

**Choice:** Single job that runs `vp check` (lint + fmt + typecheck) and `vp run web#test` before building and deploying.

**Alternatives considered:**

1. Separate jobs for lint, test, and deploy — rejected because the monorepo tools (`vp check`) already combine these, and separate jobs add overhead with parallel setup

**Rationale:** Fewer jobs mean faster feedback loops and simpler workflow YAML. If one step fails, the entire job fails and deployment is blocked.

### Decision: Branch-to-environment mapping hardcoded in workflow

**Choice:** `if: github.ref == 'refs/heads/main'` triggers production deploy, `develop` triggers dev deploy.

**Alternatives considered:**

1. Dynamic environment detection — rejected for simplicity; the two-branch model is stable

**Rationale:** Hardcoded branch checks are explicit and easy to debug. No ambiguity about which branch deploys where.

## Risks / Trade-offs

- **Secrets not in CI logs**: `wrangler secret put` reads from stdin, which GitHub Actions masks. If a secret value accidentally matches a log line, GitHub will mask it. Mitigation: use `echo "$SECRET" | wrangler secret put` pattern.
- **Two Turso databases to maintain**: Production and development databases need separate schema management. Mitigation: migrations are handled outside this workflow.
- **Workers.dev subdomain hash**: The development Worker URL will include a hash (e.g., `another-todo-list-dev.<hash>.workers.dev`). Mitigation: document the URL in GitHub Actions output or run summary.
- **No rollback automation**: If a bad deploy happens, manual rollback via `wrangler rollback` is needed. Mitigation: acceptable for current scale; can add rollback step later.
