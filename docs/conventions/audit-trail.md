# Audit trail

Every mutation that changes org-scoped state must write an `AuditLogEntry`. This is non-negotiable for regulator-facing operational-resilience work.

## What to audit

* **All CRUD on register rows** — IBS, Vendor, TechSystem, Scenario, Exercise, ActionItem
* **Lifecycle transitions** — approval, deprecation, release of events / injects, runbook step start / complete / skip, sitrep escalation, tolerance breach
* **Membership changes** — role changes, invitations, removals, department assignments
* **Settings changes** — anything that affects org-wide behaviour
* **Artefact uploads / deletes**

## What NOT to audit

* Pure read paths
* Internal compute (computing scores, derivatives, recomputing live tolerance)
* Per-user UI preferences (sidebar collapse, theme, last-active tab in localStorage)
* Live-workspace poll ticks

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
  metadata: { librarySlug: lib.slug },
});
```

## The contract

* `action` must be a member of the `AuditAction` union in `src/lib/audit.ts`. Adding a new mutation = adding a new union member.
* `summary` should be a human-readable sentence — it shows up in the audit log viewer's main column. Include the friendly name (not just the id).
* `metadata` (optional JSON) is for structured detail — *not* for stuffing the whole new row into. Be selective.
* `audit()` catches its own errors. The caller's action proceeds even if audit-write fails.

## Where actor comes from

`actorId` is `me.id` from `await requireOrgRole(...)`. Always pass it. The audit-log viewer uses it to render "who did this".

For system-driven events (cron, webhook, scheduled sitrep escalations), pass `null` and the viewer renders "System".

## Reading the audit log

`/audit` is OWNER + ADMIN only. URL-driven server pagination at 50 rows per page. Filter chips: action type (with per-action row counts), target type, actor (name / email + "System"), date range, free-text search on the summary column.

The page's filter component is `<AuditFilters>` (client) with debounced search (300ms) and a "Clear all" link.

## CSV export

`/api/audit/export` is a GET route that reads the same query params as the page (`q`, `action`, `actor`, `from`, `to`), runs the shared `buildAuditWhere()` from `src/lib/audit-query.ts`, and streams up to `MAX_ROWS = 50_000` rows as RFC-4180 quoted CSV with seven columns: `timestamp_iso · action · target_type · target_id · actor_name · actor_email · summary`. Adds a truncation marker row if the cap is hit.

Filter-set parity between page and export is guaranteed because `buildAuditWhere` is the single source of truth.

## Hash chain (regulator-evidence mode)

For exercises run with `regulatorMode: true`, audit writes are also hash-chained via `appendAuditEntry` in `src/lib/audit-hash-chain.ts`. Each entry stores the SHA-256 of the previous entry, so a regulator verifying the evidence pack can re-walk the chain and detect tampering. The chain lives in `ExerciseAuditHashEntry` (separate table, exercise-scoped).

## Retention

Audit-log entries are kept indefinitely. There is no purge job. For long-running customer engagements this can grow large; partition by month / year if needed.

## The full action list

See [Domain model → Audit log](../domain-model/audit-log.md) for the current ~60 action types organised by domain.
