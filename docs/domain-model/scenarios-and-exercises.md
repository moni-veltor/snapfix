# Scenarios & exercises

Scenarios are the *design* — what the test looks like. Exercises are the *run* — a specific live execution of a scenario.

## Scenario (design-time)

`Scenario` carries the framing + CMORG metadata + child records:

* Framing: `title`, `background`, `agenda`, `dDayDate`, `durationMin`
* CMORG: `category`, `srrRef`, `tier`, `firmProfile`, `cause`, `impactNarrative`, `characteristics[]`, `assumptions[]`, `compoundScenarioNotes`, `takeaways`, `stressVariables` (JSON), `caseStudy` (JSON)
* Coverage flags: `coversPeople`, `coversProperty`, `coversTechnology`, `coversDataAvailability`, `coversDataIntegrity`, `coversThirdParty`
* Template metadata: `isTemplate` (true = library template, no `orgId`), `templateOriginId` (FK to the template a cloned scenario came from)

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
* D-Day clock: `startedAt`, `speedMultiplier` (1.0 = real time, 6.0 = compress a 9-hour scenario into 90 minutes)
* People: `ExerciseTeam`, `ExerciseParticipant`, `ExerciseSeat`
* Released artefacts: `EventRelease`, `InjectRelease` — when a scheduled event/inject crossed the D-Day clock or was facilitator-triggered
* Live capture: `IncidentLogEntry`, `ParticipantResponse`, `CommunicationDraft`, `Sitrep`, `IMTMeeting`, `DecisionRecord`, `BCPActivation`, `RegulatorNotification`, `ChatMessage`, `Reaction`, `ExerciseScratchpad`
* Receipts: `EventReceipt`, `InjectReceipt` — confirms a participant saw a released item
* Tolerance: `ImpactBreach` — per-IBS, when target tolerance was exceeded

## The D-Day clock

Scenarios are written in **D-Day time**: event times are `HH:MM` from start. When an exercise runs, the facilitator anchors D-Day to wall-clock time (`startedAt`) and optionally applies a `speedMultiplier`. The current D-Day time is computed in `src/lib/dday.ts`:

```
ddayMinutes = ((now - startedAt) * speedMultiplier) / 60_000
```

Scheduled events / injects are auto-released when D-Day passes their scheduled time. Unscheduled ones are facilitator-triggered.

The runtime polling component is `LivePoller` (default 10s), which pauses when the tab is hidden.

## Post-exercise

* `DebriefAnswer` — per-question answers captured in the debrief
* `AfterActionReport` — the facilitator's narrative summary
* `ExerciseActionItem` — corrective actions assigned with owners and due dates
* `PostIncidentReport`, `Retrospective` — for runs triggered by an actual incident rather than a planned exercise

## See also

* [Scenario library](../libraries/scenarios.md) — TS-backed catalogue + clone action
