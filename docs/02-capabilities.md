# Product Capabilities

_Last updated: 2026-06-22_

This maps the requested feature set to **capabilities** — what the product must _be able to do_ — with the business rationale and a rough priority. It is intentionally implementation-agnostic (the _what_, not the _how_).

## Capability map

```
┌─────────────────────────────────────────────────────────────┐
│                      [Product]                              │
│                                                             │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────┐   │
│   │ Identity &    │   │ Task &        │   │  Time          │   │
│   │ Sync          │   │ Collection    │   │  Tracking      │   │
│   │ (offline-1st) │   │ Management    │   │  (the wedge)   │   │
│   └──────────────┘   └──────────────┘   └───────────────┘   │
│           └───────────────┬────────────────────┘            │
│                  ┌──────────────────┐                       │
│                  │  Views & Planning │                      │
│                  │  table·list·cal   │                      │
│                  │  + quick-by-date  │                      │
│                  └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## C1 — Offline-first sync _(spine / differentiator)_

**What:** The app is fully usable with no connection; data lives locally first. When online, changes sync across the user's devices with reliable conflict resolution. Sync is optional (a paid, privacy-respecting layer), not a requirement to use the app.

**Why (business):** This is the structural moat incumbents can't easily copy without re-architecting. It's also the natural paywall (sync = the real cost driver) and the privacy story.

**Capabilities:**

- Work fully offline: create / edit / complete / track time with zero connectivity.
- Local-first persistence as the source of truth on-device.
- Multi-device sync with deterministic conflict resolution (e.g. CRDT or last-write-wins with clear rules).
- Encrypted sync; data stays on-device for free/local users.
- Transparent sync status (synced / pending / conflict) so users trust it.

**Acceptance signal:** Pull the network mid-edit on two devices → no data loss, predictable merge, visible status.

**Priority:** P0 (the promise — must be excellent from day one).

---

## C2 — Authentication & account

**What:** Lightweight identity so sync and (later) sharing work, without forcing account creation to _start_.

**Why (business):** Accounts gate paid sync and reduce churn (data tied to identity, recoverable). But mandatory signup kills activation — local-first lets users start instantly and create an account only when they want sync.

**Capabilities:**

- Use the app with no account (local only).
- Sign up / sign in to enable sync (email + passwordless or OAuth).
- Secure session handling; account recovery.
- Clear data-ownership & export (no lock-in builds trust with the local-first segment).

**Priority:** P0 for sync; signup stays optional for local use.

---

## C3 — Todo & collection management

**What:** Tasks organized into **collections** (lists / projects / areas). The organizing backbone.

**Why (business):** Table stakes — but quality of organization drives daily retention. Collections are how power users model their life/work and what creates switching cost over time.

**Capabilities:**

- Create / edit / complete / delete tasks (title, notes, due date, priority, tags).
- Group tasks into named collections; nest or group collections.
- Recurring tasks.
- Frictionless capture (fast add, natural-language date parsing).
- Import from Todoist / TickTick / Things to lower switching cost.

**Priority:** P0.

---

## C4 — Views: day / week in table, list & calendar

**What:** See the same tasks through multiple lenses — **list**, **table**, and **calendar** — across **day** and **week** horizons.

**Why (business):** Multi-view is a concrete edge over single-view apps and a visible "premium" surface. Table = power/planning users; calendar = time-blockers; list = everyday simplicity. Serving all three widens the addressable audience without three products.

**Capabilities:**

- **List view** — fast everyday triage.
- **Table view** — sortable/filterable grid by day or week (status, time, priority, collection).
- **Calendar view** — day & week, tasks placed by date/time; supports time-blocking.
- Consistent data across views; switching is instant and offline.

**Priority:** P1 (list first → calendar → table). List is part of P0; richer views are the Pro surface.

---

## C5 — Quick view by date

**What:** Jump to any date and see/capture what's planned — a fast "what's on this day" lens and quick-capture-into-a-date.

**Why (business):** Reduces capture friction (the #1 reason todo apps get abandoned) and reinforces the daily-planning ritual that drives habit and retention.

**Capabilities:**

- Date picker / jump-to-date with instant agenda.
- Quick add directly onto a chosen date.
- "Today" and "Upcoming" smart entry points.

**Priority:** P1.

---

## C6 — Time tracking _(the wedge)_

**What:** Track time spent on tasks — start/stop timers, manual entry, and reporting of plan vs. actual.

**Why (business):** This is the differentiator that justifies pricing above TickTick. Self-managed knowledge workers who bill or budget time get _honest data_ in the same place they plan it — something Todoist/TickTick/Sunsama don't offer together. Accumulated time history is also a powerful retention moat (users won't abandon their record).

**Capabilities:**

- One-tap start/stop timer per task; running timer always visible.
- Manual time entries and edits.
- Roll-up reports by task / collection / day / week (and plan vs. actual).
- Works fully offline; time data syncs like everything else.
- Near-zero friction (the adoption risk) — e.g. start timer from any view, auto-suggest from calendar blocks.

**Acceptance signal:** A user can plan a day, track against it, and at week's end see where hours actually went — without a second app and without a connection.

**Priority:** P1, but it is the _strategic_ feature — invest in making it frictionless, not just present.

---

## Priority summary & sequencing

| #   | Capability                  | Priority | Role                            |
| --- | --------------------------- | -------- | ------------------------------- |
| C1  | Offline-first sync          | P0       | Spine / moat / paywall          |
| C2  | Auth & account              | P0       | Enables sync, optional to start |
| C3  | Tasks & collections         | P0       | Backbone / table stakes         |
| C4  | Multi-view (table/list/cal) | P1       | Audience-widener / Pro surface  |
| C5  | Quick view by date          | P1       | Friction reducer / ritual       |
| C6  | Time tracking               | P1\*     | **The differentiator**          |

\* P1 in build order, but the strategic centerpiece — do not ship it as an afterthought.

### Suggested MVP cut (prove the wedge fastest)

**Local-first tasks + collections + list & day view + simple start/stop time tracking + quick add by date**, single device. This validates the unique value (tasks + time, offline) before investing in multi-device sync conflict resolution and the richer table/calendar views.

> **Sequencing update (2026-06-22):** The first implemented MVP is **cloud-backed and online-dependent**, not local-first. We brought **C2 (Auth & account)** forward and built persistence on **Cloudflare D1 + Drizzle** with **Better Auth** anonymous-first sign-in (zero-friction start, email/password upgrade). **C1 (offline-first / local-first sync)** is intentionally **deferred** to a later phase. Anonymous auth preserves the "use it without signing up" feel, but data lives in D1, not on-device. Revisit C1 as the differentiating "spine" once the cloud MVP is validated. See the `setup-auth-and-db` change.

```
MVP ──────────────▶ v1 ──────────────▶ v2
local-first         + encrypted sync   + week table view
tasks+collections   (multi-device)     + calendar/time-block
list+day view       + auth/accounts    + time reports & plan-vs-actual
basic time tracking + Pro paywall      + import from competitors
quick add by date                      + teams (later)
```
