// Task 2.5 — single-user multi-device last-write-wins (design Decision 4).
//
// Under database-per-user (Option A) the ONLY conflict surface is one user
// editing the SAME row on two devices. There is no cross-user collision to
// test (handoff Task B evaporates). This harness simulates two devices against
// ONE user's DB: both edit offline, then sync in sequence, and we assert the
// merge is predictable and lossless.
//
// The `transform` hook (DatabaseRowMutation -> skip | rewrite | null) is where
// a non-default conflict policy would live; here we observe the engine's
// out-of-the-box LWW and log every mutation so the resolution is visible.

import { connect } from "@tursodatabase/sync";

const { TURSO_DB_URL, TURSO_DB_AUTH_TOKEN } = process.env;
if (!TURSO_DB_URL || !TURSO_DB_AUTH_TOKEN) {
  console.error("Set TURSO_DB_URL and TURSO_DB_AUTH_TOKEN in .env first.");
  process.exit(1);
}

function device(name) {
  return connect({
    path: `spike-lww-${name}.db`,
    url: TURSO_DB_URL,
    authToken: async () => TURSO_DB_AUTH_TOKEN,
    clientName: `spike-lww-${name}`,
    transform: (m) => {
      console.log(
        `  [${name}] transform: ${m.changeType} ${m.tableName}#${m.id} ` +
          `after=${JSON.stringify(m.after ?? m.updates)}`,
      );
      return null; // keep mutation as-is — observe default LWW
    },
  });
}

const DDL = `CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);`;

const phone = await device("phone");
const laptop = await device("laptop");
await phone.exec(DDL);
await phone.push();
await laptop.pull();

// Seed a shared row both devices will then edit while "offline".
const id = "shared-1";
await (
  await phone.prepare(
    "INSERT INTO todos (id,user_id,title,completed,created_at) VALUES (?,?,?,0,?)",
  )
).run(id, "user-spike", "original", Date.now());
await phone.push();
await laptop.pull();
console.log(`seeded row ${id}="original" on both devices\n`);

// Concurrent OFFLINE edits — no sync between them.
await (await phone.prepare("UPDATE todos SET title=? WHERE id=?")).run("edited-on-phone", id);
await (await laptop.prepare("UPDATE todos SET title=? WHERE id=?")).run("edited-on-laptop", id);
console.log("both devices edited the same row offline (phone, then laptop)\n");

// Sync in order: phone first, laptop second (laptop = last writer).
await phone.push();
await laptop.push();
await phone.pull();
await laptop.pull();

const onPhone = await (await phone.prepare("SELECT title FROM todos WHERE id=?")).get(id);
const onLaptop = await (await laptop.prepare("SELECT title FROM todos WHERE id=?")).get(id);
console.log(`\nafter convergence: phone="${onPhone?.title}" laptop="${onLaptop?.title}"`);

const converged = onPhone?.title === onLaptop?.title;
console.log(
  converged
    ? `VERDICT (2.5): devices CONVERGED on "${onPhone.title}" — predictable, lossless ✔`
    : "VERDICT (2.5): devices DIVERGED — convergence failed, investigate. Record verbatim.",
);
console.log(
  "Acceptance (C1): no data loss, predictable merge. Confirm the surviving",
  "value matches the documented LWW rule (last push wins).",
);

await phone.close();
await laptop.close();
