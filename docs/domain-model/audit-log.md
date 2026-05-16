# Audit log

Every mutation that touches org-scoped state writes an `AuditLogEntry`.

## The model

```prisma
model AuditLogEntry {
  id          String   @id @default(cuid())
  orgId       String
  actorId     String?
  action      String   // the AuditAction union string
  targetType  String   // "ibs" | "vendor" | "tech-system" | "scenario" | …
  targetId    String?
  summary     String
  metadata    Json?
  createdAt   DateTime @default(now())
}
```

It's a write-only stream. No update path, no delete path.

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
});
```

Failures inside `audit()` are caught and logged — they never break the calling user's action. The trade-off: lose audit-log integrity guarantees on intermittent DB failure. Acceptable for v1.

## What's already audited

The `AuditAction` union in `src/lib/audit.ts` is the registry. Current entries:

* Scenario lifecycle: `scenario.created`, `scenario.updated`, `scenario.deleted`, `scenario.added-from-library`
* Exercise lifecycle: `exercise.created`, `exercise.started`, `exercise.paused`, `exercise.completed`, `exercise.updated`, `exercise.member.added`, `exercise.member.removed`
* Team management: `team.added`, `team.removed`
* Event/inject: `event.released`, `inject.released`
* IBS lifecycle: `ibs.created`, `ibs.updated`, `ibs.approved`, `ibs.deprecated`, `ibs.deleted`, `ibs.added-from-library`
* Vendor / system: `vendor.added-from-library`, `system.added-from-library`
* Action items: `action_item.created`, `action_item.updated`, `action_item.closed`
* Membership: `member.added`, `member.removed`, `member.role_changed`
* Invitations: `invitation.sent`, `invitation.revoked`, `invitation.accepted`
* Settings: `settings.updated`
* Artefacts: `artefact.uploaded`, `artefact.deleted`

## Adding a new audit action

1. Add a new union member to `AuditAction` in `src/lib/audit.ts`
2. Call `audit()` with that action string in the relevant server action
3. Update the audit-log viewer's action-filter chip list if needed

## Viewer

`/audit` renders a paginated table for admins. Filters by action, target type, actor, date range. Search by summary.

## See also

* [Server actions](../architecture/server-actions.md) — every action audits its mutation
* [Auth & permissions](../architecture/auth-and-permissions.md) — `actorId` comes from `me.id` after `requireOrgRole`
