# Sector taxonomy

The shared `Sector` type that drives the cross-sector filter on every library page. Lives in `src/lib/library/sectors.ts`.

## The 16 sectors

| Slug | Display label | Short label |
|---|---|---|
| `banking` | Banking & capital markets | Banking |
| `insurance` | Insurance | Insurance |
| `asset-wealth` | Asset & wealth management | Asset & wealth |
| `payments-fintech` | Payments & fintech | Payments |
| `telecoms` | Telecoms | Telecoms |
| `energy-utilities` | Energy & utilities | Energy |
| `retail-ecommerce` | Retail & e-commerce | Retail |
| `healthcare` | Healthcare providers | Healthcare |
| `government` | Government & public sector | Government |
| `aviation-transport` | Aviation & transport | Aviation |
| `logistics` | Logistics & shipping | Logistics |
| `media-broadcasting` | Media & broadcasting | Media |
| `higher-ed` | Higher education | Higher ed |
| `manufacturing` | Manufacturing | Manufacturing |
| `technology-saas` | Technology & SaaS | Tech / SaaS |
| `legal-professional` | Legal & professional services | Legal |

Pharma is deliberately excluded — out of scope for SnapFix's current positioning.

## Exports

* `SECTORS` — readonly tuple, drives filter chip rendering order
* `Sector` — union type
* `SECTOR_LABEL` — full display name per sector
* `SECTOR_SHORT_LABEL` — compact name for cards / chips
* `SECTOR_TONE` — Tailwind background+text class per sector for the chip when active
* `SECTOR_NEIGHBOURS` — partial map of "similar regulator / threat model" sectors used for cross-sector suggestions

## How libraries use it

Every library entry has an optional `sectors: Sector[]` field. The grid components compute per-sector counts, render a chip row, and filter the entries on selection. Universal-sector entries (cross-cutting horizontal IBSs, productivity vendors, security tools) tag all 16 sectors.

A sector chip with `count: 0` is suppressed automatically.

## Adding a new sector

1. Append to `SECTORS` in `src/lib/library/sectors.ts`
2. Add an entry in `SECTOR_LABEL` and `SECTOR_SHORT_LABEL`
3. Pick a Tailwind tone in `SECTOR_TONE`
4. Optionally add neighbours in `SECTOR_NEIGHBOURS`
5. Add the sector tag to any existing library entries that apply
6. The filter chip will appear automatically across all three library grids

## Why this is shared

Originally each library had its own ad-hoc category type. Standardising on `Sector` lets us:

* Compose filters across libraries ("show me Healthcare IBSs + Healthcare vendors + Healthcare scenarios")
* Render consistent tones across cards
* Add `Organization.sector` later (on the [Roadmap](../roadmap.md)) so libraries can default to "Recommended for your sector"
