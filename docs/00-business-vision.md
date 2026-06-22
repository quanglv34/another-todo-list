# Business Vision

_Last updated: 2026-06-22_

## 1. Vision statement

> **A calm, offline-first home for your tasks and your time — so you always know what to do next, and where your hours actually go, whether or not you have signal.**

Most tools make you choose: organize tasks _or_ plan your day _or_ track time. We unify all three in one private, reliable place that works the moment you open it — on a plane, in a subway, or at your desk.

## 2. The problem

People who manage their own work juggle 2–3 disconnected tools:

- a **todo app** (Todoist/TickTick) to capture and organize,
- a **calendar / planner** (Sunsama/Motion) to decide _when_,
- a **time tracker** (Toggl/clock) to know where time went.

The seams between them cost time, break offline, and mean _plan vs. actual_ is never visible in one view. And cloud-only tools fail exactly when focus matters most — no connection, or no desire to send personal data to a server.

## 3. Target customers

We start narrow, not "everyone."

| Segment                                     | Who                                                             | Core pain                                                | Why us                                          |
| ------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| **Primary: Self-managed knowledge workers** | Freelancers, consultants, developers, designers, indie founders | Plan + track billable/focus time; flaky connectivity     | Offline-first + native time tracking in one app |
| **Secondary: Intentional planners**         | People who run a daily/weekly planning ritual                   | Want plan _and_ actuals in one place, calmer than Motion | Multi-view (table/list/calendar) + time ledger  |
| **Tertiary: Privacy / local-first crowd**   | Devs, students, privacy-conscious users                         | Don't trust cloud-only; want data ownership              | Local-first storage, optional sync              |

**Beachhead:** _self-managed knowledge workers who bill or budget their time_ — they feel both pains (planning **and** time accounting) acutely and will pay.

## 4. Value proposition

```
TARGET    Self-managed knowledge workers who plan their week and care where time goes
PROBLEM   3 disconnected tools (tasks / calendar / time), all break offline
SOLUTION  One offline-first app: collections + day/week views (table·list·calendar)
          + quick capture by date + built-in time tracking
VALUE     ~30–60 min/week saved switching & reconciling tools; honest time data;
          works with zero connection; personal data stays on device by default
```

## 5. Positioning

```
                       PREMIUM ($16–20/mo)
                              │
   Sunsama ●  Akiflow ●       │       ● Motion (AI auto-schedule)
   (planning ritual,          │         online-only
    calendar-first)           │
   ───────────────────────────┼───────────────────────────  TIME-AWARE →
   Todoist ○    TickTick ○     │   ◆ US: local-first + time tracking
   (cloud tasks)              │      + multi-view, mid-price (~$4–6/mo)
   Things 3 ○ (Apple)         │
   Super Productivity ○ (FOSS)│       ○ Microsoft To Do (free)
                              │
                       FREE / BUDGET
```

**Positioning statement:**
For self-managed knowledge workers who plan their week and track their time, **[Product]** is an offline-first task & time app that unifies organizing, planning, and time tracking in one private place — unlike Todoist or TickTick (cloud-first, no real time ledger) and unlike Sunsama or Motion (online-only and 3–4× the price).

## 6. Business model

**Freemium SaaS** with optional managed sync.

| Tier              | Price (target)       | Includes                                                                                                                   |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Free**          | $0                   | Local-first on one device, unlimited tasks, basic list + day view, manual time tracking                                    |
| **Pro**           | ~$4–6/mo ($48–60/yr) | Multi-device encrypted sync, calendar + week table views, quick-by-date capture, full time tracking + reports, collections |
| **Teams (later)** | ~$8/user/mo          | Shared collections, role permissions, team time reports                                                                    |

Rationale: priced **above** TickTick's value floor but **well below** Sunsama/Motion — justified by offline-first reliability + time tracking that neither side offers together. Sync (real cost driver) is the natural paywall; local use stays free, which fits the privacy ethos and lowers acquisition friction.

### Key metric: Monthly Recurring Revenue (MRR)

Drivers to watch:

- **Free → Pro conversion rate** (target ≥3–5% over time).
- **Churn** (target <5%/mo; offline reliability + accumulated time history are natural retention moats).
- **ARPU** (~$5/mo at Pro).

### Illustrative unit economics (assumptions, to validate)

```
Pro price            $5/mo
Gross margin         ~85% (mostly sync/storage + payment fees)
Monthly churn        4%  (target)
LTV  = ($5 × 0.85) / 0.04   ≈ $106 per Pro user
Target CAC           ≤ $35  (mostly content/SEO/word-of-mouth, low paid)
LTV/CAC              ≈ 3.0   → healthy IF CAC stays low
```

> These are **planning assumptions, not facts** — validate churn and CAC with real cohorts before scaling spend. The model only works if acquisition stays largely organic.

## 7. Why now

- Offline-first has shifted from nice-to-have to expected, with maturing sync tech (CRDTs, local-first frameworks).
- Proven willingness to pay for _planning + time_, but only at premium prices today — room for a mid-tier.
- Privacy/local-first demand is loud but underserved by polished, mainstream products.

## 8. Success metrics (first 12 months)

| Metric                           | Why it matters                         | Direction   |
| -------------------------------- | -------------------------------------- | ----------- |
| Weekly active users (WAU)        | Real engagement, not signups           | ↑           |
| % users tracking time weekly     | Proves the differentiating habit lands | ↑           |
| Free → Pro conversion            | Revenue engine                         | ↑ ≥3%       |
| Sync reliability / conflict rate | Core promise must hold                 | conflicts ↓ |
| Monthly churn                    | Sustainability                         | <5%         |
| NPS among beachhead segment      | Right users love it                    | ↑           |

## 9. Guardrails (what we are NOT)

- **Not** an enterprise project-management suite (no Gantt, sprints, heavy collaboration) — that's Asana/Jira/ClickUp territory.
- **Not** an AI auto-scheduler — calm and manual-by-default, not Motion.
- **Not** cloud-only — offline is the spine, not a fallback.
