# The vendor register

`/vendors` is the third-party ledger. Every supplier whose outage could land on the IMT lives here, with the assurance, contract and exit-plan posture that drives risk reviews and the FCA/PRA Annex 3 register.

## Two-second tour

* **At the top** — a collapsible "DORA insights" band (totals, DORA-critical count, assurance-expired count, contracts-in-notice-window count). Click to expand the five-panel insights surface; defaults closed so the actual vendor list is above the fold.
* **The filter bar** — search by name / service / hyperscaler; a tier-chip row (T1/T2/T3); a **DORA only** toggle; an **Action required** chip; a sort selector (Tier · Name · Assurance soonest · Contract soonest).
* **The grid** — vendors grouped by tier (in the default sort) or as one flat sorted grid (any other sort). Each card shows tier + DORA chip + posture pills (assurance fresh, exit plan present, IBS link count) + any **live alert chips** for overdue items.

## Lifecycle alert chips

Conservative thresholds — chips only light up when something is already overdue or past a point of no return:

| Chip | Triggered by |
|---|---|
| Assurance expired / missing | Last assurance review is past its expiry date, or no assurance type is recorded |
| Inside notice window | Contract end-date is within the renewal-notice period — switching providers now costs a renewal cycle |
| Contract expired | Contract end-date has passed; verify renewal or wind-down |
| MTP register incomplete | Vendor is flagged Material Third Party but mandatory Annex 3 fields are missing |
| Assessments overdue | Required MTP assessment (Risk / Audit / Financial DD / Cyber DD) > 60 days old or never recorded |

Hit **Action required** to filter the grid to vendors with at least one alert.

## The five sub-pages

| Page | What it's for |
|---|---|
| `/vendors` | The grid — your full register |
| `/vendors/[id]` | Detail page with 4 tabs (Basics · MTP register · Assessments · Notifications) and a "Next actions" panel above |
| `/vendors/risk` | **Vendors at risk** — five risk lenses joined: assurance expiring · contracts expiring · MTP not ready · assessments overdue · 4th-party concentration |
| `/vendors/contracts` | Renewal calendar bucketed by time-to-end (expired · ≤30d · ≤90d · later); search + tier filter |
| `/vendors/register` | The MTP register — vendors flagged `isMaterialThirdParty`; paginated; readiness chip (Ready / Not ready); annual XLSX generator |
| `/vendors/notifications` | History of MTP notification filings; status filter (Drafts / Submitted / Acknowledged) |

## Adding a vendor

Three paths:

1. **Library clone** — `Add from library` opens a drawer of curated real-world vendors (Stripe, AWS, Mambu, Thought Machine, SWIFT, …). Filter by tier; click to add. The clone fills out everything we know about the vendor; you tweak from there.
2. **Wizard** — `Add vendor` runs the 5-step wizard: Basics → DORA → Contract → Assurance → Exit plan. Each step has hint text. You can save as draft at any step.
3. **Bulk CSV** — for moving an existing register in one shot.

## Materiality (MTP register)

Mark a vendor as a **Material Third Party** when it sits in the path of an IBS recovery — losing it stretches an impact tolerance. The MTP flag unlocks four register sections you fill in over time (`Service provider` · `Materiality + IBS` · `Compliance` · `Exit + substitutability`). Each section has fields the FCA Annex 3 expects.

The vendor detail page's **MTP register** tab shows a per-vendor readiness score (`8 / 14 fields filled`). The aggregate readiness across all MTPs appears on `/vendors/register` as a tile.

## Notifications

When you need to file a regulator notification about an MTP change (commencement, material change, exit), use the **Notifications** tab on the vendor detail page. Drafts → submitted → acknowledged; each transition stamps the audit log. The XLSX matches the format the regulator's loader expects.

## Risk dashboard

`/vendors/risk` is the **"what needs my attention this week"** view. Five sections, each with a top-5 list and a "See all N →" deep-link to the relevant filtered list page. Use this as your weekly review surface.

## Next action suggestions

Open any vendor and look just above the tabs. The **Next actions** panel takes the live alert chips and turns them into imperative actions ("Record a fresh assurance review", "Complete the missing Annex 3 fields") with priority (high / medium / low) and a deep-link to the right tab. When the vendor is clean, the panel falls back to soft housekeeping suggestions (mark as MTP, link IBSs, document exit plan).

## See also

* [Runbooks & drills](runbooks.md) — vendor-failure playbooks; the runbook escalation engine ties to vendor alerts
* [Planning an exercise](planning-an-exercise.md) — vendor scenarios pull from this register
