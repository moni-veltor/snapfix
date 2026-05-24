# Vendor-state engine

A single pure function (`deriveVendorState`) computes a per-vendor lifecycle state that drives the chip on the `/vendors` card, the row on `/vendors/risk`, and the "Next actions" panel on `/vendors/[id]`. Three surfaces, one engine — they can never disagree.

## Where it lives

* `src/lib/vendor-state.ts` — the alert engine
* `src/lib/vendor-suggestions.ts` — the next-action suggester
* `src/lib/vendor-mtp-readiness.ts` — the MTP register-readiness scorer (existed before the alert engine; the engine consumes it for the `MTP_INCOMPLETE` alert)

## The alert taxonomy

`LifecycleAlert` is a tight union of six conservative codes — they only light up when something is already overdue or past a point-of-no-return, not at early "expiring soon" warnings:

| Code | Lights up when |
|---|---|
| `ASSURANCE_EXPIRED` | `assuranceExpiryAt` is in the past |
| `ASSURANCE_MISSING` | no `assuranceKind` recorded |
| `CONTRACT_PAST_NOTICE` | `contractEndAt` is within `contractRenewalNoticeDays` |
| `CONTRACT_EXPIRED` | `contractEndAt` has passed |
| `MTP_INCOMPLETE` | `isMaterialThirdParty` true AND `evaluateVendorReadiness` returns not-ready |
| `ASSESSMENT_OVERDUE` | MTP vendor with any required assessment (RISK / AUDIT / FINANCIAL_DD / CYBER_DD) > 60 days old or never recorded |

Each alert carries a `label` (chip text — includes days-overdue figure where relevant) + a longer `detail` (tooltip / panel-body copy).

## `deriveVendorState`

```ts
function deriveVendorState(
  vendor: VendorForState,
  now?: Date,
  assessments?: ReadonlyArray<AssessmentRow>,
): VendorState
```

Returns `{ alerts: AlertChip[], attentionLevel: "OK" | "ACTION_REQUIRED" }`. `attentionLevel` is just a roll-up — `ACTION_REQUIRED` when at least one alert is present.

## `assessmentGaps`

Pure helper exposed for the risk-dashboard table:

```ts
function assessmentGaps(
  vendor: { isMaterialThirdParty?: boolean },
  assessments: ReadonlyArray<AssessmentRow>,
  now?: Date,
): AssessmentGap[]
```

Returns the kinds that are overdue (or never recorded) for an MTP vendor. Non-MTPs return an empty list — assessments are only mandatory for MTPs. Threshold: `ASSESSMENT_OVERDUE_DAYS = 60`.

## `suggestNextActions`

Turns each live alert into a concrete imperative + a deep-link to the right tab. Priority-rank (`high | medium | low`):

| Alert | Action | Priority |
|---|---|---|
| `CONTRACT_EXPIRED` | "Update the contract end-date or mark the vendor exited" | high |
| `ASSURANCE_EXPIRED` | "Record a fresh assurance review" | high |
| `CONTRACT_PAST_NOTICE` | "Decide: renew or trigger the exit plan" | high |
| `MTP_INCOMPLETE` | "Complete the missing Annex 3 fields" | medium |
| `ASSESSMENT_OVERDUE` | "Record the overdue MTP assessments" | medium |
| `ASSURANCE_MISSING` | "Pick an assurance type for this vendor" | medium |

When the vendor has no live alerts, falls back to soft housekeeping suggestions (mark MTP, link IBSs, document exit plan) so an opened-clean vendor isn't a dead-end.

Capped at 3 suggestions by default. Sort is by priority rank.

## Where the engine is wired

| Surface | What it reads |
|---|---|
| `/vendors/page.tsx` | Computes `stateById` for every vendor; passes per-row `state` to `<VendorGrid>` for the chip + Action-required filter |
| `/vendors/risk/page.tsx` | Reuses `assessmentGaps` directly for the assessments-overdue section; mirrors the other lenses (assurance, contract, MTP, hyperscaler concentration) for visual consistency |
| `/vendors/[id]/page.tsx` | Computes `state` + `suggestions` once; renders `<VendorNextActions suggestions={…} />` above the tab bar |
| `<VendorGrid>` | Renders alert chips on cards (rose pill per alert) + the `Action required` filter chip |

## Deep links

Suggestions deep-link via `?tab=basics | mtp | assessments | notifications`. The `<VendorDetailTabs>` initial-state has this precedence:

1. `?tab=<key>` on the URL
2. `localStorage` (sticky across visits)
3. `"basics"` default

And re-syncs to URL changes via `useSearchParams` so clicking a suggestion link while already on the page jumps the tab.

## Why "conservative" thresholds

Two-tier UX: chips are reserved for "stop and look at this now"; everything earlier sits in the risk dashboard's at-a-glance counts. The alternative (early-warning chips at the 60-day mark) lights up too much real-world register and trains operators to ignore the chips. The risk dashboard exists to surface the same data at a softer pressure.

## See also

* [Vendors & tech systems](../domain-model/vendors-and-tech.md) — the underlying data model
* [Audit log](../domain-model/audit-log.md) — every alert-driven action audits
