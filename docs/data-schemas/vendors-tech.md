# Vendors & tech systems

`Vendor` is the org's third-party register. The basics (name, tier, contacts, status URL) cover every entry; the contract / assurance / exit-plan blocks cover governance; the DORA fields (`isDoraCritical`, `doraIctTier`, `hyperscaler`, `region`, `fourthParties`) cover EU operational-resilience reporting; the MTP register fields (unlocked when `isMaterialThirdParty = true`) cover the ~25 FCA / PRA Annex 3 mandatory fields.

`VendorIBSLink` is the many-to-many to the IBS register. `VendorAssessment` is append-only — one row per RISK / AUDIT / FINANCIAL_DD / CYBER_DD assessment. `VendorMtpNotification` carries the DRAFT → SUBMITTED → ACKNOWLEDGED notification filing flow. `VendorRegisterSnapshot` is the immutable annual XLSX snapshot (Vercel Blob URL + row count) that gets handed to the regulator.

`TechSystem` is the inverse of the IBS register: customer-facing services vs the underlying systems that support them. It carries the recovery objectives (RTO / RPO / MTPD), the failover topology, and the backup posture. `DRTest` is the disaster-recovery test ledger — each row stamps an outcome (PASS / PARTIAL / FAIL) against a system, with the actual RTO/RPO measured during the test.

The posture score on `/tech-recovery` deducts for missing tolerances, stale DR tests (> 1 year), failed tests, missing failover topology on critical systems, and backup not validated > 90 days.

## Diagram

![Vendors & tech ERD](img/vendors-tech.svg)

## Source

```puml
@startuml vendors-tech
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

title <font color=#3730A3>**Vendors & tech systems**</font>

entity "Vendor" as V {
  *id : string
  --
  *orgId : string
  name : string
  serviceKind : string?
  tier : enum
  contactName : string?
  contactEmail : string?
  statusUrl : string?
  contractStartAt : DateTime?
  contractEndAt : DateTime?
  contractRenewalNoticeDays : int?
  contractAnnualValueGBP : int?
  assuranceKind : enum?
  assuranceExpiryAt : DateTime?
  exitPlanReviewedAt : DateTime?
  exitPlanRTOMin : int?
  hyperscaler : enum?
  region : string?
  fourthParties : string[]
  isDoraCritical : boolean
  doraIctTier : enum?
  isMaterialThirdParty : boolean
  contractRef : string?
  legalEntityIdentifier : string?
  materialityReason : string?
  smfSignedOff : boolean
  governanceApprovedAt : DateTime?
}

entity "VendorIBSLink" as VIBS {
  *id : string
  --
  *vendorId : string
  *ibsId : string
}

entity "VendorAssessment" as VA {
  *id : string
  --
  *vendorId : string
  kind : enum
  performedAt : DateTime
  performedById : string?
  outcome : string?
  notes : string?
  evidenceUrl : string?
}

entity "VendorMtpNotification" as VMN {
  *id : string
  --
  *vendorId : string
  status : enum
  draftedAt : DateTime?
  submittedAt : DateTime?
  acknowledgedAt : DateTime?
  ackReference : string?
}

entity "VendorRegisterSnapshot" as VRS {
  *id : string
  --
  *orgId : string
  generatedAt : DateTime
  generatedById : string
  blobUrl : string
  vendorCount : int
}

entity "TechSystem" as TS {
  *id : string
  --
  *orgId : string
  name : string
  kind : enum
  tier : enum
  owner : string?
  rtoMin : int?
  rpoMin : int?
  mtpdMin : int?
  primaryRegion : string?
  failoverRegion : string?
  failoverKind : enum
  backupFrequency : string?
  backupRetentionDays : int?
  lastBackupValidatedAt : DateTime?
}

entity "DRTest" as DR {
  *id : string
  --
  *techSystemId : string
  testedAt : DateTime
  outcome : enum
  rtoActualMin : int?
  rpoActualMin : int?
  participants : string[]
  notes : string?
}

V ||--o{ VIBS
V ||--o{ VA
V ||--o{ VMN
TS ||--o{ DR

note right of V
  isMaterialThirdParty unlocks the
  MTP register section (FCA / PRA
  Annex 3). evaluateVendorReadiness
  scores against ~25 mandatory fields.
end note

note right of TS
  Posture score on /tech-recovery deducts
  for missing RTO/RPO, stale DR tests,
  missing failover topology, stale
  backup validation.
end note

@enduml
```

Canonical source: [`src/vendors-tech.puml`](src/vendors-tech.puml).
