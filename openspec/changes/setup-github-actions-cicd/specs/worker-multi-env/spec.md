## ADDED Requirements

### Requirement: Wrangler config supports two environments

The `wrangler.jsonc` file SHALL define `[env.production]` and `[env.development]` sections with separate Worker names and routes.

#### Scenario: Production environment configuration

- **WHEN** `wrangler deploy --env production` is executed
- **THEN** wrangler SHALL deploy to the Worker named `another-todo-list` with route `todos.quanglv.io.vn/*`

#### Scenario: Development environment configuration

- **WHEN** `wrangler deploy --env development` is executed
- **THEN** wrangler SHALL deploy to the Worker named `another-todo-list-dev` with no custom route (workers.dev only)

### Requirement: D1 bindings are removed

The `wrangler.jsonc` file SHALL NOT contain any `d1_databases` bindings.

#### Scenario: No D1 bindings in config

- **WHEN** `wrangler.jsonc` is parsed
- **THEN** the `d1_databases` field SHALL be absent or empty

### Requirement: Environment-specific secrets

Each environment SHALL have its own set of secrets (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).

#### Scenario: Production secrets are independent

- **WHEN** secrets are set for the `production` environment
- **THEN** they SHALL NOT affect the `development` environment's secrets

#### Scenario: Development secrets are independent

- **WHEN** secrets are set for the `development` environment
- **THEN** they SHALL NOT affect the `production` environment's secrets

### Requirement: Production uses custom domain

The production Worker SHALL be accessible at `https://todos.quanglv.io.vn`.

#### Scenario: Custom domain routing

- **WHEN** a request is made to `https://todos.quanglv.io.vn`
- **THEN** Cloudflare SHALL route it to the `another-todo-list` Worker

### Requirement: Development uses workers.dev subdomain

The development Worker SHALL be accessible at its assigned `workers.dev` subdomain.

#### Scenario: Workers.dev routing

- **WHEN** a request is made to the development Worker's `workers.dev` URL
- **THEN** Cloudflare SHALL route it to the `another-todo-list-dev` Worker
