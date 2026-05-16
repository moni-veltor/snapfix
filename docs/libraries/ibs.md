# IBS library

103 curated IBSs spanning all 16 SnapFix sectors. Lives in `src/lib/ibs-library.ts`.

## Layout

The file is a single flat array (`IBS_LIBRARY: LibraryIBS[]`) rather than split per-sector. Entries are grouped into sections by comment-headers (`// ─── Energy supply ───`), one for each category.

## Shape of an entry

```ts
{
  slug: "core-banking-ledger",
  code: "CORE_LDG",              // suggested; replaced with IBS_NN on add
  name: "Core banking ledger",
  outcome: "Customer balances and posting all financial transactions are recorded.",
  category: "Payments",          // see IBS_CATEGORIES
  sectors: ["banking"],          // see Sector type
  tiers: ["TIER_1", "TIER_2"],
  toleranceMin: 60,
  fcaToleranceMin: 240,
  praToleranceMin: 360,
  criticality: "CRITICAL",
  coversTechnology: true,
  coversDataAvailability: true,
  coversThirdParty: true,
  technology: ["Core ledger", "Payments switch"],
  thirdParties: ["Pay.UK / FPS", "ClearBank"],
  // ... resource-map and CMORG fields
}
```

## Categories

22 categories across two groups:

* **Banking & financial services**: Payments, Customer access, Cards & ATM, Lending, Onboarding, Trading, Insurance, Support, Branch & cash, Treasury
* **Cross-sector**: Energy supply, Water supply, Telecoms service, Healthcare delivery, Government service, Transport service, Retail commerce, Logistics, Education delivery, Manufacturing, Media delivery, Professional services

## Sectors

Every entry carries `sectors: Sector[]`. The IBS library grid renders a sector chip-row on top of the existing category chips. Cross-cutting IBSs (identity & access, email & collaboration, regulatory reporting, payroll, cyber-IR, physical-site-access) tag all 16 sectors.

## The clone action

`addLibraryIBSAction(slug)` in `src/app/actions/ibs.ts`:

1. `requireOrgRole("OWNER", "ADMIN")`
2. Look up `LibraryIBS` by slug
3. Generate the next `IBS_NN` code for the org (max existing IBS number + 1, zero-padded)
4. Dedupe by name within the org — if a match exists, redirect to that detail page
5. Create the `OrganizationIBS` row with library values
6. Write `ibs.added-from-library` audit
7. `revalidatePath` + redirect to the new IBS detail

The library code field (`CORE_LDG` etc.) is **never** used as the org code — it's display-only in the library card. The org always gets sequential `IBS_NN` codes.

## Adding entries

1. Append a new object to `IBS_LIBRARY` in `src/lib/ibs-library.ts`
2. Pick a category from `IBS_CATEGORIES` (add a new category to the const if no existing one fits)
3. Tag with one or more `sectors`
4. Test the library grid filters: tier chip, category chip, sector chip, search

## See also

* [IBS register](../domain-model/ibs-register.md) — the runtime register the library clones into
