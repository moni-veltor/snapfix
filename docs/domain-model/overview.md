# Domain model overview

SnapFix has 50 Prisma models. Most fall cleanly into one of seven concept groups.

## Concept groups

| Group | Models | Purpose |
|---|---|---|
| **Tenancy & identity** | `Organization`, `User`, `Account`, `Session`, `VerificationToken`, `Invitation`, `OrganizationRole` | Who is in which org and what they can do |
| **IBS register** | `OrganizationIBS` | Each org's Important Business Services and their tolerances |
| **Scenarios & templates** | `Scenario`, `ImportantBusinessService`, `Event`, `Inject`, `EventIBS`, `FacilitatorQuestion`, `DebriefQuestion`, `Artefact` | The scenario design (MSEL + injects + IBS impacts) |
| **Exercises (live runs)** | `Exercise`, `ExerciseTeam`, `ExerciseParticipant`, `ExerciseSeat`, `EventRelease`, `InjectRelease`, `IncidentLogEntry`, `ParticipantResponse`, `CommunicationDraft`, `EventReceipt`, `InjectReceipt`, `ChatMessage`, `Reaction`, `ExerciseScratchpad`, `Sitrep`, `IMTMeeting`, `DecisionRecord`, `BCPActivation`, `RegulatorNotification` | Everything that happens during a live tabletop |
| **Post-exercise** | `DebriefAnswer`, `AfterActionReport`, `ExerciseActionItem`, `PostIncidentReport`, `Retrospective`, `ImpactBreach` | After the run finishes |
| **Vendor & tech register** | `Vendor`, `VendorIBSLink`, `TechSystem`, `DRTest` | Third-party and system dependencies for the IBS register |
| **Audit & ops** | `AuditLogEntry`, `OrganizationTeamTemplate`, `Incident`, `RecoveryPlan` | Cross-cutting log + ops bookkeeping |

## Sub-pages

* [Organizations & users](organizations-users.md) — tenancy and identity
* [IBS register](ibs-register.md) — the heart of operational-resilience compliance
* [Scenarios & exercises](scenarios-and-exercises.md) — design and live-run models
* [Vendors & tech systems](vendors-and-tech.md) — third-party and DR ledger
* [Audit log](audit-log.md) — what's audited and how

## One important distinction

The schema has **two IBS models** — they look similar but serve different roles:

* **`OrganizationIBS`** — an IBS in an org's register. This is what `/ibs` lists. Has an org-unique code (`IBS_01`, `IBS_02`...), full CMORG metadata (tolerance, criticality, resource map, importance assessment, harm-coverage flags).
* **`ImportantBusinessService`** — an IBS *referenced inside a scenario*. Tied to a specific `Scenario`, captures the impact-tolerance assumption used in that exercise. May or may not correspond to an `OrganizationIBS` in the running org's register.

The naming is unfortunate but historical. When in doubt: `OrganizationIBS` = register row; `ImportantBusinessService` = scenario-local row.

## Cross-cutting `orgId`

Almost every domain model has an `orgId` foreign key. The exceptions are:

* User-account tables (`User`, `Account`, `Session`, `VerificationToken`) — users can in principle exist outside orgs (used by NextAuth's prisma adapter)
* `Scenario` rows where `orgId` is **nullable** — null means "CMORG library template, org-agnostic". Cloned scenarios have an `orgId`.

When you query an org-scoped model, *always* filter by `orgId`. See [Auth & permissions](../architecture/auth-and-permissions.md) for the `findFirst({ where: { id, orgId } })` pattern.
