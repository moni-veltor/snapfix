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

## Features deferred to v2

| Item | Status |
|---|---|
| CMORG PDF library importer | Not started. Today the library is referenced manually. |
| WebSocket-based real-time multi-participant sync | Today: 10s polling via `LivePoller`. Real-time would need a separate websocket service. |
| AAR PDF / DOCX export | Today the report is in-app only. |
| File artefact uploads (Vercel Blob) | Schema + storage wired; UI deferred. |
| Fine-grained per-team participant permissions | Today: role-based gating only. |
| Audit-log CSV export | Manual via Prisma Studio today. |
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
