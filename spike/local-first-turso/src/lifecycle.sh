#!/usr/bin/env bash
# Tasks 3.1 / 3.2 / 3.3 — per-user DB lifecycle under sync-opt-in provisioning.
# Requires the Turso CLI (`turso auth login` done) and a Developer-Plan account.
#
# Demonstrates the lifecycle the design commits to:
#   3.1 provision-on-opt-in : no DB exists until "sync enabled"
#   3.2 seed-push           : push existing LOCAL rows into the fresh empty DB
#                             (this REPLACES the anon→registered row-reassignment
#                              UPDATE in apps/web/src/server/auth.ts:54-59)
#   3.3 deprovision-on-delete
#
# NOTE: in @tursodatabase/sync the "opt-in" is also a code primitive —
#   url: () => syncEnabled ? dbUrl : null
# starts local-only and switches sync on when the URL becomes non-empty. This
# script covers the SERVER side (the actual DB create/destroy); the client-side
# flip is exercised by the browser/node harnesses.
set -euo pipefail

ORG="${TURSO_ORG:?set TURSO_ORG}"
USER_ID="${1:-spike-user-alice}"
DB_NAME="spike-${USER_ID}"

echo "== 3.1 provision-on-opt-in =="
echo "Before opt-in, NO data-plane DB exists for ${USER_ID} (local-WASM only)."
echo "User toggles sync ON -> provision now:"
time turso db create "${DB_NAME}" --group default
DB_URL="$(turso db show "${DB_NAME}" --url)"
echo "provisioned: ${DB_URL}"

echo
echo "== 3.2 seed-push (replaces the cross-DB row migration) =="
echo "Mint a short-lived, DB-scoped token for the client to seed-push into:"
turso db tokens create "${DB_NAME}" --expiration 5m
echo ">> Now run the client seed-push against ${DB_URL} with that token."
echo ">> Expectation: client's existing LOCAL todos land in this fresh empty DB"
echo ">> in ONE push() — no SELECT/UPDATE across two databases."

echo
echo "== verify rows landed =="
turso db shell "${DB_NAME}" "SELECT count(*) AS seeded_rows FROM todos;" || \
  echo "(todos table not present yet — run the client seed-push first)"

echo
echo "== 3.3 deprovision-on-delete =="
echo "Simulating account deletion -> tear the data-plane DB down:"
read -r -p "Destroy ${DB_NAME}? [y/N] " ok
if [[ "${ok}" == "y" ]]; then
  turso db destroy "${DB_NAME}" --yes
  echo "destroyed ${DB_NAME} — clean teardown path confirmed."
else
  echo "skipped destroy — remember to clean up (task 4.4)."
fi
