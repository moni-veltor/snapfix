# Audit trail

Every mutation that changes org-scoped state must write an `AuditLogEntry`. This is non-negotiable for regulator-facing operational-resilience work.

## What to audit

* **All CRUD on register rows** — IBS, Vendor, TechSystem, Scenario, Exercise, ActionItem
* **Lifecycle transitions** — approval, deprecation, release of events / injects
* **Membership changes** — role changes, invitations, removals
* **Settings changes** — anything that affects org-wide behaviour
* **Artefact uploads / deletes**

## What NOT to audit

* Pure read paths
* Internal compute (computing scores, derivatives)
* Per-user UI preferences (sidebar collapse, theme)

## How

```ts
import { audit } from "@/lib/audit";

await audit({
  orgId: me.orgId,
  actorId: me.id,
  action: "vendor.added-from-library",
  targetType: "vendor",
  targetId: created.id,
  summary: `Added vendor ${created.name} from library (${lib.category})`,
});
```

## The contract

* `action` must be a member of the `AuditAction` union in `src/lib/audit.ts`. Adding a new mutation = adding a new union member.
* `summary` should be a human-readable sentence — it shows up in the audit log viewer's main column. Include the friendly name (not just the id).
* `metadata` (optional JSON) is for structured detail — *not* for stuffing the whole new row into. Be selective.
* `audit()` catches its own errors. The caller's action proceeds even if audit-write fails.

## Where actor comes from

`actorId` is `me.id` from `await requireOrgRole(...)`. Always pass it. The audit-log viewer uses it to render "who did this".

For system-driven events (cron, webhook), pass `null` and the viewer renders "system".

## Reading the audit log

`/audit` renders a paginated table with filters:

* Action type (chip filter)
* Target type
* Actor (search by name / email)
* Date range
* Free-text search on the summary column

Export to CSV is on the [Roadmap](../roadmap.md).

## Retention

Audit-log entries are kept indefinitely. There is no purge job. For long-running customer engagements this can grow large; we'll partition by month / year later if needed.

## The full action list

See [Domain model → Audit log](../domain-model/audit-log.md) for the current union members.
