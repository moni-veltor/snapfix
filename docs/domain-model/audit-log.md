# Audit log

Every mutation that touches org-scoped state writes an `AuditLogEntry`.

## The model

```prisma
model AuditLogEntry {
  id          String   @id @default(cuid())
  orgId       String
  actorId     String?              // null = system action
  action      String               // a value from the AuditAction union
  targetType  String               // "ibs" | "vendor" | "runbook" | …
  targetId    String?
  summary     String               // plain-English, displayed in /audit
  metadata    Json?                // action-specific structured detail
  createdAt   DateTime @default(now())

  @@index([orgId, createdAt])
}
```

Write-only stream. No update path, no delete path. Edits never rewrite history.

## The audit() helper

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

Failures inside `audit()` are caught and logged — they never break the calling user's action. The trade-off: lose audit-log integrity guarantees on intermittent DB failure. Acceptable for v1.

## What's already audited

`AuditAction` in `src/lib/audit.ts` is the registry. The union covers ~60 action types across nine domains:

* **Scenarios** — `scenario.created`, `scenario.updated`, `scenario.deleted`, `scenario.added-from-library`
* **Exercises** — `exercise.created`, `exercise.started`, `exercise.paused`, `exercise.completed`, `exercise.updated`, `exercise.member.added`, `exercise.member.removed`, `team.added`, `team.removed`, `event.released`, `inject.released`
* **IBS** — `ibs.created`, `ibs.updated`, `ibs.approved`, `ibs.deprecated`, `ibs.deleted`, `ibs.added-from-library`, `ibs.attestation.requested`, `ibs.attestation.attested`, `ibs.attestation.rejected`
* **Vendors + tech** — `vendor.added-from-library`, `vendor.mtp.updated`, `vendor.assessment.recorded`, `vendor.register.generated`, `vendor.notification.generated`, `vendor.notification.submitted`, `vendor.notification.acknowledged`, `system.added-from-library`, `dr_test.attested`, `dr_test.schedule_updated`
* **Runbooks** — `runbook.created`, `runbook.cloned_from_library`, `runbook.library_seeded`, `runbook.archived`, `runbook.deleted`, `runbook.updated`, `runbook.published`, `runbook.reviewed`, `runbook.drilled`, `runbook.escalation.added`, `runbook.escalation.removed`, `runbook.step.{added,updated,deleted,reordered}`, `runbook.ibs.linked`, `runbook.scenarios.linked`, `runbook.trigger.updated`, `runbook.execution.activated`, `runbook.execution.abandoned`, `runbook.execution.step.{started,completed,skipped}`
* **Action items** — `action_item.created`, `action_item.updated`, `action_item.closed`
* **Membership** — `member.added`, `member.removed`, `member.role_changed`, `member.department_changed`, `department.created`, `department.updated`, `department.deleted`
* **Invitations** — `invitation.sent`, `invitation.revoked`, `invitation.accepted`
* **Other** — `settings.updated`, `artefact.uploaded`, `artefact.deleted`

## Adding a new audit action

1. Add a new union member to `AuditAction` in `src/lib/audit.ts`
2. Call `audit()` with that action string in the relevant server action
3. The `/audit` page picks it up automatically — its action dropdown is populated via `prisma.auditLogEntry.groupBy({ by: ["action"] })`

## The /audit page

OWNER + ADMIN only. URL-driven server pagination, 50 rows per page. Three pieces:

* **`<AuditFilters>` client component** — debounced search (300ms), action dropdown (every action with row counts), actor dropdown (every actor + "System"), date range, "Clear all" link, "Export CSV" link.
* **List** — server-rendered, paginated via the shared `<Pagination>` primitive.
* **Filter semantics** — built by `buildAuditWhere()` in `src/lib/audit-query.ts`, shared verbatim between the page render and the CSV export route.

## CSV export

`/api/audit/export` is a GET route. Reads the same query params (`q`, `action`, `actor`, `from`, `to`), runs `buildAuditWhere()`, streams up to `MAX_ROWS = 50_000` rows as RFC-4180 quoted CSV with seven columns: `timestamp_iso · action · target_type · target_id · actor_name · actor_email · summary`. Adds a truncation marker row if the cap is hit.

Filter-set parity is guaranteed because `buildAuditWhere` is the single source of truth.

## Hash chain (regulator-evidence mode)

For exercises run with `regulatorMode: true`, the platform additionally hash-chains audit writes via `appendAuditEntry` in `src/lib/audit-hash-chain.ts`. Each entry stores the SHA-256 of the previous, so a regulator verifying the evidence pack can re-walk the chain and detect tampering. The chain lives in `ExerciseAuditHashEntry` (a separate table, exercise-scoped).

## See also

* [Server actions](../architecture/server-actions.md) — every mutation audits via the helper
* [Auth & permissions](../architecture/auth-and-permissions.md) — `actorId` comes from `me.id` after `requireOrgRole`
* [Audit log & compliance (user guide)](../user-guide/audit-and-compliance.md) — how operators use `/audit`
