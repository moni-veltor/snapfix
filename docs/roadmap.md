# Roadmap

Known gaps, deferred work, and what we'd build next if customer demand confirms it.

## Schema work pending

### Multi-org switcher (real)

The org-switcher UI is shipped but switching is a no-op today. To make it real:

* Add a `Membership` join table — `(userId, orgId, role, createdAt)` — with `@@unique([userId, orgId])`
* Add `User.activeOrgId` to track the current scope
* Refactor `auth.ts` so the JWT carries `activeOrgId` and `requireOrgRole` reads from membership rather than the user's single org
* UI: persist last-active-org per user, allow switching from the sidebar
* Backfill: every existing user gets a membership row to their current org

This is the largest schema change in the queue. Not blocking any single customer pilot, but blocking SaaS go-to-market.

### `Organization.sector`

Add an optional `sector: Sector` field to `Organization`. Today, library grids default to "All sectors". With this in place:

* Library pages default-filter to the org's sector
* Onboarding wizard asks for sector during org creation
* Achievements can call out sector-specific milestones

Small change but useful only after a critical mass of cross-sector library entries exists — which is now done (158 scenarios, 103 IBSs, 114 vendors across 16 sectors).

## Content gaps

* **Scenarios at 158 / target 220.** Headroom in banking, insurance, payments, retail. Easy to add organically as customers ask for specific shapes.
* **`/templates` content stale.** The 14 DB-backed CMORG templates date from the project's early phase. They're still good but could be refreshed with more recent incident patterns.
* **Vendor library: 4th-parties.** `Vendor.fourthParties` is present on the model but the library entries don't populate it. Worth adding for hyperscalers (AWS → Equinix DCs, etc.) and SWIFT (→ correspondents).

## Recently shipped

* **R1 — annual self-attestation foundation** — schema for the firm-wide annual self-attestation that mirrors PRA expectations. Three new models (`OrgResilienceAttestation`, `OrgResilienceMaterialChange`, `OrgResilienceAttestationHashEntry`), three `Organization` fields (named SMF, board committee, cycle start month), eleven new audit codes, `buildResilienceSnapshot` service for the frozen rollup, `appendAttestationHashEntry` for SHA-256 chain integrity, six-year retention floor via `retainUntilAt`. UI surfaces (dashboard, drill page, sign-off flow, material-change registry, XLSX/PDF pack) sequenced as R2–R5.
* **Tabbed planning page** — `/exercises/[id]` (PLANNING) replaced its long-scroll card stack with a tab list mirroring the 5 wizard stages. URL-deep-linkable (`?stage=…`), localStorage-sticky, smart-default to the first failing stage. Sticky readiness gauge stays, with click-to-jump on failing check labels.
* **Scenario IBS register integrity** — scenarios can no longer freeform-add IBSs. Every `ImportantBusinessService` row links to an APPROVED `OrganizationIBS` via the new nullable `organizationIBSId` FK. The IBS tab on `/scenarios/[id]` shows a modal picker of approved entries (search + click-to-add); library-cloned template IBSs flag as "Not in register" with inline link-in-place. New `scenario-ibs-linked` blocker in `evaluateReadiness` stops exercises going Ready while any IBS remains unlinked. Four new audit actions: `scenario.ibs.{added,linked,unlinked,removed}`.
* **Marketing site M1 — doctrine cleanup + consulting woven through** — all IMP/BCP/ORP references across `(marketing)` rewritten to generic operational-resilience language. New `<ConsultingCTA>` primitive lands on the homepage, the simulator product page, and embedded in `<UseCaseLayout>` so every use-case sub-page surfaces a use-case-specific consulting pitch. Homepage hero gains a secondary "or run it with us" line that deep-links to `/contact?interest=consulting`. ContactForm now pre-selects `interest` from the URL param. Footer newsletter form fixed (was a GET to `/contact`; now a real `subscribeNewsletterAction` server action).
* **Audit-log URL-driven pagination + CSV export** — `/audit` is now ADMIN-only with debounced search, action / actor / date-range filters, and `/api/audit/export` streaming up to 50k rows.
* **Sitrep auto-escalation** — INFO → DUE → ESCALATED → CRITICAL tiers driven by `deriveSitrepCadence`, surfaced on the participant Status tab and the facilitator overview.
* **Live tolerance burn-down** — per-IBS progress bar (OK → AT_RISK → BREACHED) on the live workspace, recomputed every poll tick.
* **Settings split + IBS attestation tab + comms detail drawer** — bundled settings split into focused tabs; IBS attestation history surfaced as a dedicated tab; communications now have a per-row drawer with full body + read-receipt grid (paginated).
* **Vendor admin redesign** — drawer-based wizards, lifecycle alert chips, MTP register page, `/vendors/risk` dashboard, next-actions panel.
* **Runbook redesign** — pre-flight engine, drill flow, escalation chain resolver, library tier filter, execution snapshots.
* **Participant-view redesign** — tabbed live workspace, capture drawers, facilitator announcements, approvals dock.
* **Dark-mode + a11y sweep** — every screen audited; semantic tokens enforced; StatusBadge component lands so colour-only status pills are gone.

## Annual self-attestation — R2 through R5 (in flight)

R1 (foundation) has shipped: schema, snapshot service, hash chain, audit codes, six-year retention. The four follow-up milestones build the operator surface on top of that foundation:

| Milestone | Scope |
|---|---|
| **R2** | `/resilience/attest` cycle dashboard + `/resilience/attest/[cycleYear]` drill page in read-only mode (snapshot rendering, sign-off progress, gap list). |
| **R3** | Three-line signing UI with role gating (only the named SMF can sign the executive line), `openCycleAction` / `signLineAction` / `boardApproveAction` server actions, hash-chained writes via `appendAttestationHashEntry`. |
| **R4** | Material change registry — `/resilience/material-changes`, declare / review actions, one-click deep-links from vendor criticality changes and IBS edits, banner integration on `/dashboard`. |
| **R5** | XLSX/PDF pack generator (matching the `VendorRegisterSnapshot` pattern), Vercel Blob upload, hard delete-block until `retainUntilAt`, supervisor-facing hash-chain export. |

## Features deferred to v2

| Item | Status |
|---|---|
| CMORG PDF library importer | Not started. Today the library is referenced manually. |
| WebSocket-based real-time multi-participant sync | Today: 10s polling via `LivePoller`. Real-time would need a separate websocket service. |
| AAR PDF / DOCX export | Today the report is in-app only. |
| File artefact uploads (Vercel Blob) | Schema + storage wired; UI deferred. |
| Fine-grained per-team participant permissions | Today: role-based gating only. |
| Hard-enforced dual-control approvals | `OrgDecisionType.requiresDualControl` ships as a soft chip; blocking single-approver completion is the follow-up. |
| Sentry / Datadog instrumentation | Pre-customer; deferred. See [Monitoring](operations/monitoring.md). |
| Customer-facing status page | Not yet needed. |

## UX gaps worth knowing

* **The dropdown-positioning fix** — both `ComposeMenu` and `NotificationBell` had clipping bugs (dropdowns extended past the sidebar's left edge). Fixed with `absolute left-0 top-full`. If you add a third sidebar-attached dropdown, follow the same anchoring.
* **Help drawer** — `?` button in the sidebar opens a right-rail drawer with shortcuts + onboarding links. The shortcut list is hardcoded; sync it when keyboard surfaces change.
* **Compose menu gating** — `ComposeMenu` only renders for `canManageOrg` users. Participants see a flex-1 spacer in its place to keep the bell + help right-aligned.

## Long-term

* **Multi-tenant deploy** — currently single-tenant per Vercel project. SaaS would mean either a tenant-id-in-domain pattern or shared infra with namespace separation.
* **Mobile-first participant view** — current UI is desktop-optimised. Participants in a real exercise often have phones in hand. Worth a dedicated /m/ route or PWA pass.
* **Custom scenario library entries per customer** — today the curated library is uniform across customers. Premium customers may want "Bank X's private scenarios" surfaced alongside the global library. Requires `LibraryScenario.orgId` (nullable) + scoping on the library page.

## Where to capture new items

Append to this page. When something graduates to "in flight", move it to the relevant section header. When it ships, delete the bullet — git history has the receipt.
