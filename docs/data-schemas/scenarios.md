# Scenarios & MSEL

A `Scenario` is the *design* — framing, CMORG metadata, coverage flags, and the children that form the Master Scenario Events List (MSEL). Library templates live as `Scenario` rows with `isTemplate = true` and `orgId = null`; cloning them into an org snapshots a fresh `Scenario` row plus all its children.

`Event` is a scheduled stimulus at a D-Day `HH:MM` time, addressed from/to/cc role titles. `Inject` is a supplementary stimulus (BUSINESS or TECHNICAL) inside an event window. `EventIBS` ties an event to the IBSs it stresses, so tolerance-breach computation can attribute pressure correctly during the live run.

`ImportantBusinessService` is the per-scenario IBS row. It carries an optional `organizationIBSId` FK back to the org's register — the [scenario IBS register integrity](../user-guide/exercises-design.md) constraint requires every row to be linked to an APPROVED entry before exercises can transition to READY.

`Artefact` is the file-attachment polymorphism — a row can attach to a scenario, an event, an inject, or an exercise. Storage is Vercel Blob; metadata is in Postgres.

`FacilitatorQuestion` and `DebriefQuestion` are the question banks asked during and after the run respectively.

## Diagram

![Scenarios & MSEL ERD](img/scenarios.svg)

## Source

```puml
@startuml scenarios
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

title <font color=#3730A3>**Scenarios & MSEL** (Master Scenario Events List)</font>

entity "Scenario" as Sc {
  *id : string
  --
  *orgId : string?  // null = library template
  title : string
  background : string
  dDayDate : DateTime
  durationMin : int
  category : enum?
  tier : enum?
  isTemplate : boolean
  templateOriginId : string?
  compoundParentId : string?
  compoundOrderIdx : int?
  coversPeople : boolean
  coversProperty : boolean
  coversTechnology : boolean
  coversDataAvailability : boolean
  coversDataIntegrity : boolean
  coversThirdParty : boolean
}

entity "ImportantBusinessService" as IBS {
  *id : string
  --
  *scenarioId : string
  organizationIBSId : string?
  code : string
  name : string
  impactToleranceMin : int
  criticality : string
}

entity "Event" as Ev {
  *id : string
  --
  *scenarioId : string
  eventNo : int
  scheduledTime : string  // HH:MM (D-Day)
  title : string
  description : string
  expectedActions : string[]
  objectives : string[]
  senderRoleTitle : string?
  toRoleTitles : string[]
  ccRoleTitles : string[]
}

entity "EventIBS" as EvIBS {
  *id : string
  --
  *eventId : string
  *ibsId : string  // → ImportantBusinessService
}

entity "Inject" as In {
  *id : string
  --
  *scenarioId : string
  injectNo : int
  scheduledTime : string
  summary : string
  description : string
  relation : string?
  kind : enum  // BUSINESS | TECHNICAL
}

entity "Artefact" as Art {
  *id : string
  --
  scenarioId : string?
  eventId : string?
  injectId : string?
  exerciseId : string?
  filename : string
  blobUrl : string
  uploadedById : string?
}

entity "FacilitatorQuestion" as FQ {
  *id : string
  --
  *scenarioId : string
  prompt : string
  orderIdx : int
}

entity "DebriefQuestion" as DQ {
  *id : string
  --
  *scenarioId : string
  prompt : string
  category : string?
}

Sc ||--o{ IBS
Sc ||--o{ Ev
Sc ||--o{ In
Sc ||--o{ FQ
Sc ||--o{ DQ
Sc ||--o{ Art
Sc |o..o| Sc : "templateOriginId / compoundParentId"

Ev ||--o{ EvIBS
IBS ||--o{ EvIBS

Ev ||--o{ Art
In ||--o{ Art

note bottom of Sc
  Library templates (isTemplate=true,
  orgId=null) clone into per-org Scenario
  rows on demand. Compound scenarios use
  compoundParentId to chain phases.
end note

@enduml
```

Canonical source: [`src/scenarios.puml`](src/scenarios.puml).
