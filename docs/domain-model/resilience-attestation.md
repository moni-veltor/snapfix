# Annual operational-resilience self-attestation

The firm-wide annual artefact a regulator can ask to see within an hour of walking in. SnapFix's per-IBS three-line `IBSAttestation` chain captures granular sign-off for one service; this layer rolls those up into a single signed document for the whole firm, signed by the named SMF accountable for operational resilience.

R1 ships the schema, the snapshot service and the audit codes. R2–R5 layer on the UI, the material-change registry, the three-line signing flow and the XLSX/PDF pack.

## The models

```
OrgResilienceAttestation
├── orgId, cycleYear, cycleLabel ("FY2026")
├── status: DRAFT | UNDER_REVIEW | ATTESTED | SUPERSEDED
├── openedAt, openedById
├── firstLineSignedAt / firstLineSignedById / firstLineNotes
├── secondLineSignedAt / secondLineSignedById / secondLineNotes
├── executiveSignedAt / executiveSignedById / executiveNotes    ← named SMF
├── boardApprovedAt, boardCommittee, boardMinuteRef
├── snapshotJson            ← frozen rollup at sign-off
├── gapsJson                ← [{ ibsId, gap, remediation, ownerId, dueDate, costGBP }]
├── investmentPlanJson      ← [{ item, costGBP, ownerId, plannedDate, status }]
├── executiveSummary        ← markdown
├── blobUrl                 ← generated XLSX/PDF pack (R5)
├── supersededByCycleId     ← mid-year re-attestation pointer
└── retainUntilAt           ← openedAt + 6 years, hard delete floor

OrgResilienceMaterialChange
├── orgId, attestationCycleId?
├── kind: IBS_ADDED | IBS_REMOVED | TOLERANCE_CHANGED | VENDOR_CRITICALITY_CHANGED
│       | RESOURCE_MAP_CHANGED | NEW_REGULATORY_REQ | MATERIAL_INCIDENT | OTHER
├── description, impactedIbsIds[]
├── declaredAt, declaredById
├── reviewedAt, reviewedById
├── reviewOutcome: PENDING | ACKNOWLEDGED | TRIGGERED_REATTESTATION | NO_ACTION
└── reviewNotes, auditEntryId

OrgResilienceAttestationHashEntry
├── attestationId
├── sequence, hash, prevHash, payload, occurredAt
```

Plus three new fields on `Organization`:

* `smfAccountableForResilienceUserId` — the named SMF who signs the executive line
* `boardCommitteeForResilienceName` — e.g. "Board Risk Committee"
* `attestationCycleStartMonth` — calendar month (1–12) the annual cycle opens; null = January

## The cycle lifecycle

```
DRAFT
  │ openCycleAction (admin)
  ▼
UNDER_REVIEW
  │ firstLineSign / secondLineSign / executiveSign
  ▼ (executive line is the gate to ATTESTED)
ATTESTED
  │ supersedeAction (e.g. mid-year re-attestation after a material change)
  ▼
SUPERSEDED  ← retained, never deleted before retainUntilAt
```

Each transition writes an `OrgResilienceAttestationHashEntry`. The chain is SHA-256: `prevHash || canonical(payload) || timestamp`, with sequence 0 starting from 64 zero-chars. Lets a supervisor verify the chain offline and detect tampering.

## The snapshot

`buildResilienceSnapshot(orgId)` in `src/lib/resilience-attestation.ts` composes the frozen rollup written to `snapshotJson` at sign-off. Includes:

| Block | Contents |
|---|---|
| `ibsRegister` | Every `OrganizationIBS` with code, name, status, tolerances (primary + FCA + PRA), tolerance rationale, criticality, process owner, owner department, full three-line `IBSAttestation` chain, structured `IBSResource` map |
| `vendorCriticality` | Every `Vendor` with tier, DORA-critical flag, MTP flag, IBS link list |
| `exerciseHistoryLast12Months` | Every exercise planned or started in the last 12 months — scenario, status, mode, IBSs tested, AAR-present flag, action-item count |
| `openActionItems` | Every `ExerciseActionItem` not in DONE / WONT_FIX — title, owner, due date, status, priority |
| `materialChangesSinceLastCycle` | Material changes linked to the prior cycle (when `opts.sinceCycleId` supplied) |

The snapshot is a deep freeze — later edits to the register / vendors / exercises don't mutate historical attestations.

## Six-year retention

`retainUntilAt` is computed as `openedAt + 6 years` at row creation. Any delete path (cascade-or-otherwise) must check this floor before removing the row. R5 will add a `retentionLock` server guard before the row leaves the database.

## Audit actions

Eleven new entries in the `AuditAction` union:

```
attestation.cycle.opened
attestation.cycle.superseded
attestation.first_line.signed
attestation.second_line.signed
attestation.executive.signed
attestation.board.approved
attestation.snapshot.generated
attestation.pack.generated
attestation.material_change.declared
attestation.material_change.reviewed
attestation.settings.updated
```

Each follows the standard `audit()` contract — `orgId`, `actorId`, `action`, `targetType` (`attestation` or `attestation_material_change`), `targetId`, `summary` and structured `metadata`.

## R2 — dashboard + drill (shipped)

The read-only operator surface, admin-gated under `/resilience/attest`:

* **Dashboard** (`/resilience/attest`) — lists every cycle newest-first with a per-cycle sign-off progress bar (`n/3 signed`), a due-date countdown (green → amber ≤30d → rose when overdue), the IBS-count from the frozen snapshot, and a status badge. Surfaces a setup nudge when the SMF or cycle-start-month isn't configured, and a banner when material changes await review. Empty state offers a one-click "Open FY{year} cycle".
* **Drill page** (`/resilience/attest/[cycleYear]`) — a tabbed view over the frozen `snapshotJson`:
  * **Overview** — five stat tiles (IBS count, tested-in-12mo, exercises, open action items, vendors mapped).
  * **IBS register** — every IBS with tolerances, attestation-line count, and a tested/not-tested chip.
  * **Vendors** — criticality map with MTP / DORA-critical flags.
  * **Exercises** — last-12-months history with AAR-filed status.
  * **Action items** — open items with owner / due / priority.
  * **Sign-off** — read-only three-line chain + board ratification status (signing actions arrive in R3).

Two server actions create a cycle (sign-off stays read-only until R3):

* `openAttestationCycleAction(cycleYear?)` — creates a DRAFT cycle (idempotent per `@@unique([orgId, cycleYear])`), captures the initial snapshot, audits `attestation.cycle.opened`, redirects to the drill page.
* `regenerateAttestationSnapshotAction(cycleId)` — re-captures the snapshot on a DRAFT cycle (no-op once `UNDER_REVIEW` / `ATTESTED`), audits `attestation.snapshot.generated`.

Plus two service helpers: `computeCycleDueAt(cycleYear, startMonth)` (cycle opens at the configured month + a 90-day sign-off window) and `daysUntil(due)`. Nav: an "Attestation" entry under the sidebar's Admin section (OWNER / ADMIN only).

## What's still ahead

| Milestone | Scope |
|---|---|
| **R3** | Three-line signing UI + role gating (only the named SMF signs the executive line) + state machine + hash-chain writes via `appendAttestationHashEntry`. Org settings page for SMF / board committee / cycle-start-month. |
| **R4** | Material change registry, declare/review actions, vendor + IBS deep-links, dashboard banner integration |
| **R5** | XLSX/PDF pack generator (Vercel Blob), retention lock, supervisor-facing chain export |

## See also

* [IBS register](ibs-register.md) — the per-IBS three-line attestation chain (`IBSAttestation`) this layer rolls up
* [Audit log](audit-log.md) — the full action catalogue, including the eleven new attestation codes
* [Data schemas → IBS register](../data-schemas/ibs.md) — the per-IBS attestation ERD
