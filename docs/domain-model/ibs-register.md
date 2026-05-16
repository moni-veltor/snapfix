# IBS register

The heart of every operational-resilience programme. SnapFix's IBS register lives on the `OrganizationIBS` model.

## Why this matters

Important Business Services (IBSs) are the regulator-facing unit. FCA SS1/21, PRA SS2/21 and the Bank of England's Operational Resilience policy all anchor in the IBS concept. Each IBS has:

* an **impact tolerance** — the maximum disruption (in minutes) the firm is willing to accept before customer or firm safety is at risk
* a **criticality** rating
* a **resource map** — the people, property, technology, third parties, information and processes it depends on
* an **importance assessment** — a 6-dimension harm matrix (customer financial, vulnerable customer, regulatory fine, license loss, reputational, capital loss)

SnapFix captures all of this on the model.

## Model fields

`OrganizationIBS` (in `prisma/schema.prisma`):

* Identity: `id`, `orgId`, `code` (org-unique like `IBS_01`), `name`, `outcome`, `description`, `status`, `approvedAt`
* Ownership: `processOwner` (free text), `processOwnerUser` (User FK), `secondLineReviewer`, `reviewDueAt`
* Calibration: `processType`, `customerJourneys[]`, `productsCovered[]`, `criticality`
* Tolerances: `impactToleranceMin`, `fcaToleranceMin`, `praToleranceMin`, `toleranceRationale`
* Resource map: `technology[]`, `peopleNotes`, `facilities`, `thirdParties[]`, `information[]`, `processes[]`
* Importance assessment (six impact-level enums): `impactCustomerFinancial`, `impactVulnerableCustomer`, `impactLossOfLicense`, `impactRegulatoryFine`, `impactReputational`, `impactLossOfCapital`
* Free text: `importanceAssessmentNotes`, `vulnerabilitiesNotes`, `testingNotes`
* CMORG harm-coverage flags: `coversPeople`, `coversProperty`, `coversTechnology`, `coversDataAvailability`, `coversDataIntegrity`, `coversThirdParty`

## Lifecycle

```
DRAFT  →  APPROVED  →  DEPRECATED
       ↘            ↗
        UPDATED (back to DRAFT)
```

Status is held on the model. Approval is a single click in the UI; the `approveIBSAction` sets `status: "APPROVED"` and stamps `approvedAt`.

## How rows are created

Three paths:

1. **Wizard** — `/ibs/new` (or the [Add IBS modal](../conventions/forms-and-actions.md)) — full tabbed form covering identity, tolerance, resources, importance, coverage. Calls `createIBSAction`.
2. **Library clone** — `/ibs/library` "Add to register" button. Calls `addLibraryIBSAction(slug)` which looks up a `LibraryIBS` from `src/lib/ibs-library.ts`, generates the next `IBS_NN` code for the org, dedupes by name, and creates a new row pre-filled with the library defaults.
3. **Preset** — `/settings/presets` industry presets (tier-1 bank, tier-2 fintech, tier-3 insurer) seed a starter set of IBSs in one click.

## Constraints

* `@@unique([orgId, code])` — codes are unique per org
* The library action auto-generates codes (`IBS_01`, `IBS_02`, …) so admins don't have to think about numbering

## Linking to exercises

`ExerciseIBSLink` is the join table: an exercise can target one or more IBSs from the register. During the run, breaches against the tolerance are tracked in `ImpactBreach`.

## See also

* [IBS library](../libraries/ibs.md) — the curated catalogue used by the library clone path
* [Audit trail](../conventions/audit-trail.md) — every IBS lifecycle event is audited
