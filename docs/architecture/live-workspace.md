# Live workspace

The `/exercises/[id]/live` page is the largest single composition in the app — one server component (~800 LOC) that orchestrates ~20 client widgets, every one polling, draining, capturing or rendering live state.

## Render shape

```
<div>
  <FirstTimeLiveTour />           // one-shot client modal
  <header />                       // role + clock + live score
  <IncidentBanner />               // top stripe
  <FacilitatorAnnouncementsBanner /> // toast + sticky band
  <MyApprovalsDock />              // pinned decisions + comms queues
  <LiveToleranceBreachPanel />     // per-IBS burn-down
  <ActivityTicker />               // recent events
  <LiveTabs>
    briefing  · inbox · runbook · decisions · comms · team
  </LiveTabs>
  <LivePoller intervalMs={10_000} /> // routes router.refresh()
  <InjectArrivalNotifier />          // modal-once-per-inject
  <FloatingChatDrawer />             // back-channel
</div>
```

## The five poll cadences

| Cadence | Source | What refreshes |
|---|---|---|
| 3 s | `DDayClockTicker` (client interval) | D-Day clock |
| 3 s | `LivePresenceBar` (client interval) | Presence (online/offline) |
| 10 s | `LivePoller` (`router.refresh()`) | Whole-page revalidate — inbox · feed · approvals · sitreps · runbook executions · everything else |
| Once on visit | `InjectArrivalNotifier` | Modal-once-per-inject (one shot per session) |
| Manual | Form submits via `revalidatePath` server-side | Immediate refresh of the relevant page when the participant submits |

## Parallel data fetch

The page loader runs ~15 prisma queries in one `Promise.all`:

```ts
const [
  inbox, feed, presence, myResponses, activeIncident,
  regulatorClocks, commsDrafts, bcpActivation, orgUsers,
  myActionItems, recentReleases, orgDecisionPresets,
  approvalsQueue, announcementRows, recentSitreps,
] = await Promise.all([...]);
```

Plus a sequential fan-out for runbook executions, linked decisions, linked notifications, linked comms drafts, live tolerance rows, available runbooks, nudges.

When extending: prefer adding to the `Promise.all` over an extra sequential `await` to keep TTFB stable.

## Seat lobby short-circuit

If the user lands on `/live` with no participant row + no claimed seat, the page short-circuits to `<SeatLobby>` — the "war-room lobby" view (card grid of available seats, family filters, presence ribbon). Claiming a seat creates the `ExerciseParticipant` row and the page reloads into the normal layout.

## Tabs (`<LiveTabs>`)

Five tabs with badge counters: `briefing · inbox · runbook · decisions · comms · team`. Selected tab persists in localStorage per exercise. Each tab is a panel-prop to `LiveTabs`; only the active panel is in the visible DOM.

The Decisions tab hosts the heavy capture surface — `<IncidentCapturePanel>` is a row of 5 fire-from-context drawer launchers (Log entry · Decision · Sitrep · IMT meeting · Comms draft).

## The approvals dock (`<MyApprovalsDock>`)

Pinned just below the incident banner for any participant whose role is in any pending decision's `approverRolesRequired` (case-insensitive match against `participant.roleTitle`, seat `role.title`, seat `role.abbreviation`) or who is the assigned / default approver on a comms draft.

Server-side filter logic lives in `src/lib/approvals.ts`. Default-approver map for comms drafts is hardcoded per `CommsStakeholder` (e.g. REGULATORS → CEO + CRO; CUSTOMERS → CEO + Head of Comms).

## The change detector (`useChangeDetector`)

`src/lib/use-change-detector.ts` is the diff hook used by `MyCommsDraftsPanel` and `MyExerciseActionItems`:

```ts
const flashing = useChangeDetector(items, signatureOf, onChange);
```

Seeds silently on first render. On subsequent renders, walks the items and compares each `signatureOf(item)` to the snapshot. Calls `onChange({ kind: "added" | "updated", item })` per delta. Returns a `Set<string>` of recently-changed ids for the row "Updated" pill (8s default flash).

Use it whenever you want toast-on-server-data-change without WebSockets.

## Facilitator announcements

`FacilitatorAnnouncement` is a server-written row with `kind: BROADCAST | BULK_RELEASE | RECALL | SCRUB`. The four facilitator actions in `src/app/actions/facilitator.ts` each write one alongside their primary side-effect. `FacilitatorAnnouncementsBanner` renders the recent rows + fires sonner toasts on each new arrival (deduped via `useChangeDetector`). `BROADCAST` rows pin until the participant dismisses them (per-exercise localStorage key); the other kinds auto-fade 90s after creation.

## Sitrep cadence + tolerance burn-down

* **`<SitrepCadenceBanner>`** computes four escalation tiers (QUIET / INFO / DUE / ESCALATED / CRITICAL) from the latest sitrep per BU + minutes-since-last. Toasts on tier upgrades (not on de-escalations). The "File sitrep now" CTA opens `<SitrepDrawer>` with the overdue BU pre-filled.
* **`<LiveToleranceBreachPanel>`** consumes `evaluateLiveTolerance(incidentId)` rows. For each IBS, computes elapsed-since-invocation vs declared `impactToleranceMin` and surfaces a status pill (OK · WARNING · AT_RISK · BREACHED) + a burn-down bar. Same logic that `evaluateToleranceBreaches` runs post-hoc, but seeded with "now" instead of `closedAt` so the panel can show "you have 8 minutes left" before the breach lands.

## Real-incident abort

`abortExerciseAction` (`src/app/actions/exercise-runtime.ts`) flips the exercise status to ABANDONED, captures `abortedAt` + `abortReason`, frees all participants, redirects to `/exercises/[id]`. Distinct from "completed" so the debrief view can label it appropriately.

## See also

* [Runbooks subsystem](runbooks.md) — runbook executions are nested inside the live workspace
* [Vendor-state engine](vendor-state-engine.md) — the alert pattern that the approvals dock + sitrep banner ride on
* [Scenarios & exercises](../domain-model/scenarios-and-exercises.md) — every model the page reads
