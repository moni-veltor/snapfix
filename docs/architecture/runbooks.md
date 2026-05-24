# Runbooks subsystem

The runbook layer is three things: a 50-template **library** (TS, not DB), a per-org **catalogue** (`Runbook`), and an **execution** layer that snapshots runbooks against an incident.

## Models

```
Runbook                     ── per-org playbook (or library template when isTemplate=true)
├── steps: RunbookStep[]    ── ordered + DAG-aware via blocksOrders[]
├── trigger?: RunbookTriggerCondition  ── auto-fire when scenario+severity match
├── ibsLinks                 ── many-to-many with OrganizationIBS
├── scenarioLinks            ── many-to-many with Scenario
├── escalatesTo / escalatedFrom: RunbookEscalation[]  ── chain to downstream runbooks
└── executions: RunbookExecution[]

RunbookExecution             ── one per incident × runbook
├── runbookJson              ── frozen snapshot of the runbook + every step at activation
├── stepExecutions: RunbookStepExecution[]  ── per-step status + completedBy + links
└── status: ACTIVE | COMPLETE | ABANDONED
```

The version-stamp pattern (`runbookJson` snapshot) means edits-after-activation never alter the historical record. Step completion writes back to the `RunbookStepExecution` row, but the source-of-truth for what was *supposed* to happen is the frozen JSON.

## Library

`src/lib/library/runbooks.ts` holds 50 templates, each with:

* `slug`, `title`, `description`, `category` (`RANSOMWARE | CLOUD_REGION_OUTAGE | VENDOR_FAILURE | BCP_ACTIVATION | DATA_INCIDENT | PEOPLE_DISRUPTION | REGULATORY_NOTIFICATION | CYBER | OTHER`), `ownerRoleTitle`
* `applicableTiers: FirmTier[]` — gates library filter ("Bank only", "G-SIB only", universal)
* Optional `trigger: { severityAtLeast, scenarioCategoryEquals }`
* Optional `escalates: LibraryRunbookEscalation[]` — slug-pointers to downstream library runbooks
* `steps: LibraryRunbookStep[]` — each with `slug`, `title`, `description`, `kind` (`ACTION | DECISION | NOTIFICATION | COMMS | CHECKPOINT`), `ownerRoleTitle`, `estimatedMin`, `dependsOn[]`, optional `decisionTypeCode`, `regulatorTrigger`, `commsTemplate`

Clone action: `addRunbookFromLibraryAction` (`src/app/actions/runbooks.ts`) creates a `Runbook` row + `RunbookStep` rows, resolves `dependsOn` slugs to `blocksOrders` indices, and calls `resolveLibraryEscalations(orgId)` afterwards — which walks every library entry, finds the matching org runbook by title, and inserts the `RunbookEscalation` rows in both directions (forward + reverse).

## Pre-flight

`src/lib/runbook-preflight.ts` exports a pure `evaluateRunbookPreflight(input)` returning:

```ts
{
  issues: PreflightIssue[],
  blockerCount: number,
  warningCount: number,
  readiness: "READY" | "NEEDS_REVIEW" | "BLOCKED",
}
```

Each `PreflightIssue` carries a stable `code`, severity (`blocker` | `warning`), message, optional detail, optional fix-href deep-link. Nine codes:

* `DRAFT_STATUS` (blocker) — runbook is DRAFT
* `NO_STEPS` (blocker) — zero steps defined
* `STEPS_MISSING_OWNERS` (warning)
* `OWNER_NOT_IN_ROLE_CATALOGUE` (warning) — whole-runbook owner-role isn't in the org catalogue
* `STEP_OWNERS_NOT_IN_CATALOGUE` (warning) — step-owner role-titles unrecognised
* `NO_IBS_LINK` (warning)
* `NO_TRIGGER` (warning) — manual-only activation
* `NEVER_REVIEWED` (warning) — `lastReviewedAt` is null
* `STALE_REVIEW` (warning) — `lastReviewedAt` > 180 days ago
* `ESCALATION_TARGET_DRAFT` (warning) — a downstream chain target is still DRAFT

Same scoring engine drives the readiness chip on `/runbooks` cards + the pre-flight panel on `/runbooks/[id]`.

## Drill flow

`drillRunbookAction(runbookId)` creates an ephemeral scenario + a WALKTHROUGH/DRY_RUN exercise + a `RunbookScenarioLink` + stamps `lastDrilledAt` on the runbook, in one transaction. Then redirects to `/exercises/{newExerciseId}`. DRY_RUN exercises purge after 30 days and don't count toward annual evidence.

## Escalation chains

`RunbookEscalation` is a self-join on `Runbook` with `sourceRunbookId`, `targetRunbookId`, optional `severityAtLeast`, optional `rationale`, `orderIdx`. The library declares chains via slug:

```ts
const RANSOMWARE: LibraryRunbook = {
  // …
  escalates: [
    { targetSlug: "bcp-activation",          severityAtLeast: "HIGH", rationale: "…" },
    { targetSlug: "fca-material-incident",   severityAtLeast: "HIGH", rationale: "…" },
    { targetSlug: "ico-72h-breach",                                   rationale: "…" },
    { targetSlug: "dora-major-ict-incident", severityAtLeast: "HIGH", rationale: "…" },
  ],
  // …
};
```

20 library entries currently ship with declared chains (RANSOMWARE, CLOUD_REGION_OUTAGE, VENDOR_FAILURE, etc.). The resolver runs at clone-time + bulk-seed-time so chains backfill in both directions.

Admins can also add chains manually from the runbook detail page — `addRunbookEscalationAction` / `removeRunbookEscalationAction`.

## Execution layer

`manualActivateRunbookAction(runbookId, incidentId)` and the auto-activation logic (when `incident.severity >= trigger.severityAtLeast` AND `scenario.category === trigger.scenarioCategoryEquals`) both call into the same shared activator:

```ts
const execution = await prisma.runbookExecution.create({
  data: {
    incidentId,
    runbookId,
    runbookJson: serialiseFrozenRunbook(runbook),  // snapshot
    activatedBy: "AUTO" | "MANUAL",
    activationReason,
    stepExecutions: { create: runbook.steps.map(s => ({ stepOrderIdx, status: "PENDING" })) },
  },
});
```

`startRunbookStepAction` / `completeRunbookStepAction` / `skipRunbookStepAction` operate on individual `RunbookStepExecution` rows. Completing a `DECISION` step auto-writes a `DecisionRecord` + `IncidentLogEntry`; completing a `NOTIFICATION` step flips the linked `RegulatorNotification` to SENT; completing a `COMMS` step marks the linked `CommunicationDraft` as APPROVED.

## See also

* [Live workspace](live-workspace.md) — where runbook executions appear during a run
* [Runbook library](../libraries/runbooks.md) — the 50 templates explained
* [Forms, actions & toasts](../conventions/forms-and-actions.md) — pattern reference for step actions
