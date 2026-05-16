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

`VendorIBSLink` is the join — many-to-many between `Vendor` and `OrganizationIBS`.

### How rows are created

Two paths, exactly mirroring IBS:

1. **5-step wizard** (`VendorAddWizard.tsx`) opened from the `/vendors` hero — Basics → DORA → Contract → Assurance → Exit plan
2. **Library clone** (`/vendors/library`) — one click per real-world vendor (Thought Machine, Mambu, Stripe, AWS, …). Action: `addLibraryVendorAction`

See [Vendor library](../libraries/vendors.md).

## TechSystem

`TechSystem` — a system that supports one or more IBSs. It's the inverse of the IBS register: instead of customer-facing services, you log the underlying systems and their recovery posture.

* Identity: `id`, `orgId`, `name`, `description`, `owner`, `kind` (`APPLICATION` | `INFRASTRUCTURE` | `DATABASE` | `NETWORK` | `AUTH` | `OBSERVABILITY` | `OTHER`), `tier` (`CRITICAL` | `ESSENTIAL` | `IMPORTANT` | `ROUTINE`)
* Recovery objectives: `rtoMin`, `rpoMin`, `mtpdMin`
* Failover topology: `primaryRegion`, `failoverRegion`, `failoverKind` (`ACTIVE_ACTIVE` | `ACTIVE_PASSIVE` | `WARM_STANDBY` | `COLD_RESTORE` | `NONE`)
* Backup posture: `backupFrequency`, `backupRetentionDays`, `lastBackupValidatedAt`
* Free text: `notes`

`@@unique([orgId, name])` — a system name is unique within an org.

### DR-test ledger

`DRTest` rows attach to a `TechSystem` and capture each disaster-recovery test:

* `testedAt`, `outcome` (`PASS` | `PARTIAL` | `FAIL`)
* `rtoActualMin`, `rpoActualMin` — actual figures from the test
* `participants`, `notes`

The system's "last tested" and "actual RTO vs target" derive from the most recent `DRTest`. The posture-score on the `/tech-recovery` overview composes:

* missing RTO/RPO declaration → −25
* never DR-tested → −25
* DR test > 1 year stale → −25
* failed test → −25
* missing failover topology on critical/essential systems → −25
* backup not validated > 90 days → −10

### How rows are created

1. **4-step wizard** (`SystemAddWizard.tsx`) opened from the `/tech-recovery` hero — Basics → Objectives → Failover → Backups
2. **Library clone** (`/tech-recovery/library`) — one click per banking-stack system (core ledger, payments engine, SWIFT gateway, AWS region, …). Action: `addLibrarySystemAction`

See [Tech-system library](../libraries/tech-systems.md).

## See also

* [IBS register](ibs-register.md) — what vendors and tech systems ultimately support
* [Forms, actions & toasts](../conventions/forms-and-actions.md) — the wizard + modal pattern used here
