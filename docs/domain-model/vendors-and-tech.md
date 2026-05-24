# Vendors & tech systems

The third-party and DR-test ledger that supports the IBS register.

## Why this layer exists

An IBS's resource map references third parties ("Pay.UK / FPS") and technology ("Core ledger", "Payments switch"). Those references are useful but stringly-typed. The `Vendor` and `TechSystem` registers turn them into first-class rows with their own posture metadata.

Both are admin-managed via `/vendors` and `/tech-recovery`.

## Vendor

`Vendor` — a third-party that supports one or more IBSs:

* Identity: `id`, `orgId`, `name`, `description`, `serviceKind`, `tier` (`TIER_1` / `TIER_2` / `TIER_3`)
* Contact: `contactName`, `contactEmail`, `contactPhone`, `statusUrl`
* DORA: `isDoraCritical`, `doraIctTier`, `hyperscaler`, `region`
* Contract: `contractStartAt`, `contractEndAt`, `contractRenewalNoticeDays`, `contractAnnualValueGBP`
* Assurance: `assuranceKind` (`SOC2_TYPE_2` etc.), `assuranceExpiryAt`
* Exit plan: `exitPlanReviewedAt`, `exitPlanRTOMin`, `exitPlanNotes`
* Fourth parties: `fourthParties[]`
* MTP register fields (when `isMaterialThirdParty: true`) — `contractRef`, `legalName`, `legalEntityIdentifier`, `isOutsourcing`, `serviceTypeTaxonomy`, `cloudDeployment`, `productServiceDescription`, `supplyChainRanking`, `serviceCommencedAt`, `noticePeriodVendorDays`, `noticePeriodFirmDays`, `governingLaw`, `materialityReason`, `materialityAssessedAt`, `functionCategory`, `supportsCoreIBSElement`, six IT-PRA / FCA / FMI flags, `countryDataStored`, `countryServiceDeliveredFrom`, `compliesWithRules`, `assuranceSummary`, `smfSignedOff`, `governanceCommittee`, `governanceApprovedAt`, `substitutability`, `reintegrationAbility`, `impactOfDiscontinuing`

`VendorIBSLink` — many-to-many with `OrganizationIBS`.
`VendorAssessment` — append-only assessment rows of kind `RISK | AUDIT | FINANCIAL_DD | CYBER_DD`.
`VendorMtpNotification` — DRAFT → SUBMITTED → ACKNOWLEDGED notification filings.
`VendorRegisterSnapshot` — immutable annual XLSX snapshots for the FCA / PRA Annex 3 register.

### Vendor lifecycle state

`src/lib/vendor-state.ts` exposes `deriveVendorState(vendor, now, assessments)` returning `{ alerts, attentionLevel }`. Six conservative `LifecycleAlert` codes (`ASSURANCE_EXPIRED | ASSURANCE_MISSING | CONTRACT_PAST_NOTICE | CONTRACT_EXPIRED | MTP_INCOMPLETE | ASSESSMENT_OVERDUE`) light up only when something is *already* overdue. Drives:

* the chip row on `/vendors` cards
* the **Action required** filter on the list
* the row on `/vendors/risk`
* the **Next actions** suggestion panel on `/vendors/[id]`

Same engine, three surfaces. See [Vendor-state engine](../architecture/vendor-state-engine.md).

### MTP register

When `isMaterialThirdParty: true`, the MTP register sections (2–5) unlock. `evaluateVendorReadiness(vendor)` (in `src/lib/vendor-mtp-readiness.ts`) scores a vendor against ~25 mandatory Annex 3 fields. The `/vendors/register` page lists every MTP vendor with a ready / not-ready chip, paginated 25 per page.

`generateAnnualRegisterAction` produces an XLSX matching the FCA / PRA Annex 3 column layout and uploads it to Vercel Blob; the snapshot row is immutable (no edit / delete).

### Notifications

`/vendors/notifications` lists every `VendorMtpNotification` filing. Three statuses: DRAFT (not yet filed) → SUBMITTED (filed, awaiting ack) → ACKNOWLEDGED. URL-driven server pagination, status filter chips, search by vendor name + ack reference.

### Detail page

`/vendors/[id]` is tabbed (`VendorDetailTabs` — Basics · MTP register · Assessments · Notifications). The `ReadinessHeader` is sticky above the tabs. `?tab=<key>` URL deep-links honoured. Above the tabs sits `VendorNextActions` showing the top 3 imperatives from the state engine.

### How rows are created

1. **5-step wizard** (`VendorAddWizard.tsx`) — Basics → DORA → Contract → Assurance → Exit plan. Same wizard runs in create-mode (drawer) + edit-mode (Basics tab).
2. **Library clone** (`/vendors` → Add from library) — drawer of curated real-world vendors. Action: `addLibraryVendorAction`.

See [Vendor library](../libraries/vendors.md).

## OrgDecisionType + dual control

`OrgDecisionType` is the org-defined decision-preset registry, surfaced in the IncidentCapturePanel decision picker alongside the built-in `DecisionType` enum. Each preset carries `code`, `label`, `hint?`, `approverRoles: String[]`, and a `requiresDualControl: Boolean` flag (additive — defaults `false`).

When `requiresDualControl: true`, the decision picker + approvals dock surface a "requires 2 approvers" chip so the IMT chair knows the 4-eyes rule applies. Hard enforcement (blocking single-approver completion) is a planned follow-up.

## TechSystem

`TechSystem` — a system that supports one or more IBSs. It's the inverse of the IBS register: instead of customer-facing services, you log the underlying systems and their recovery posture.

* Identity: `id`, `orgId`, `name`, `description`, `owner`, `kind` (`APPLICATION | INFRASTRUCTURE | DATABASE | NETWORK | AUTH | OBSERVABILITY | OTHER`), `tier` (`CRITICAL | ESSENTIAL | IMPORTANT | ROUTINE`)
* Recovery objectives: `rtoMin`, `rpoMin`, `mtpdMin`
* Failover topology: `primaryRegion`, `failoverRegion`, `failoverKind` (`ACTIVE_ACTIVE | ACTIVE_PASSIVE | WARM_STANDBY | COLD_RESTORE | NONE`)
* Backup posture: `backupFrequency`, `backupRetentionDays`, `lastBackupValidatedAt`
* Free text: `notes`

`@@unique([orgId, name])` — a system name is unique within an org.

### DR-test ledger

`DRTest` rows attach to a `TechSystem`:

* `testedAt`, `outcome` (`PASS | PARTIAL | FAIL`)
* `rtoActualMin`, `rpoActualMin`
* `participants`, `notes`

The system's "last tested" + "actual RTO vs target" derive from the most recent `DRTest`. The posture-score on `/tech-recovery` composes deductions:

* missing RTO/RPO declaration → −25
* never DR-tested → −25
* DR test > 1 year stale → −25
* failed test → −25
* missing failover topology on critical/essential systems → −25
* backup not validated > 90 days → −10

### How rows are created

1. **4-step wizard** (`SystemAddWizard.tsx`) — Basics → Objectives → Failover → Backups
2. **Library clone** (`/tech-recovery/library`) — Action: `addLibrarySystemAction`

See [Tech-system library](../libraries/tech-systems.md).

## /vendors/risk dashboard

Five risk lenses on one page:

1. **Assurance expiring soon** — expired or ≤60d
2. **Contracts ending soon** — ≤90d, expired first
3. **MTP register not ready** — lowest-readiness first; top 3 missing fields shown inline
4. **Assessments overdue** — any required MTP assessment > 60d
5. **4th-party concentration** — top hyperscaler share + fragmentation hint when ≥ 40%

Each section caps at top 5 with a "See all N →" deep-link.

## See also

* [Vendor-state engine](../architecture/vendor-state-engine.md) — the alert + next-action engine
* [IBS register](ibs-register.md) — what vendors and tech systems ultimately support
* [Forms, actions & toasts](../conventions/forms-and-actions.md) — wizard + drawer-launcher patterns
* [The vendor register (user guide)](../user-guide/vendors.md) — how admins use this surface
