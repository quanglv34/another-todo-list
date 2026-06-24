## ADDED Requirements

### Requirement: CI pipeline runs on every push

The GitHub Actions workflow SHALL trigger on push to `main` and `develop` branches.

#### Scenario: Push to main triggers production deployment

- **WHEN** code is pushed to the `main` branch
- **THEN** the workflow SHALL run lint, typecheck, tests, build, and deploy to the production Worker

#### Scenario: Push to develop triggers development deployment

- **WHEN** code is pushed to the `develop` branch
- **THEN** the workflow SHALL run lint, typecheck, tests, build, and deploy to the development Worker

### Requirement: CI pipeline runs quality checks before deployment

The workflow SHALL run `vp check` (lint, format, typecheck) and `vp run web#test` before building or deploying.

#### Scenario: Quality check failure blocks deployment

- **WHEN** `vp check` or `vp run web#test` fails
- **THEN** the workflow SHALL NOT proceed to build or deploy

#### Scenario: Quality check success allows build

- **WHEN** `vp check` and `vp run web#test` both pass
- **THEN** the workflow SHALL proceed to run `vp run web#build`

### Requirement: Deployment uses wrangler with environment flag

The workflow SHALL deploy using `wrangler deploy --env <environment>` where environment is `production` for `main` and `development` for `develop`.

#### Scenario: Production deploy command

- **WHEN** deploying from the `main` branch
- **THEN** the workflow SHALL run `wrangler deploy --env production`

#### Scenario: Development deploy command

- **WHEN** deploying from the `develop` branch
- **THEN** the workflow SHALL run `wrangler deploy --env development`

### Requirement: Turso secrets are injected during deployment

The workflow SHALL set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `BETTER_AUTH_SECRET` as Worker secrets using `wrangler secret put` before deploying.

#### Scenario: Secrets are set from GitHub repository secrets

- **WHEN** the deploy step runs
- **THEN** the workflow SHALL execute `wrangler secret put <SECRET_NAME> --env <environment>` for each required secret, reading the value from the corresponding GitHub repository secret

### Requirement: Build uses Vite+ toolchain

The workflow SHALL use `pnpm install` and `vp install` to install dependencies, matching the project's existing toolchain.

#### Scenario: Dependencies are installed correctly

- **WHEN** the workflow starts
- **THEN** it SHALL run `pnpm install` followed by `vp install` to install all workspace dependencies
