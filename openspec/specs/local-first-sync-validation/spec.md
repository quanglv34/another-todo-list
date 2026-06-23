## Purpose

This specification defines the validation requirements for a local-first sync architecture using Turso's edge database and browser WASM-SQLite. It establishes the criteria for proving the viability of a browser-based sync approach, including token management, database lifecycle operations, and operational limits.

## Requirements

### Requirement: Browser WASM-SQLite sync PoC

The validation SHALL produce a throwaway browser proof-of-concept that initializes a WASM SQLite instance via `@tursodatabase/sync` and synchronizes it with a per-user Turso database using `push()` and `pull()`, executed entirely from a browser context (not a server, and not an embedded replica backed by a local file path). The PoC SHALL NOT be wired into `apps/web` production code.

#### Scenario: Round-trip sync from the browser

- **WHEN** the PoC writes a row to the local WASM SQLite instance and calls `push()`, then a second browser context (or a cleared local instance) calls `pull()`
- **THEN** the row provisioned in the first context appears in the second, confirming the browser can act as the write source of truth and reach the Turso edge directly

#### Scenario: Browser viability is recorded as a gate

- **WHEN** the PoC is evaluated for production viability
- **THEN** the findings SHALL state explicitly whether the browser WASM path is production-viable today, and if it is not, the change SHALL halt with a NO-GO rather than proceed to app changes

### Requirement: Scoped token validation and silent refresh

The validation SHALL demonstrate that a per-user scoped sync token is validated at the Turso edge with no application server in the data path, and that the client recovers from token expiry without losing queued writes.

#### Scenario: Edge validates a scoped token without the control plane

- **WHEN** the PoC syncs using a short-lived token scoped to a single user's database
- **THEN** the sync succeeds against the Turso edge without a call to the application server or the Better Auth control-plane database during the mutation

#### Scenario: Silent token-refresh loop on rejection

- **WHEN** the Turso edge returns an authentication rejection mid-sync because the scoped token has expired
- **THEN** the client SHALL freeze the sync queue, obtain a fresh scoped token, reinitialize the connection context, and retry the queued operation to completion with no data loss

### Requirement: Per-user database lifecycle under sync-opt-in provisioning

The validation SHALL exercise the database-per-user lifecycle under a sync-opt-in model: anonymous and non-syncing users have no Turso data-plane database, and a per-user database is provisioned only when a user enables sync.

#### Scenario: Seed-push replaces row reassignment on upgrade

- **WHEN** a user with only local on-device data enables sync for the first time and a fresh per-user database is provisioned
- **THEN** the client SHALL perform a one-time seed-push of its local rows into the new database, demonstrating that the anonymous→registered upgrade is a seed-push and not a cross-database row migration

#### Scenario: Deprovision on account deletion

- **WHEN** a synced user's account is deleted
- **THEN** the validation SHALL demonstrate deprovisioning of that user's data-plane database, confirming the lifecycle has a defined teardown path

### Requirement: Turso plan-limit findings

The validation SHALL document the real operational limits behind Turso's "unlimited database" claim on the Developer Plan, replacing the marketing term with measured numbers.

#### Scenario: Documented provisioning limits

- **WHEN** the lifecycle spike provisions databases at a rate representative of real signups
- **THEN** the findings SHALL record the database-creation rate cap, the active-database ceiling, and the per-database provisioning latency observed

### Requirement: Go/no-go decision record with Option-B fallback

The validation SHALL conclude with a written decision record that gates the follow-up implementation change.

#### Scenario: Decision gates the follow-up change

- **WHEN** both the browser-sync spike and the lifecycle spike have completed
- **THEN** the decision record SHALL state GO or NO-GO, cite the evidence from each spike, and — for a NO-GO — define the pivot to Option B (single shared database with partial-sync filters) so the follow-up change has a defined path either way
