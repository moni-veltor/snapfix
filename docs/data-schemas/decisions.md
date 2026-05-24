# Decisions, approvals & regulator notifications

`DecisionRecord` is the structured timestamp of every consequential call made during an exercise or incident — who recorded it, the rationale, the outcome, the approvers. Decisions reference either the built-in `DecisionType` enum (INVOKE_IMT, ACTIVATE_BCP, …) or an org-defined preset via `OrgDecisionType.code`.

`OrgDecisionType` is the per-org preset registry — `code`, `label`, `hint`, `approverRoles`, and the additive `requiresDualControl` flag that surfaces a "requires 2 approvers" chip in the IncidentCapturePanel + approvals dock. Hard enforcement of the two-approver gate is a planned follow-up.

`ExerciseApproval` is the per-exercise sign-off chain (PENDING → APPROVED / REJECTED). Regulator-mode exercises require at least one APPROVED row before they can be marked READY.

`BCPActivation` records a continuity activation — the dual-approval timestamps, mobilised recovery teams, the daily-liquidity gate, insurance-invocation decision. One row per activation, attached to either an exercise or an incident.

`RegulatorNotification` carries the SLA clock — `regulator` × `slaHours` × `triggeredAt` produces a `dueAt`. Completing the linked runbook NOTIFICATION step flips `status` to SENT and stamps `sentAt`.

## Diagram

![Decisions ERD](img/decisions.svg)

## Source

```puml
@startuml decisions
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

title <font color=#3730A3>**Decisions, approvals & regulator notifications**</font>

entity "OrgDecisionType" as DT {
  *id : string
  --
  *orgId : string
  code : string
  label : string
  hint : string?
  approverRoles : string[]
  requiresDualControl : boolean
}

entity "DecisionRecord" as DR {
  *id : string
  --
  *exerciseId : string?
  *incidentId : string?
  decisionType : enum
  decisionTypeCode : string?
  recordedById : string
  recordedAt : DateTime
  rationale : string
  outcome : string?
  approverIds : string[]
}

entity "ExerciseApproval" as Appr {
  *id : string
  --
  *exerciseId : string
  approverId : string
  status : enum
  decidedAt : DateTime?
  notes : string?
}

entity "BCPActivation" as BCP {
  *id : string
  --
  *exerciseId : string?
  *incidentId : string?
  activatedAt : DateTime
  activatedByIds : string[]
  recoveryTeams : string[]
  insuranceInvoked : boolean
  dailyLiquidityActive : boolean
}

entity "RegulatorNotification" as RN {
  *id : string
  --
  *exerciseId : string?
  *incidentId : string?
  regulator : enum
  trigger : enum
  slaHours : int
  triggeredAt : DateTime
  dueAt : DateTime
  status : enum
  draftBody : string?
  sentAt : DateTime?
  sentById : string?
  ackReference : string?
}

DT |o..o{ DR : "code"
DR }o--|| Appr : "may require"
DR ||--o{ RN  : "may trigger"
DR ||--o{ BCP : "may trigger"

note bottom of DT
  Org-defined decision presets.
  requiresDualControl=true surfaces a chip
  in the IncidentCapturePanel; hard
  enforcement of 2-approver gating is on
  the roadmap.
end note

note right of RN
  SLA clock starts from triggeredAt
  (= IMT invocation for POST_INVOCATION,
  awareness time for POST_AWARENESS).
  Completing the linked runbook NOTIFICATION
  step flips status to SENT.
end note

@enduml
```

Canonical source: [`src/decisions.puml`](src/decisions.puml).
