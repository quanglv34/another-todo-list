## Why

The project has no CI/CD pipeline. Every deployment requires manual `wrangler deploy` from a local machine, which is error-prone, inconsistent, and doesn't scale. We need automated testing and deployment on push to `main` (production) and `develop` (staging) branches.

## What Changes

- Add GitHub Actions workflow for automated build, test, and deployment to Cloudflare Workers
- Remove obsolete D1 database bindings from `wrangler.jsonc` (migrated to Turso)
- Add environment-specific wrangler configurations for two Workers: `another-todo-list` (prod) and `another-todo-list-dev` (staging)
- Custom domain `todos.quanglv.io.vn` for production, `workers.dev` subdomain for development
- Turso database credentials injected as Worker secrets per environment

## Capabilities

### New Capabilities

- `github-actions-cicd`: CI/CD pipeline that runs lint, typecheck, and tests on every push, then deploys to Cloudflare Workers with environment-specific configuration
- `worker-multi-env`: Multi-environment Worker configuration supporting separate production and development deployments from a single wrangler config with `--env` flags

### Modified Capabilities

## Impact

- `.github/workflows/deploy.yml`: New CI/CD workflow file
- `apps/web/wrangler.jsonc`: Remove `d1_databases` binding, add `[env.production]` and `[env.development]` sections with routes
- GitHub repository secrets: New secrets for Cloudflare API token, account ID, and Turso credentials per environment
- Turso: Requires two databases (prod + dev) with auth tokens
- Cloudflare DNS: Custom domain `todos.quanglv.io.vn` must be configured with Cloudflare as nameserver
