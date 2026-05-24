# Audit log & compliance

Every mutation that touches org-scoped state in SnapFix writes an immutable row to the audit log. The `/audit` page is your regulator-friendly window into that stream.

## What gets logged

The `AuditAction` registry currently covers ~60 distinct action types, including:

* **Scenarios** — created · updated · deleted · added-from-library
* **Exercises** — created · started · paused · completed · updated; member added/removed; team added/removed
* **Events + injects** — released
* **IBSs** — created · updated · approved · deprecated · deleted · added-from-library; attestation requested / attested / rejected
* **Vendors + tech systems** — added-from-library, MTP register updated, assessment recorded, register XLSX generated, notification generated / submitted / acknowledged
* **Runbooks** — created · cloned-from-library · archived · deleted · updated · published · reviewed · drilled; step added/updated/deleted/reordered; IBS / scenarios linked; trigger updated; escalation added/removed; execution activated/abandoned/step-started/completed/skipped
* **DR tests** — attested · schedule updated
* **Action items** — created · updated · closed
* **Membership** — added · removed · role-changed · department-changed
* **Departments** — created · updated · deleted
* **Invitations** — sent · revoked · accepted
* **Settings** — updated
* **Artefacts** — uploaded · deleted

Each row carries: `orgId`, `actorId` (null = system action), `action`, `targetType`, `targetId`, plain-English `summary`, optional structured `metadata` JSON, `createdAt`.

The stream is **write-only** — no update path, no delete path. Edits don't rewrite history.

## The `/audit` page

OWNER + ADMIN only. The page has four layers:

* **Filter bar** — debounced search across summary + action + actor; action dropdown (every action type with row counts); actor dropdown (every actor + "System (no actor)"); from + to date range; "Clear all" link.
* **The list** — 50 rows per page, server-paginated, newest first.
* **Pagination footer** — windowed page-number nav, "Showing X – Y of Z".
* **Export CSV button** — pulls the **full filtered set** (capped at 50,000 rows with a truncation marker), RFC-4180 quoted, seven columns: timestamp · action · target type · target id · actor name · actor email · summary.

The action dropdown and actor dropdown are populated server-side from a `findMany({ distinct })` so they reflect the entire register, not just what's currently on screen.

## Regulator-evidence mode

For exercises run with `regulatorMode: true`, audit-log writes are hash-chained:

* Each entry includes the SHA-256 hash of the previous one
* Closure produces an evidence pack referencing the hash chain
* A regulator verifying the pack can re-walk the chain and detect any tampering

The pack URL is generated at closure and uploaded to Vercel Blob.

## How to export for a regulator

1. Filter to the relevant date range (e.g. exercise start to closure)
2. Filter to the relevant actor or action type if scope-constrained
3. Click **Export CSV** — the download includes everything that matches the filters
4. Hand the CSV + the evidence-pack URL to the regulator

50,000 rows is more than a year of audit for a well-paced firm. If you hit the cap, narrow the date range and run multiple exports.

## Dual-control flag on decision presets

Org-defined decision presets (`/settings/decisions`) can be flagged **Requires dual control**. This surfaces a "requires 2 approvers" chip on the decision picker + approvals dock so the IMT chair knows the decision needs the 4-eyes rule before it can be marked taken.

Enforcement of the dual-approval workflow (blocking single-approver completion) is a planned follow-up; today the flag is a strong visual cue.

## Audit-trail invariants

* Audit writes never break the calling user's action. If the audit `INSERT` fails, the action still succeeds and the failure is logged server-side.
* `actorId` is `null` for system actions (auto-release of scheduled events, cron-triggered evaluations, etc.) — these still appear in the audit log.
* `targetType + targetId` lets you reconstruct every state change for a single object (`prisma.auditLogEntry.findMany({ where: { targetType: "vendor", targetId: "..." } })`).
* The `metadata` JSON column carries action-specific detail (e.g. for `runbook.drilled`, the `exerciseId` of the drill).

## See also

* [After the run — debrief](exercises-debrief.md) — the evidence pack lives on the debrief page
* [During the run — live workspace](exercises-live.md) — every decision / sitrep / comms-draft / runbook step lands in the audit log
