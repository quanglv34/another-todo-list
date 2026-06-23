## ADDED Requirements

### Requirement: Per-user persistent todos

The system SHALL persist todos in Cloudflare D1 via Drizzle, scoped to the current session's user. Todos MUST survive page reloads and server restarts, and a user MUST only see their own todos.

#### Scenario: Todo persists across reload

- **WHEN** a user creates a todo and then reloads the app
- **THEN** the todo is still present, loaded from the database

#### Scenario: Todos are isolated per user

- **WHEN** two different users (anonymous or registered) each have todos
- **THEN** each user's queries return only the todos they own, never another user's

### Requirement: Todo mutations through server functions

The system SHALL perform create, toggle-complete, rename, and delete operations through server functions that write to D1, rather than mutating client-only state.

#### Scenario: Create persists to the database

- **WHEN** a user adds a todo
- **THEN** a row is inserted in D1 owned by the current user and returned to the client

#### Scenario: Toggle, rename, and delete persist

- **WHEN** a user toggles completion, renames, or deletes one of their todos
- **THEN** the corresponding row in D1 is updated or removed and the change survives a reload

#### Scenario: A user cannot mutate another user's todo

- **WHEN** a mutation targets a todo id that the current user does not own
- **THEN** the system rejects the operation and makes no change

### Requirement: Schema migrations are versioned and applied

The system SHALL define the database schema in Drizzle and manage changes through versioned migration files applied to D1 (locally via Miniflare and in production).

#### Scenario: Migrations create the schema on a fresh database

- **WHEN** migrations are applied to a fresh D1 database
- **THEN** the auth tables and the todos table exist and the app can read and write todos

#### Scenario: Generated migration reflects schema changes

- **WHEN** the Drizzle schema changes and migration generation is run
- **THEN** a new versioned migration file is produced that, when applied, brings the database to the new schema
