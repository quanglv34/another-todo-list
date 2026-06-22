## ADDED Requirements

### Requirement: Anonymous-first identity

The system SHALL provide every visitor with a usable identity without requiring sign-up, by creating an anonymous account on first interaction. The anonymous account MUST persist across reloads via the session and MUST own any data the visitor creates.

#### Scenario: First visit creates an anonymous session

- **WHEN** a new visitor loads the app and creates a todo
- **THEN** the system creates an anonymous user, establishes a session, and associates the todo with that anonymous user

#### Scenario: Anonymous session persists across reloads

- **WHEN** an anonymous visitor reloads the page
- **THEN** the same anonymous user and their data remain available without any sign-in prompt

### Requirement: Email/password registration and sign-in

The system SHALL allow a user to register with an email and password and to sign in with those credentials. Passwords MUST be stored using Better Auth's hashing (never in plaintext).

#### Scenario: Successful registration

- **WHEN** a visitor submits a valid, unused email and a password meeting the minimum length
- **THEN** the system creates a registered account, establishes a session, and treats the user as authenticated

#### Scenario: Sign-in with correct credentials

- **WHEN** a registered user submits their correct email and password
- **THEN** the system establishes an authenticated session

#### Scenario: Sign-in with wrong credentials is rejected

- **WHEN** a user submits an email with an incorrect password
- **THEN** the system rejects the attempt and does not establish a session

### Requirement: Upgrade anonymous account to a registered account

The system SHALL allow an anonymous user to register email/password credentials such that their existing data is retained under the now-registered account.

#### Scenario: Anonymous user registers and keeps their data

- **WHEN** an anonymous user with existing todos completes email/password registration
- **THEN** the account becomes a registered account, the session continues, and the previously created todos remain owned by that user

### Requirement: Session retrieval and sign-out

The system SHALL expose the current session to the server and client, and SHALL allow a user to sign out, ending the session.

#### Scenario: Server can read the current session

- **WHEN** a request is handled by a server function or route loader
- **THEN** the system can resolve the current user (anonymous or registered) or determine that there is none

#### Scenario: Sign-out ends the session

- **WHEN** a signed-in user signs out
- **THEN** the system clears the session and subsequent requests are treated as having no authenticated (or a fresh anonymous) user

### Requirement: Route protection

The system SHALL allow routes to require an authenticated (non-anonymous) user and redirect unauthenticated visitors away from protected routes.

#### Scenario: Protected route redirects an anonymous visitor

- **WHEN** an anonymous or signed-out visitor navigates to a route that requires a registered account
- **THEN** the system redirects them to the sign-in entry point instead of rendering the protected route
