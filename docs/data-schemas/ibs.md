# IBS register

The IBS register is the firm's canonical list of Important Business Services. `OrganizationIBS` carries the governance (process owner, second-line reviewer, approval timestamp, review-due date), the methodology fields (impact tolerance + per-regulator tolerances, six-dimension importance assessment), and the structured `IBSResource` map.

`IBSAttestation` is the three-line-of-defence chain: FIRST_LINE (process owner) → SECOND_LINE (oversight) → EXECUTIVE (accountable SMF). A register entry only earns `status = APPROVED` once the chain completes.

Three link tables wire the register into the rest of the platform: `ExerciseIBSLink` (which IBSs an exercise tests), `VendorIBSLink` (which IBSs a vendor supports), `RunbookIBSLink` (which IBSs a runbook covers).

`ImportantBusinessService` is a per-scenario snapshot, not a register entry — see [Scenarios & MSEL](scenarios.md). Its `organizationIBSId` is the integrity link back; the [scenario IBS register integrity](../user-guide/exercises-design.md) rule blocks exercises from going Ready while any scenario IBS has a null link.

## Diagram

![IBS register ERD](img/ibs.svg)

## Source

```puml
@startuml ibs
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

title <font color=#3730A3>**IBS register**</font>

entity "OrganizationIBS" as IBS {
  *id : string
  --
  *orgId : string
  code : string
  name : string
  status : enum  // DRAFT | APPROVED | DEPRECATED
  processOwnerUserId : string?
  ownerDepartmentId : string?
  approvedAt : DateTime?
  reviewDueAt : DateTime?
  impactToleranceMin : int
  fcaToleranceMin : int?
  praToleranceMin : int?
  criticality : enum
  impactCustomerFinancial : enum?
  impactVulnerableCustomer : enum?
  impactLossOfLicense : enum?
  impactRegulatoryFine : enum?
  impactReputational : enum?
}

entity "IBSAttestation" as Att {
  *id : string
  --
  *ibsId : string
  line : enum  // FIRST_LINE | SECOND_LINE | EXECUTIVE
  status : enum  // REQUESTED | ATTESTED | REJECTED
  attestedById : string?
  attestedAt : DateTime?
  notes : string?
}

entity "IBSResource" as Res {
  *id : string
  --
  *ibsId : string
  kind : enum  // TECHNOLOGY | PEOPLE | FACILITIES | THIRD_PARTY | INFORMATION | PROCESS
  label : string
  criticality : enum
  vendorId : string?
  techSystemId : string?
  departmentId : string?
}

entity "ExerciseIBSLink" as ExIBS {
  *id : string
  --
  *exerciseId : string
  *ibsId : string
}

entity "VendorIBSLink" as VIBS {
  *id : string
  --
  *vendorId : string
  *ibsId : string
}

entity "RunbookIBSLink" as RIBS {
  *id : string
  --
  *runbookId : string
  *ibsId : string
}

entity "ImportantBusinessService" as SIBS {
  *id : string
  --
  *scenarioId : string
  organizationIBSId : string?
  code : string
  name : string
  impactToleranceMin : int
  criticality : string
}

IBS ||--o{ Att
IBS ||--o{ Res
IBS ||--o{ ExIBS
IBS ||--o{ VIBS
IBS ||--o{ RIBS
IBS ||--o{ SIBS : "approved → snapshotted into scenarios"

note right of SIBS
  ImportantBusinessService is a per-scenario
  snapshot of an OrganizationIBS at attach-time.
  organizationIBSId is the integrity link;
  exercises can't go READY while any scenario IBS
  has a null link.
end note

note right of Att
  Three-line attestation chain
  per annual cycle. APPROVED IBS
  status requires the full chain.
end note

@enduml
```

Canonical source: [`src/ibs.puml`](src/ibs.puml).
