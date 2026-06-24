// Tasks 2.1, 2.2, 2.6 — BROWSER WASM-SQLite viability (the BLOCKER).
//
// SPIKE FINDING (corrects the handoff): the handoff said to use
// `@tursodatabase/sync` in the browser, but THAT package is native-only — it
// loads a per-platform `.node` N-API addon and ships no `.wasm`. The browser
// build is a SEPARATE package: `@tursodatabase/sync-wasm`, which ships
// `sync.wasm32-wasi.wasm` and persists via OPFS + a Web Worker (with a
// `:memory:` fallback). Same `connect({path,url,authToken,transform})` API.
//
// We import the `/vite` entry (the package ships bundler-specific entrypoints
// with dev-hacks — see vite.config.js for the COOP/COEP headers OPFS needs).
// If `connect()` throws here, that IS the finding — record it in FINDINGS.md.

import { connect } from "@tursodatabase/sync-wasm/vite";

const logEl = document.getElementById("log");
function log(msg, cls = "info") {
  const line = document.createElement("div");
  line.className = cls;
  line.textContent = msg;
  logEl.appendChild(line);
  // eslint-disable-next-line no-console
  console.log(`[${cls}] ${msg}`);
}

const DB_URL = import.meta.env.VITE_TURSO_DB_URL;
const DB_TOKEN = import.meta.env.VITE_TURSO_DB_AUTH_TOKEN;

function assertEnv() {
  if (!DB_URL || !DB_TOKEN) {
    log("Missing VITE_TURSO_DB_URL / VITE_TURSO_DB_AUTH_TOKEN in .env", "fail");
    throw new Error("env not configured");
  }
}

// Instrument fetch so we can prove (task 2.3) the data path hits ONLY the Turso
// edge host — never an app server / control plane — during push/pull.
const seenHosts = new Set();
const instrumentedFetch = (input, init) => {
  try {
    const u = new URL(typeof input === "string" ? input : input.url);
    seenHosts.add(u.host);
  } catch {
    /* ignore non-URL inputs */
  }
  return fetch(input, init);
};

// TABLE shaped like the real app's `todos` (packages/db schema), so the spike
// exercises a representative row, not a toy.
const DDL = `CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);`;

async function roundTrip() {
  assertEnv();
  log("connect() — client A (writer). Watch for WASM/OPFS load errors…", "info");

  // Client A: local WASM SQLite that syncs to the per-user edge DB.
  const a = await connect({
    path: "spike-client-a.db", // browser VFS-backed, not a real file
    url: DB_URL,
    authToken: async () => DB_TOKEN,
    fetch: instrumentedFetch,
    clientName: "spike-A",
  });
  log("client A connected ✔ (browser WASM instance is alive)", "pass");

  await a.exec(DDL);
  const id = `t-${Date.now()}`;
  const stmt = await a.prepare(
    "INSERT INTO todos (id, user_id, title, completed, created_at) VALUES (?, ?, ?, 0, ?)",
  );
  await stmt.run(id, "user-spike", "round-trip row", Date.now());
  log(`wrote row ${id} locally`, "info");

  const before = await a.stats();
  log(`stats before push: cdcOperations=${before.cdcOperations} (unpushed)`, "info");
  await a.push();
  log("push() complete — local change sent to edge ✔", "pass");

  // Client B: a SEPARATE local instance that bootstraps purely via pull().
  log("connect() — client B (reader, cleared instance)…", "info");
  const b = await connect({
    path: "spike-client-b.db",
    url: DB_URL,
    authToken: async () => DB_TOKEN,
    fetch: instrumentedFetch,
    clientName: "spike-B",
  });
  await b.pull();
  const row = await (await b.prepare("SELECT * FROM todos WHERE id = ?")).get(id);

  if (row && row.title === "round-trip row") {
    log(`pull() on client B sees row ${id} ✔ — ROUND-TRIP CONFIRMED`, "pass");
  } else {
    log(`client B did NOT see row ${id} — round-trip FAILED`, "fail");
  }

  log(`hosts touched during sync: ${[...seenHosts].join(", ") || "(none captured)"}`, "info");
  log("task 2.3 check: confirm the above are Turso edge hosts only, no app server.", "info");

  await a.close();
  await b.close();
}

// Task 2.6 — does pull() apply additive (nullable/DEFAULT) DDL to an older client?
// Run roundTrip() first, then add a column on the remote out-of-band
// (e.g. `turso db shell <db> "ALTER TABLE todos ADD COLUMN note TEXT"`),
// then click this to confirm an older-schema client pulls it cleanly.
async function ddlProbe() {
  assertEnv();
  const c = await connect({
    path: "spike-client-ddl.db",
    url: DB_URL,
    authToken: async () => DB_TOKEN,
    fetch: instrumentedFetch,
    clientName: "spike-DDL",
  });
  await c.pull();
  try {
    const row = await (await c.prepare("SELECT note FROM todos LIMIT 1")).get();
    log(
      `pull() applied additive DDL: 'note' column present ✔ (row=${JSON.stringify(row)})`,
      "pass",
    );
  } catch (e) {
    log(`additive-DDL column NOT present after pull(): ${e.message}`, "fail");
    log("Finding: schema propagation via pull() does NOT auto-apply this DDL.", "info");
  }
  await c.close();
}

document.getElementById("run").addEventListener("click", () => {
  roundTrip().catch((e) => {
    log(`connect()/sync threw: ${e.message}`, "fail");
    log("If this is a WASM/OPFS/filesystem error, that is the NO-GO signal for", "info");
    log("the browser path. Record it verbatim in FINDINGS.md → Spike 1 verdict.", "info");
    // eslint-disable-next-line no-console
    console.error(e);
  });
});
document.getElementById("ddl").addEventListener("click", () => {
  ddlProbe().catch((e) => log(`ddlProbe threw: ${e.message}`, "fail"));
});
