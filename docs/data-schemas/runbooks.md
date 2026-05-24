# Runbooks

`Runbook` is a per-org playbook (or a library template when `isTemplate = true`). It carries the category, the owner role, the tier filter (`applicableTiers`), the review + drill timestamps, and the status (DRAFT / PUBLISHED / ARCHIVED).

`RunbookStep` is one ordered step. The `kind` is the most important field — each kind drives a different side-effect when the step completes:

- `ACTION` — owner-role marks complete; no side-effect.
- `DECISION` — completion auto-writes a `DecisionRecord` (and an `IncidentLogEntry`) using `decisionTypeCode`.
- `NOTIFICATION` — starting the step creates a `RegulatorNotification` with the SLA clock from `regulatorTrigger`; completing flips it to SENT.
- `COMMS` — starting creates a `CommunicationDraft` from `commsTemplate`; completing marks it APPROVED.
- `CHECKPOINT` — coordination point ("everyone signed off").

`dependsOn` is a string array of earlier step slugs; the clone action resolves these to `blocksOrders` (integer indices) so the DAG is stored in a single canonical form.

`RunbookIBSLink`, `RunbookScenarioLink`, and `RunbookTriggerCondition` wire the runbook to the rest of the platform. `RunbookEscalation` is the self-join that chains runbooks — when a ransomware runbook fires, it can auto-escalate to BCP activation, FCA notification, ICO 72h, etc. The clone resolver inserts these in both directions (forward + reverse) so chains work however the user activates the first runbook.

`RunbookExecution` is the live snapshot — `runbookJson` freezes the runbook + every step at activation time. Edits-after-activation never alter the historical record; step completion writes back to `RunbookStepExecution` (one per step, per execution).

## Diagram

![Runbooks ERD](img/runbooks.svg)

## Source

```puml
@startuml runbooks
hide circle
hide methods
skinparam linetype ortho
skinparam shadowing false
skinparam defaultFontName "Inter, system-ui, sans-serif"
skinparam ArrowColor #6366F1
skinparam entity {
  BackgroundColor #FFFFFF
  BorderColor #C7D2FE
  HeaderBackgroundColor #EEF2FF
  HeaderFontColor #3730A3
  FontColor #0F172A
  AttributeFontColor #475569
  AttributeFontSize 11
}

title <font color=#3730A3>**Runbooks**</font>

entity "Runbook" as RB {
  *id : string
  --
  *orgId : string?
  title : string
  description : string?
  category : enum
  ownerRoleTitle : string?
  status : enum
  isTemplate : boolean
  applicableTiers : enum[]
  lastReviewedAt : DateTime?
  lastDrilledAt : DateTime?
  createdAt : DateTime
}

entity "RunbookStep" as Step {
  *id : string
  --
  *runbookId : string
  orderIdx : int
  title : string
  description : string?
  kind : enum
  ownerRoleTitle : string?
  estimatedMin : int?
  blocksOrders : int[]
  decisionTypeCode : string?
  regulatorTrigger : Json?
  commsTemplate : Json?
}

entity "RunbookIBSLink" as RIBS {
  *id : string
  --
  *runbookId : string
  *ibsId : string
}

entity "RunbookScenarioLink" as RScLink {
  *id : string
  --
  *runbookId : string
  *scenarioId : string
}

entity "RunbookTriggerCondition" as Trig {
  *id : string
  --
  *runbookId : string
  severityAtLeast : enum?
  scenarioCategoryEquals : string?
}

entity "RunbookEscalation" as Esc {
  *id : string
  --
  *sourceRunbookId : string
  *targetRunbookId : string
  severityAtLeast : enum?
  rationale : string?
  orderIdx : int
}

entity "RunbookExecution" as RX {
  *id : string
  --
  *runbookId : string
  *incidentId : string
  runbookJson : Json
  activatedBy : enum
  activationReason : string?
  status : enum
  activatedAt : DateTime
  completedAt : DateTime?
}

entity "RunbookStepExecution" as RSX {
  *id : string
  --
  *executionId : string
  stepOrderIdx : int
  status : enum
  startedAt : DateTime?
  completedAt : DateTime?
  completedById : string?
  decisionRecordId : string?
  regulatorNotificationId : string?
  communicationDraftId : string?
}

RB ||--o{ Step
RB ||--o{ RIBS
RB ||--o{ RScLink
RB ||--o| Trig
RB ||--o{ Esc : "source / target (self-join)"
RB ||--o{ RX

RX ||--o{ RSX

note bottom of RX
  runbookJson is a deep snapshot at
  activation — edits to the runbook
  after this never alter the historical
  record. Step completion writes back
  to RunbookStepExecution.
end note

note right of Step
  Step kinds drive auto-side-effects:
  DECISION → DecisionRecord on completion
  NOTIFICATION → RegulatorNotification SENT
  COMMS → CommunicationDraft APPROVED
end note

@enduml
```

Canonical source: [`src/runbooks.puml`](src/runbooks.puml).
