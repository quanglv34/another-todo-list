// Task 3.4 — measure the REAL numbers behind Turso's "unlimited DB" claim.
//
// Provisions N throwaway databases back-to-back via the Turso CLI, recording:
//   - per-DB provisioning latency (ms)
//   - the database-creation rate cap (where creates start to 429 / throttle)
//   - the active-database ceiling (where creates start to fail outright)
//
// This is the load-bearing Spike-2 evidence. Do NOT write "unlimited" in
// FINDINGS.md — write the observed numbers from THIS run. Cleans up after
// itself, but verify with `turso db list` and finish task 4.4 regardless.
//
// Usage: node src/plan-limits.mjs 50   (provisions up to 50; default 25)

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const GROUP = process.env.TURSO_GROUP || "default";
const TARGET = Number(process.argv[2] || 25);
const PREFIX = "spike-limit-";

const created = [];
const samples = [];
let firstFailure = null;

function nowMs() {
  // process.hrtime is allowed; Date.now() is avoided in some sandboxes but fine here.
  const [s, ns] = process.hrtime();
  return s * 1000 + ns / 1e6;
}

console.log(`Provisioning up to ${TARGET} DBs in group "${GROUP}" to find real limits…\n`);

for (let i = 0; i < TARGET; i++) {
  const name = `${PREFIX}${i}`;
  const t0 = nowMs();
  try {
    await run("turso", ["db", "create", name, "--group", GROUP]);
    const ms = Math.round(nowMs() - t0);
    created.push(name);
    samples.push(ms);
    console.log(`#${i} created in ${ms}ms`);
  } catch (e) {
    firstFailure = { index: i, ms: Math.round(nowMs() - t0), msg: String(e.stderr || e.message) };
    console.error(`#${i} FAILED after ${firstFailure.ms}ms:\n${firstFailure.msg}`);
    console.error(
      "^ This is the cap. Note whether it's a RATE limit (retry succeeds later) " +
        "or a CEILING (active-DB cap). Record both interpretations in FINDINGS.md.",
    );
    break;
  }
}

if (samples.length) {
  const sorted = [...samples].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted.at(-1);
  console.log(
    `\nlatency: n=${samples.length} min=${sorted[0]}ms p50=${p50}ms p95=${p95}ms max=${sorted.at(-1)}ms`,
  );
}
console.log(`successfully created: ${created.length} DB(s)`);
console.log(
  firstFailure
    ? `first failure at #${firstFailure.index}`
    : "no failure within target — raise TARGET to find the real cap.",
);

// Cleanup (task 4.4 still applies — verify with `turso db list`).
console.log("\nCleaning up throwaway DBs…");
for (const name of created) {
  try {
    await run("turso", ["db", "destroy", name, "--yes"]);
    console.log(`destroyed ${name}`);
  } catch (e) {
    console.error(`could not destroy ${name}: ${e.message} — clean up manually.`);
  }
}
