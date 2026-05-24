# Scenarios & exercises

Scenarios are the *design* — what the test looks like. Exercises are the *run* — a specific live execution of a scenario.

## Scenario (design-time)

`Scenario` carries the framing + CMORG metadata + child records:

* Framing: `title`, `background`, `agenda`, `dDayDate`, `durationMin`
* CMORG: `category`, `srrRef`, `tier`, `firmProfile`, `cause`, `impactNarrative`, `characteristics[]`, `assumptions[]`, `compoundScenarioNotes`, `takeaways`, `stressVariables` (JSON), `caseStudy` (JSON)
* Coverage flags: `coversPeople`, `coversProperty`, `coversTechnology`, `coversDataAvailability`, `coversDataIntegrity`, `coversThirdParty`
* Template metadata: `isTemplate` (true = library template, no `orgId`), `templateOriginId` (FK to the template a cloned scenario came from)
* Compound: `compoundParentId`, `compoundOrderIdx` — when a scenario is a child phase of a multi-phase compound scenario

**Children of `Scenario`:**

* `ImportantBusinessService` — IBS rows used *inside* this scenario (not the same as the org's `OrganizationIBS` register — see [Domain overview](overview.md))
* `Event` — MSEL events with `eventNo`, `scheduledTime` (HH:MM), `title`, `description`, `expectedActions[]`, `objectives[]`, optional `senderRoleTitle` + `toRoleTitles[]` + `ccRoleTitles[]` for addressing
* `Inject` — supplementary stimuli inside an event window. `injectNo`, `scheduledTime`, `summary`, `description`, `relation`, `kind` (`BUSINESS` | `TECHNICAL`)
* `FacilitatorQuestion`, `DebriefQuestion` — the question banks asked during and after the run

## Two scenario "libraries"

Both exist deliberately:

* **`/templates`** — DB-backed. ~14 deep CMORG-shaped templates with full nested events + injects. Cloning produces a fully-fleshed `Scenario` ready to run. Behind the scenes, these are `Scenario` rows with `isTemplate: true` and `orgId: null`.
* **`/scenarios/library`** — TS-backed. 158+ sector-tagged scenario *shells* (title, framing, coverage flags, optional `seedEvents`). Cloning produces a stub `Scenario`; the facilitator authors the MSEL themselves. Driven by `src/lib/library/scenarios/`.

See [Scenario library](../libraries/scenarios.md) for why both exist.

## Exercise (run-time)

`Exercise` is a *specific run* of a `Scenario`:

* Identity: `id`, `orgId`, `scenarioId`, `title`, `dDayDate`, `durationMin`, `status` (`PLANNED` | `RUNNING` | `PAUSED` | `COMPLETED`)
* Mode: `mode` (`PRODUCTION | WALKTHROUGH | DRY_RUN | TABLETOP | LIVE`), `regulatorMode` (boolean — enables hash-chain audit)
* D-Day clock: `startedAt`, `speedMultiplier` (1.0 = real time, 6.0 = compress a 9-hour scenario into 90 minutes)
* People: `ExerciseTeam`, `ExerciseParticipant`, `ExerciseSeat`
* Released artefacts: `EventRelease`, `InjectRelease` — when a scheduled event/inject crossed the D-Day clock or was facilitator-triggered
* Live capture: `IncidentLogEntry`, `ParticipantResponse`, `CommunicationDraft`, `Sitrep`, `IMTMeeting`, `DecisionRecord`, `BCPActivation`, `RegulatorNotification`, `ChatMessage`, `Reaction`, `ExerciseScratchpad`
* Receipts: `EventReceipt`, `InjectReceipt` — confirms a participant saw a released item
* Tolerance: `ImpactBreach`, `LiveTolerance` — per-IBS, target vs actual minutes since first impact
* Runbooks: `RunbookExecution` — frozen snapshot of any runbook activated against this exercise
* Facilitator surface: `FacilitatorAnnouncement` — broadcast messages from the control desk to participants
* Approvals: `ApprovalRequest` — dual-control approvals queued during the run

## The D-Day clock

Scenarios are written in **D-Day time**: event times are `HH:MM` from start. When an exercise runs, the facilitator anchors D-Day to wall-clock time (`startedAt`) and optionally applies a `speedMultiplier`. The current D-Day time is computed in `src/lib/dday.ts`:

```
ddayMinutes = ((now - startedAt) * speedMultiplier) / 60_000
```

Scheduled events / injects are auto-released when D-Day passes their scheduled time. Unscheduled ones are facilitator-triggered.

The runtime polling component is `LivePoller` (default 10s), which pauses when the tab is hidden. See [Live workspace](../architecture/live-workspace.md) for the polling cadences across the live surfaces.

## Sitrep cadence + auto-escalation

`Sitrep` rows are paced by `nextDueAt`, computed from the IBS impact tolerance + a category multiplier. `src/lib/sitrep-state.ts` exposes `deriveSitrepCadence(exercise, lastSitrep, now)` returning one of four tiers:

| Tier | When | UI |
|---|---|---|
| `INFO` | next sitrep > 5 minutes out | quiet line |
| `DUE` | within ±2 min of `nextDueAt` | amber chip |
| `ESCALATED` | > 5 min overdue | orange chip + nudge |
| `CRITICAL` | > 15 min overdue OR tolerance breached + no sitrep since | rose chip + facilitator alert |

Escalations write `IncidentLogEntry` rows of action `sitrep.escalated` so the audit trail captures the pressure transition. The cadence is surfaced on the participant **Status** tab + the facilitator overview.

## Live tolerance burn-down

`LiveTolerance` is a derived row keyed `(exerciseId, ibsId)`. For each IBS in scope, it tracks `targetMin`, `elapsedMin` (since first impact), and `state` (`OK | AT_RISK | BREACHED`). Computed by `recomputeLiveTolerance(exerciseId)` on every poll tick + on capture-drawer submit.

The live workspace renders a per-IBS progress bar (green → amber → rose) so the IMT can see the burn-down in real time. A breach automatically opens an `ImpactBreach` row + writes `tolerance.breached` to the incident log.

## Facilitator announcements

`FacilitatorAnnouncement` is a typed broadcast from the control desk:

* `kind` (`HEADS_UP | INSTRUCTION | PAUSE | RESUME | WRAP_UP`)
* `message` (≤ 280 chars)
* `releasedAt` (server timestamp)
* `acknowledgedBy: Json` — participant IDs that hit "got it"

Renders as a sticky banner on the participant surfaces with an "Acknowledge" button. The facilitator overview shows the ack roster (who's seen it, who hasn't).

## Approvals queue

`ApprovalRequest` represents a decision that needs sign-off. Carries `decisionTypeCode`, `requesterId`, `approverIds[]`, `status` (`PENDING | APPROVED | REJECTED`), `requiresDualControl` (mirrored from `OrgDecisionType` at request time).

The live workspace ApprovalsDock surfaces pending requests for current approvers; the chip on the live header shows the count. Dual-control requests need two distinct approvers' sign-offs before flipping to APPROVED (currently soft-enforced — see [Vendors & tech systems](vendors-and-tech.md) for the dual-control flag origin).

## Post-exercise

* `DebriefAnswer` — per-question answers captured in the debrief
* `AfterActionReport` — the facilitator's narrative summary
* `ExerciseActionItem` — corrective actions assigned with owners and due dates
* `PostIncidentReport`, `Retrospective` — for runs triggered by an actual incident rather than a planned exercise
* `Wellbeing` — anonymous pulse-check responses collected on debrief close
* `EvidencePack` — generated XLSX + PDF bundle for regulator-evidence-mode runs

## See also

* [Scenario library](../libraries/scenarios.md) — TS-backed catalogue + clone action
* [Live workspace](../architecture/live-workspace.md) — the runtime layer
* [Runbooks subsystem](../architecture/runbooks.md) — execution snapshots attached to incidents
* [Audit log](audit-log.md) — every release, capture, escalation audits
