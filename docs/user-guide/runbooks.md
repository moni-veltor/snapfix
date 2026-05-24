# Runbooks & drills

Runbooks are the playbooks the IMT walks when a scenario fires. SnapFix ships a 50-template library tuned for UK FCA / PRA / ICO + EU DORA. Clone what fits your firm, customise step ownership to your role vocabulary, and drill them before you need them.

## What's on `/runbooks`

* **Hero counts** — `X of Y tier-applicable templates added · 50 total in library`
* **Readiness band** — Ready · Needs review · Blocked, counted across active runbooks
* **The grid** — runbooks grouped by category (Cyber · Ransomware · Cloud · Vendor · BCP · Data · People · Regulatory · Other)

Each card surfaces:

* Tier badge (G-SIB-only / Bank-only / universal)
* Readiness chip — `Ready`, `2 to fix` (warnings), `Blocked` (can't activate)
* Freshness chip — `Reviewed 12d ago`, `Stale`, `Never reviewed`
* Drilled chip — `Drilled 8d ago` once you've walked it

## Adding from the library

Click **Add from library** in the hero. The drawer shows all 50 templates with:

* Category icon + tier badge
* Step count + estimated wall-clock
* Auto-activation trigger (`Auto ≥ HIGH` etc.)
* "Bank-only" or "G-SIB-only" tag where applicable

Click **Add to org** on the one you want. The clone is added as DRAFT — you customise step content to match your role vocabulary, then publish.

## Tier filter

The library has a **"Applies to firm tier"** chip filter. Switch your tier in **Settings → Profile** and the filter pre-populates so you only see runbooks that make sense for a firm your size. Bank-only templates (PRA + DORA notifications) hide for tier-3 EMI / fintech orgs; G-SIB-only ones (BoE settlement) hide unless you're Tier 1.

## Pre-flight — is it ready to activate?

Every runbook detail page has a **pre-flight panel** at the top. It runs nine checks:

| Code | What it checks |
|---|---|
| `DRAFT_STATUS` | Status is DRAFT — can't activate in an exercise |
| `NO_STEPS` | Zero steps defined |
| `STEPS_MISSING_OWNERS` | Steps without an owner role won't route to a participant queue |
| `OWNER_NOT_IN_ROLE_CATALOGUE` | Whole-runbook owner role isn't in your org-roles catalogue |
| `STEP_OWNERS_NOT_IN_CATALOGUE` | One or more step-owner role titles aren't recognised |
| `NO_IBS_LINK` | Not linked to any IBS — IBS owners won't find the playbook from the IBS detail page |
| `NO_TRIGGER` | No auto-activation trigger; manual-only |
| `NEVER_REVIEWED` | Mark reviewed once you've walked it with the owner |
| `STALE_REVIEW` | Last reviewed > 180 days ago |
| `ESCALATION_TARGET_DRAFT` | A downstream runbook in the escalation chain is still DRAFT and won't fire |

Two blockers prevent activation; the rest are warnings that should be cleaned up. Each issue has a "Fix" link straight to the relevant tab / surface.

## Mark reviewed

When you've walked the runbook with the owner-role and you're happy it reflects your current playbook, click **Mark reviewed** in the pre-flight panel. The freshness chip turns green and you re-set the 180-day clock.

## Drill this runbook

The **Drill this runbook** button in the detail-page hero spins up a **WALKTHROUGH / DRY_RUN** exercise that walks just this runbook's steps with the team. Properties:

* DRY_RUN mode — purged after 30 days, doesn't count toward annual evidence, no XLSX export
* Linked to an ephemeral scenario titled `Drill: {runbook title}`
* You're the facilitator; team can join via the seat lobby

Each drill stamps `lastDrilledAt` on the runbook. The chip shows `Drilled today` / `Drilled 5d ago` / amber `Drilled 213d ago` once it goes stale.

## Escalation chains

Library runbooks declare downstream playbooks the IMT should activate when they fire. For example:

* `RANSOMWARE` → `BCP_ACTIVATION` (HIGH) → `FCA_MATERIAL_INCIDENT` (HIGH) → `ICO_72H_BREACH` (always) → `DORA_MAJOR_ICT_INCIDENT` (HIGH)
* `DATA_EXFILTRATION` → `ICO_72H_BREACH` + `FCA_MATERIAL_INCIDENT`
* `BOE_SETTLEMENT_INCIDENT` → `FCA_MATERIAL_INCIDENT` + `PRA_MATERIAL_INCIDENT`

When you clone a library runbook, any escalation chains it declares get resolved against your other org runbooks automatically — both ways (the new clone gets its forward links wired, and any existing runbook that escalates to *it* gets its forward link wired too).

The runbook detail page shows two panels:

* **Escalates to** — downstream runbooks. With severity gate, rationale, and a `Target is DRAFT` chip if the target won't activate cleanly.
* **Triggered by** — upstream runbooks. The reverse view.

Admins can add / remove escalation links manually from the panel.

## See also

* [Runbook library](../libraries/runbooks.md) — the 50 templates, what's in each
* [Planning an exercise](planning-an-exercise.md) — runbooks fire inside exercises
* [During the exercise](during-the-exercise.md) — how the team walks the steps live
