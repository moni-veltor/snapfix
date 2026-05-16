# Scenario library

158 sector-tagged scenario shells across all 16 SnapFix sectors. Lives in `src/lib/library/scenarios/`.

## File organisation

```
src/lib/library/
  sectors.ts                  # Sector type + labels + tones (shared)
  scenarios/
    types.ts                  # LibraryScenario type
    banking.ts                # 20 scenarios
    insurance.ts              # 10
    payments-fintech.ts       # 12
    retail-ecommerce.ts       # 10
    telecoms.ts               # 12
    energy-utilities.ts       # 12
    healthcare.ts             # 12
    government.ts             # 12
    aviation-transport.ts     # 12
    logistics.ts              # 8
    asset-wealth.ts           # 8
    media-broadcasting.ts     # 8
    higher-ed.ts              # 6
    manufacturing.ts          # 6
    technology-saas.ts        # 6
    legal-professional.ts     # 4
    index.ts                  # Flattens all + libraryScenarioBySlug()
```

## Shape of an entry

```ts
{
  slug: "core-ledger-outage-bank",
  title: "Core ledger 6-hour outage at peak payment-run window",
  sectors: ["banking"],
  category: "Technology & Data (Cyber)",
  tier: "TIER_1",
  srrRef: "3.1",
  background: "...",
  characteristics: ["...", "..."],
  assumptions: ["...", "..."],
  coversTechnology: true,
  coversDataAvailability: true,
  durationMin: 150,
  takeaways: "...",
  caseStudy: {
    title: "TSB / Sabadell migration meltdown (April 2018)",
    causation: "Core ledger migration cut-over went bad",
    impactScale: "5M customers locked out for up to a week",
    sourceUrl: "https://...",
  },
  seedEvents: [/* optional 2-3 starter events */],
}
```

Full type in `src/lib/library/scenarios/types.ts`.

## The clone action

`addLibraryScenarioAction(slug)` in `src/app/actions/scenarios.ts`:

1. `requireOrgRole("OWNER", "ADMIN")`
2. Look up `LibraryScenario` by slug via `libraryScenarioBySlug`
3. Compute a `dDayDate` 14 days out
4. Create a `Scenario` row with the library values, `isTemplate: false`, `orgId: me.orgId`
5. If `seedEvents` present, materialise them as nested `Event` rows
6. Write `scenario.added-from-library` audit
7. `revalidatePath("/scenarios")` + `revalidatePath("/scenarios/library")` + `redirect`

The facilitator then opens the new scenario and authors the MSEL events using the existing scenario editor.

## Two libraries, one product

The `/templates` route still exists with the original ~14 DB-backed CMORG templates. Those carry full nested events + injects ready to play. The new `/scenarios/library` is broader (158 across 16 sectors) but lighter (shells only). Both ship; the navigation distinguishes them.

This was a deliberate trade-off: building 158 fully-fledged scenarios with event-and-inject scripts would have been an unrealistic content lift. Shells provide breadth; templates provide depth. Customers can clone either.

## Quality bar for new entries

When adding scenarios:

* **Ground each entry in reality.** Real vendor names, real regulators, real RTOs.
* **No invented brands or statistics.** Anything sector-specific that I'm not certain about should say "typically" not "prescribed".
* **Cite the real-world parallel.** Use `caseStudy` to point to TSB/Sabadell, NotPetya, Optus, Synnovis, Hackney Council, etc. — published incidents.
* **Get the sector regulator right.** FCA / PRA for banking, Ofgem for energy, Ofcom for telecoms, NHSE EPRR for healthcare, etc.

## Adding a new sector

1. Add the sector to `SECTORS` in `src/lib/library/sectors.ts` + corresponding `SECTOR_LABEL`, `SECTOR_SHORT_LABEL`, `SECTOR_TONE`
2. Create `src/lib/library/scenarios/{sector}.ts` exporting `SOMETHING_SCENARIOS: LibraryScenario[]`
3. Import + spread in `src/lib/library/scenarios/index.ts`
4. The sector chip will auto-appear in `ScenarioLibraryGrid` (and IBS / Vendor grids) as soon as it has entries

## See also

* [Sector taxonomy](sector-taxonomy.md) — the 16-sector taxonomy details
