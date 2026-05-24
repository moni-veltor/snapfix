# During the run — live workspace

`/exercises/[id]/live` is the war-room. Participants land here when an exercise is running; the facilitator runs the show from `/exercises/[id]/facilitator`. Both views update every 10 seconds via the live poller.

## The top stripe — always visible

| Surface | What it tells you |
|---|---|
| **D-Day clock** | Time elapsed since the exercise started, scaled by the speed multiplier. Updates every 3 seconds. |
| **Incident banner** | Whether the IMT is invoked, current severity (overall + per-dimension), invoker, invocation time. "Stand up the IMT" CTA if not yet invoked. |
| **Facilitator announcements banner** | Toast + sticky banner whenever the facilitator broadcasts a message, bulk-releases injects, recalls one, or scrubs the clock. BROADCAST pins until dismissed; the others auto-fade after 90 seconds. |
| **Approvals dock** | Pinned for participants whose role is named on a decision's `approverRolesRequired` or who are an assigned/default comms-draft approver. Two grouped queues (decisions, comms) — click any row to review and one-click approve / reject. |
| **Live tolerance burn-down** | Per-IBS bar chart: elapsed vs declared impact tolerance. Status pills: OK · WARNING · AT_RISK · BREACHED. Auto-hides when no incident. |

## The tabbed centre — five tabs

* **Briefing** — your role briefing (responsibility + SMF flag + deputy chain); the sitrep-cadence banner; **your runbook queue** (cross-runbook list of steps assigned to your role); **your action items** in this run; nudges; a shared scratchpad.
* **Inbox** — every event + inject addressed to your role, with a `Test inject` chip on facilitator curveballs so you can tell scripted from fabricated.
* **Runbook** — active runbook executions for the current incident, with start / complete / skip actions per step. Manual-activate any DRAFT-published runbook from here too.
* **Decisions** — the IncidentCapturePanel (drawer-launcher row: Log entry · Decision · Sitrep · IMT meeting · Comms draft) plus the closure-gate, BCP activation, runbook executions, and incident-log feed.
* **Comms** — your authored drafts + the org-wide comms cascade panel (rows are clickable for full body + status timeline).
* **Team** — presence bar + the seat board.

## The change-detector pattern

Two panels watch for changes since you last looked and surface them as toasts + a flashing "Updated" pill:

* **MyCommsDraftsPanel** — toast on draft transitions you authored (PENDING → APPROVED / REJECTED / SENT)
* **MyExerciseActionItems** — toast on new items assigned to you or priority changes

Toasts fire once per change, not per poll. The "Updated" pill stays on the row for 8 seconds.

## Sitrep cadence

The sitrep-cadence banner surfaces when an incident is invoked. Four escalation tiers:

| Tier | Trigger | Look |
|---|---|---|
| **INFO** | No sitreps filed yet | Amber soft banner, "File sitrep now" button |
| **DUE** | A BU is overdue by < 30 min | Amber, same CTA |
| **ESCALATED** | Overdue by 30–60 min | Rose; sonner toast fires once on tier cross |
| **CRITICAL** | Overdue > 60 min | Rose ring around banner; sonner toast |

Click **File sitrep now** to open the SitrepDrawer with the full form (BU, status, summary, issues, asks, next-update D-Day). If the cadence is slipping, the drawer pre-fills the overdue BU.

## Capture actions

Every capture form lives in a **fire-from-context drawer**, not a tab:

* **Log entry** — observation / action / risk / ask / evidence / challenge / resource / note
* **Decision** — formal decision with approver chain + auto-link to the inject that triggered it
* **Sitrep** — BU state-of-the-world
* **IMT meeting** — standing-agenda minutes + next meeting time
* **Comms draft** — stakeholder message + body, awaits approval

Each drawer auto-closes on successful submit and toasts the result.

## Facilitator surface

`/exercises/[id]/facilitator` is OWNER/ADMIN-only and adds:

* Run-sheet (every event + inject with release controls)
* Read-receipt grid (per-participant × per-message)
* Sitrep gap panel (latest sitrep per BU + how long overdue)
* Runtime controls (pause, scrub clock backward / forward, broadcast, fire a curveball inject, abort)
* Compose inject (ad-hoc inject creation in-flight)

The facilitator can also see the participant view by opening `/live` — they share the same primary surface.

## Real-incident abort

If a real incident takes over the war-room, click **Abort** on the facilitator runtime controls. Captures the reason, flips status to `ABANDONED`, frees all participants, preserves the captured state. The audit log distinguishes "ABANDONED for real incident" from "ABANDONED because no-show".

## See also

* [After the run — debrief](after-the-exercise.md)
* [Runbooks & drills](runbooks.md)
* [Audit log & regulator evidence](audit-and-evidence.md)
