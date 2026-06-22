# Market Research — Todo & Personal Productivity Apps

_Last updated: 2026-06-22_

## 1. Market size & growth

The product sits at the intersection of three adjacent markets:

| Market                    | 2026 size                                  | Growth (CAGR)  | Source                                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task management software  | ~$5–6.5B (estimates vary by scope)         | ~13–15%        | [The Business Research Company](https://www.thebusinessresearchcompany.com/report/task-management-software-global-market-report), [Fortune Business Insights](https://www.fortunebusinessinsights.com/task-management-software-market-102249) |
| Productivity apps (broad) | ~$14.5B → $30.9B by 2034                   | ~9.9%          | [Fortune Business Insights](https://www.fortunebusinessinsights.com/productivity-apps-market-110254)                                                                                                                                          |
| Time-tracking software    | growing sub-segment, often sold separately | ~double digits | —                                                                                                                                                                                                                                             |

**Takeaway:** A large, healthy, double-digit-growth market — but mature and crowded. Winning here is **not** about "another todo list"; it's about owning a _defensible wedge_ that incumbents structurally can't or won't copy.

## 2. Demand drivers

- **Hybrid / remote work** keeps personal task + time coordination growing.
- **Offline-first is rising from "feature" to "strategy."** ~2.9B people still lack reliable internet, and even in cities connectivity drops in transit, flights, basements. Enterprises report meaningful productivity gains from offline-capable apps. ([Octal](https://www.octalsoftware.com/blog/offline-first-apps), [Medium](https://medium.com/@tekwrites/why-offline-first-apps-are-dominating-2026-c76e5083d686))
- **Privacy / local-first** is a real, vocal segment (Super Productivity, Obsidian Tasks, Logseq, Joplin, Taskwarrior). ([Super Productivity](https://super-productivity.com/blog/best-local-first-todo-apps-2026/))
- **Time-blocking & intentional planning** ritual apps (Sunsama, Akiflow, Motion) have proven users will pay $16–20/mo for _planning_, not just _listing_.

## 3. Competitive landscape

| Product                | Model & price (2026)                                               | Strengths                                               | Gaps vs. your wedge                                                |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------ |
| **Todoist**            | Freemium SaaS. Free (5 projects), Pro ~$5/mo, Business ~$8/user/mo | Cross-platform, natural-language capture, ecosystem     | Cloud-only sync; no native time tracking; calendar is add-on       |
| **TickTick**           | Freemium. Premium ~$36/yr ($2.99–3.99/mo)                          | Best value; bundles list + calendar + Pomodoro + habits | Cloud-first; Pomodoro ≠ true time ledger; offline is weak          |
| **Things 3**           | One-time purchase (~$80 across devices)                            | Beautiful, calm UX                                      | Apple-only; no time tracking; no real-time collab/sync flexibility |
| **Microsoft To Do**    | Free                                                               | Free, Outlook integration                               | Basic; no time tracking; no calendar/table views                   |
| **Sunsama**            | SaaS ~$16–20/mo                                                    | Guided daily/weekly planning ritual, calendar-first     | Online-only; expensive; light on offline & time _ledger_           |
| **Akiflow**            | SaaS ~$19/mo annual                                                | Command bar, aggregates tasks from many tools           | Online-only; expensive; aggregator, not a home base                |
| **Motion**             | SaaS ~$20/mo                                                       | AI auto-scheduling                                      | Online-only; opaque AI; expensive                                  |
| **Super Productivity** | Free / open-source                                                 | Local-first + built-in time tracking                    | Techie UX; weak multi-device sync; no managed cloud                |

Sources: [Todoist pricing](https://www.morgen.so/blog-posts/todoist-pricing), [TickTick pricing](https://checkthat.ai/brands/ticktick/pricing), [Apps ranked 2026](https://unstar.app/blog/todoist-ticktick-things-3-microsoft-todo-apple-reminders-todo-apps-ranked-2026), [Akiflow vs Sunsama](https://thebusinessdive.com/akiflow-vs-sunsama), [Time-blocking apps 2026](https://arahi.ai/blog/best-time-blocking-apps-and-planners-2026).

## 4. The gap (why a new entrant can win)

```
            ORGANIZE TASKS         PLAN THE DAY          TRACK TIME
            (Todoist, TickTick)    (Sunsama, Motion)     (Toggl, Super Prod.)
                  │                      │                      │
   Cloud-only     ✔ strong               ✔ strong               ~ partial
   Offline-first  ✘ weak                 ✘ weak                 ~ (FOSS only)
   Time ledger    ✘ none / Pomodoro      ✘ light                ✔ but no planning
   Multi-view     ~ list+cal             ~ calendar             ✘
   (table/list/cal)
```

**No mainstream, well-designed product occupies all four rows at once.** That intersection — _offline-first reliability + native time tracking + flexible views + calm planning_, at a mid-tier price — is the wedge.

## 5. Risks & headwinds

- **Crowded & cheap.** TickTick already gives a lot for ~$36/yr; the free tier bar is high.
- **Sync is hard.** Offline-first conflict resolution (CRDTs / last-write-wins) is the core technical risk _and_ the core differentiator — it must be excellent.
- **Time tracking adds friction.** Must be near-zero-effort (timers, one-tap, auto from calendar) or users won't adopt it.
- **Switching costs favor incumbents.** Need frictionless import (Todoist/TickTick/Things) and a clear "why switch" story.
