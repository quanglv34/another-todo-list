// Tasks 2.3 + 2.4 — scoped-token validation at the edge + silent refresh.
//
// KEY API FINDING (drove the design refinement): @tursodatabase/sync's
// `authToken` accepts `() => Promise<string>` — "a function which will provide
// short-lived credentials for every new request." So the handoff's manual
// "freeze queue → reinit → retry" interceptor (Task A) is mostly UNNECESSARY:
// the engine already re-invokes this callback to obtain fresh credentials.
//
// SPIKE CONSTRAINT FOUND AT RUNTIME: the Turso CLI only mints day-granularity
// (`7d`) or `never` tokens — it cannot mint a 30s token to force a time-based
// expiry. Sub-day, DB-scoped tokens require the Platform API (the shape the
// future Better Auth /api/refresh-session endpoint will call). So instead of
// waiting for expiry, we force a real auth REJECTION by handing the engine a
// BAD token mid-session, then a good one, and observe whether it re-invokes
// authToken and recovers with no data loss. Same failure path, no 7-day wait.

import { connect } from "@tursodatabase/sync";

const { TURSO_DB_URL, TURSO_DB_AUTH_TOKEN } = process.env;
if (!TURSO_DB_URL || !TURSO_DB_AUTH_TOKEN) {
  console.error("Set TURSO_DB_URL and TURSO_DB_AUTH_TOKEN in .env first.");
  process.exit(1);
}

const GOOD = TURSO_DB_AUTH_TOKEN;
const BAD = "ey-this-is-a-deliberately-invalid-scoped-token-to-force-401";

// `mode` simulates the control plane handing out a stale vs fresh credential.
let mode = "good";
let mints = 0;
async function mintScopedToken() {
  mints += 1;
  const tok = mode === "good" ? GOOD : BAD;
  console.log(`  → mintScopedToken() #${mints} (mode=${mode})`);
  return tok;
}

const db = await connect({
  path: "spike-token-refresh.db",
  url: TURSO_DB_URL,
  authToken: mintScopedToken, // engine calls this per request
  clientName: "spike-token",
});

await db.exec(`CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);`);

console.log("1) push with a VALID token…");
await db.push();
console.log("   ok\n");

console.log("2) flip the credential source to BAD, write a row, push → expect rejection…");
mode = "bad";
const id = `t-${process.pid}`;
await (
  await db.prepare("INSERT INTO todos (id,user_id,title,completed,created_at) VALUES (?,?,?,0,?)")
).run(id, "user-spike", "post-rejection write", 1782230000000);

let rejected = false;
try {
  await db.push();
  console.log("   push() did NOT reject on a bad token — unexpected; investigate.");
} catch (e) {
  rejected = true;
  console.log(`   push() rejected as expected: ${String(e.message).slice(0, 120)}`);
}

console.log("\n3) flip back to GOOD (silent refresh), retry push → expect recovery, no data loss…");
mode = "good";
let recovered = false;
try {
  await db.push();
  recovered = true;
  console.log("   push() succeeded after refresh ✔");
} catch (e) {
  console.log(`   push() STILL failing after good token: ${e.message}`);
}

// Verify the row actually reached the edge by pulling into a fresh client.
const verifier = await connect({
  path: "spike-token-verify.db",
  url: TURSO_DB_URL,
  authToken: async () => GOOD,
  clientName: "spike-token-verify",
});
await verifier.pull();
const row = await (await verifier.prepare("SELECT title FROM todos WHERE id=?")).get(id);
const landed = row?.title === "post-rejection write";

console.log("\n--- VERDICT (2.3/2.4) ---");
console.log(`edge rejected the bad token (no app-server in path): ${rejected ? "YES" : "NO"}`);
console.log(`recovered by swapping token via authToken callback:   ${recovered ? "YES" : "NO"}`);
console.log(`post-rejection row reached the edge (no data loss):   ${landed ? "YES" : "NO"}`);
console.log(`total authToken mints observed:                       ${mints}`);
console.log(
  rejected && recovered && landed
    ? "=> Silent refresh works via the authToken callback alone. Task A's manual\n" +
        "   freeze→reinit→retry interceptor is NOT required. Record in FINDINGS.md."
    : "=> authToken callback did NOT fully recover. A manual refresh wrapper may be\n" +
        "   needed. Record the exact behavior verbatim in FINDINGS.md.",
);

await db.close();
await verifier.close();
