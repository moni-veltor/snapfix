# Audit log + integrity

`AuditLogEntry` is the write-only stream every mutation in the platform pours into. ~60 `AuditAction` codes across nine domains (see [Audit log](../domain-model/audit-log.md) for the catalogue). The `/audit` page reads this table via the shared `buildAuditWhere` filter; `/api/audit/export` streams it as CSV up to 50k rows with the same filter as the page.

There's no update path and no delete path — once it lands, it stays. Storage cost is acceptable for v1; partitioning by month / year is on the roadmap if a customer's audit volume warrants it.

`ExerciseAuditHashEntry` is the tamper-evidence layer for regulator-mode exercises. Each entry stores the SHA-256 of the previous entry's payload, so a regulator verifying the evidence pack offline can re-walk the chain and detect any post-hoc edits. Exercise-scoped (one chain per regulator-mode exercise).

`Incident` is the real-world counterpart to an `Exercise` — a row gets declared when an exercise team chooses to convert their rehearsal into a real declaration, or when an out-of-band event hits the org. It drives the downstream artefacts: `RegulatorNotification` rows for the SLA clocks, `PostIncidentReport` for the 8-section formal report, `Retrospective` for the glad/sad/mad board, `RunbookExecution` for any runbooks attached to the response.

## Diagram

![Audit + integrity ERD](img/audit.svg)

## Source

```puml
@startuml audit
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

title <font color=#3730A3>**Audit log + integrity**</font>

entity "AuditLogEntry" as AL {
  *id : string
  --
  *orgId : string
  actorId : string?  // null = system action
  action : string  // AuditAction union (~60 values)
  targetType : string  // "ibs" | "vendor" | "runbook" | ...
  targetId : string?
  summary : string  // displayed in /audit
  metadata : Json?
  createdAt : DateTime
}

entity "ExerciseAuditHashEntry" as Hash {
  *id : string
  --
  *exerciseId : string
  seq : int
  prevHash : string
  thisHash : string  // SHA-256 over prev + payload
  payload : Json
  createdAt : DateTime
}

entity "Incident" as Inc {
  *id : string
  --
  *orgId : string
  *exerciseId : string?
  declaredAt : DateTime
  declaredById : string
  severity : enum  // LOW | MEDIUM | HIGH | CRITICAL
  status : enum    // OPEN | CONTAINED | CLOSED
  classification : string?
  rootCauseHypothesis : string?
  closureCriteriaMet : Json?
}

note right of AL
  Write-only stream. No update or delete
  path. /audit renders with URL-driven
  filters; /api/audit/export streams CSV
  up to 50k rows. Every mutation calls
  audit() — failures are caught so they
  never break the user action.
end note

note right of Hash
  Regulator-evidence-mode exercises
  hash-chain audit writes so a reviewer
  can re-walk the chain offline and
  detect tampering. Exercise-scoped.
end note

note bottom of Inc
  Real-world incident declared from
  inside or outside an exercise.
  Drives RegulatorNotification,
  RecoveryPlan, PostIncidentReport,
  RunbookExecution attachments.
end note

@enduml
```

Canonical source: [`src/audit.puml`](src/audit.puml).
