## 1. Wrangler Configuration

- [x] 1.1 Remove `d1_databases` binding from `apps/web/wrangler.jsonc`
- [x] 1.2 Add `[env.production]` section with `name: "another-todo-list"` and `routes: ["todos.quanglv.io.vn/*"]`
- [x] 1.3 Add `[env.development]` section with `name: "another-todo-list-dev"` and empty routes

## 2. Turso Database Setup

- [ ] 2.1 Create Turso database for production (`another-todo-list-prod`)
- [ ] 2.2 Create Turso database for development (`another-todo-list-dev`)
- [ ] 2.3 Generate auth tokens for both databases
- [ ] 2.4 Note database URLs and tokens for GitHub secrets

## 3. GitHub Secrets Configuration

- [ ] 3.1 Add `CLOUDFLARE_API_TOKEN` repository secret
- [ ] 3.2 Add `CLOUDFLARE_ACCOUNT_ID` repository secret
- [ ] 3.3 Add `TURSO_DATABASE_URL_PROD` and `TURSO_AUTH_TOKEN_PROD` secrets
- [ ] 3.4 Add `TURSO_DATABASE_URL_DEV` and `TURSO_AUTH_TOKEN_DEV` secrets
- [ ] 3.5 Add `BETTER_AUTH_SECRET_PROD` and `BETTER_AUTH_SECRET_DEV` secrets

## 4. GitHub Actions Workflow

- [x] 4.1 Create `.github/workflows/` directory
- [x] 4.2 Create `deploy.yml` workflow file with trigger on push to `main` and `develop`
- [x] 4.3 Add Node.js and pnpm setup steps
- [x] 4.4 Add `pnpm install` and `vp install` steps
- [x] 4.5 Add `vp check` step for lint, format, and typecheck
- [x] 4.6 Add `vp run web#test` step
- [x] 4.7 Add conditional deploy steps using `wrangler deploy --env production` for `main`
- [x] 4.8 Add conditional deploy steps using `wrangler deploy --env development` for `develop`
- [x] 4.9 Add `wrangler secret put` steps for Turso and auth secrets per environment

## 5. Branch Setup

- [x] 5.1 Create `develop` branch from `main`
- [x] 5.2 Push `develop` branch to origin
