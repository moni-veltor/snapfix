# Debrief & post-incident

After an exercise completes, the debrief layer captures what was learned. `DebriefAnswer` is the per-question response from each participant (against `DebriefQuestion` from the scenario). `AfterActionReport` is the facilitator's canonical narrative (summary + strengths + gaps + metrics snapshot), finalised by an approver and used to generate the evidence pack for regulator-mode runs.

`ExerciseActionItem` is the bridge from learning to follow-up — owner, due date, status (OPEN / IN_PROGRESS / CLOSED), priority, an evidence URL. Action items survive across exercises; the `/action-items` page is their close-loop home.

`ExerciseHotWash` is the immediate-after structured retrospective (what worked / what didn't / one change). `ExerciseWellbeingCheck` is the anonymous pulse check on participant pressure and recovery needs.

When an exercise becomes a real declared `Incident` (or one is declared independently), the post-incident layer kicks in: `PostIncidentReport` is the formal 8-section report, `Retrospective` is the glad/sad/mad/actions board, and `RecoveryPlan` carries the per-system RTO targets vs actuals.

## Diagram

![Debrief ERD](img/debrief.svg)

## Source

```puml
@startuml debrief
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

title <font color=#3730A3>**Debrief & post-incident**</font>

entity "Exercise" as Ex {
  *id : string
}

entity "Incident" as Inc {
  *id : string
  --
  *orgId : string
  *exerciseId : string?
}

entity "DebriefAnswer" as DA {
  *id : string
  --
  *exerciseId : string
  *questionId : string
  *participantId : string
  answer : string
  createdAt : DateTime
}

entity "AfterActionReport" as AAR {
  *id : string
  --
  *exerciseId : string
  summary : string
  strengths : string[]
  gaps : string[]
  metricsSnapshotJson : Json?
  finalisedAt : DateTime?
  finalisedById : string?
}

entity "ExerciseActionItem" as AI {
  *id : string
  --
  *exerciseId : string
  *ibsId : string?
  title : string
  ownerId : string?
  dueDate : DateTime?
  status : enum
  priority : enum
  evidenceUrl : string?
  closedAt : DateTime?
}

entity "ExerciseHotWash" as HW {
  *id : string
  --
  *exerciseId : string
  participantId : string
  whatWorked : string?
  whatDidnt : string?
  oneChange : string?
}

entity "ExerciseWellbeingCheck" as Well {
  *id : string
  --
  *exerciseId : string
  participantId : string
  pressure : int
  recoveryNeeded : boolean
  comment : string?
}

entity "PostIncidentReport" as PIR {
  *id : string
  --
  *incidentId : string
  summary : string
  timeline : Json
  rootCause : string?
  remediations : string[]
  finalisedAt : DateTime?
}

entity "Retrospective" as Retro {
  *id : string
  --
  *incidentId : string
  glad : string[]
  sad : string[]
  mad : string[]
  actions : string[]
  facilitatorId : string?
}

entity "RecoveryPlan" as RP {
  *id : string
  --
  *exerciseId : string?
  *incidentId : string?
  systems : Json
  ownerId : string?
  approvedAt : DateTime?
}

Ex ||--o{ DA
Ex ||--|| AAR
Ex ||--o{ AI
Ex ||--o{ HW
Ex ||--o{ Well

Inc ||--o| PIR
Inc ||--o| Retro
Inc ||--o| RP

note bottom of AAR
  After-Action Report is the canonical
  per-exercise narrative. Generates the
  evidence-pack XLSX/PDF when the
  exercise was regulatorMode=true.
end note

note right of AI
  Action items survive across
  exercises — their close-loop is
  tracked on /action-items, not the
  debrief page.
end note

@enduml
```

Canonical source: [`src/debrief.puml`](src/debrief.puml).
