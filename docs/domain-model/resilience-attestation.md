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

## What R1 does NOT include

R1 is foundation only — schema, service function, audit codes, docs. No UI, no server actions, no sign-off flow, no pack generation. Those land in R2–R5:

| Milestone | Scope |
|---|---|
| **R2** | `/resilience/attest` dashboard + drill page (read-only snapshot view, sign-off progress, gap list) |
| **R3** | Three-line signing UI + role gating + state machine + hash-chain writes |
| **R4** | Material change registry, declare/review actions, vendor + IBS deep-links, banner integration |
| **R5** | XLSX/PDF pack generator (Vercel Blob), retention lock, supervisor-facing chain export |

## See also

* [IBS register](ibs-register.md) — the per-IBS three-line attestation chain (`IBSAttestation`) this layer rolls up
* [Audit log](audit-log.md) — the full action catalogue, including the eleven new attestation codes
* [Data schemas → IBS register](../data-schemas/ibs.md) — the per-IBS attestation ERD
