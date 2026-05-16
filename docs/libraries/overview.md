# Curated libraries — overview

SnapFix ships four curated catalogues so customers don't face an empty page on day one.

## The four catalogues

| Library | Entries | Source | Used at | Cloned into |
|---|---:|---|---|---|
| Scenarios | 158 | `src/lib/library/scenarios/*.ts` (TS) | `/scenarios/library` | `Scenario` row in the org |
| Scenario *templates* (legacy CMORG) | ~14 | DB (`Scenario` rows with `isTemplate=true`) | `/templates` | `Scenario` row with `templateOriginId` set |
| IBS | 103 | `src/lib/ibs-library.ts` (TS) | `/ibs/library` | `OrganizationIBS` row |
| Vendors | 114 | `src/lib/vendor-library.ts` (TS) | `/vendors/library` | `Vendor` row |
| Tech systems | ~40 | `src/lib/tech-system-library.ts` (TS) | `/tech-recovery/library` | `TechSystem` row |

## Shared shape

All four use the same **one-click-add pattern**:

1. User lands on the library page
2. Filters by sector, tier, category, search
3. Clicks "Add to register"
4. Server action looks up the library entry by `slug`, dedupes by name within the org, creates the DB row pre-filled with the library defaults, audits the addition

The pattern is implemented in:

* `addLibraryScenarioAction(slug)` — `src/app/actions/scenarios.ts`
* `addLibraryIBSAction(slug)` — `src/app/actions/ibs.ts`
* `addLibraryVendorAction(slug)` — `src/app/actions/vendors.ts`
* `addLibrarySystemAction(slug)` — `src/app/actions/tech-recovery.ts`

Each writes a `*.added-from-library` audit event.

## Why TS-backed, not DB-seeded

The catalogues are **hard-coded TS files**, not Prisma seed scripts that push rows into the DB. Reasons:

* **Single source of truth in git.** Catalogue changes are PR-reviewable diffs.
* **Live the moment Vercel deploys.** No `db:seed` step per environment.
* **Customer edits are out of scope.** Catalogues are SnapFix's curation; customers add their own rows to the register via wizards or library-clones.

The exception is `/templates`. Those are DB-backed because they carry full nested events + injects. Cloning produces a fully-runnable scenario; the TS shells produce a stub the facilitator authors against.

## Sector taxonomy

All four catalogues use the same `Sector` type from `src/lib/library/sectors.ts`. 16 sectors, pharma deliberately excluded. See [Sector taxonomy](sector-taxonomy.md).

## Sub-pages

* [Scenario library](scenarios.md) — 158 sector-tagged shells across 16 sectors
* [IBS library](ibs.md) — 103 cross-sector IBSs
* [Vendor library](vendors.md) — 114 real-world providers
* [Tech-system library](tech-systems.md) — ~40 banking-stack systems
* [Sector taxonomy](sector-taxonomy.md) — the shared 16-sector type, labels, tones
