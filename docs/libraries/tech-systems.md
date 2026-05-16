# Tech-system library

~40 banking-stack systems with sensible default RTO / RPO / MTPD and failover topology. Lives in `src/lib/tech-system-library.ts`.

## Shape of an entry

```ts
{
  slug: "core-banking-ledger",
  name: "Core banking ledger",
  kind: "APPLICATION",
  suggestedTier: "CRITICAL",
  description: "Source-of-truth ledger holding customer balances.",
  rtoMin: 30,
  rpoMin: 1,
  mtpdMin: 240,
  suggestedFailoverKind: "ACTIVE_ACTIVE",
  primaryRegion: "eu-west-2",
  failoverRegion: "eu-west-1",
  backupFrequency: "continuous",
  backupRetentionDays: 2555,
}
```

## Coverage

Currently focused on a UK retail-banking stack but applicable to many sectors. Entries grouped by `TechSystemKind`:

| Kind | Examples |
|---|---|
| `APPLICATION` | Core banking ledger, payments engine, card authorisation, mobile app, internet banking, KYC, CRM, statement generator, treasury platform, reconciliations |
| `INFRASTRUCTURE` | AWS primary / failover region, Kubernetes prod, edge/CDN, secrets vault, CI/CD |
| `DATABASE` | Customer master, ledger DB, transactions DB, data warehouse, Redis cache |
| `NETWORK` | SWIFTNet gateway, Faster Payments connector, Bacs, CHAPS, VPN, internet edge |
| `AUTH` | Customer IdP, employee SSO, MFA, privileged access |
| `OBSERVABILITY` | APM/metrics (Datadog), log aggregation, PagerDuty, SIEM |
| `OTHER` | Email gateway, SMS gateway |

## The clone action

`addLibrarySystemAction(slug)` in `src/app/actions/tech-recovery.ts`:

1. `requireOrgRole("OWNER", "ADMIN")`
2. Look up `LibrarySystem` by slug
3. Dedupe by name (the model has `@@unique([orgId, name])`)
4. Create the `TechSystem` row with library values — including RTO / RPO / MTPD + failover topology + regions + backup defaults
5. Write `system.added-from-library` audit
6. `revalidatePath` + redirect to `/tech-recovery`

## Defaults are starting points

Library entries seed sensible-but-generic defaults:

* Tier-1 ledger / payments → CRITICAL, ACTIVE_ACTIVE, RTO 30m, RPO 1m
* Tier-2 customer apps → ESSENTIAL, ACTIVE_PASSIVE, RTO 60m, RPO 5m
* Observability → IMPORTANT, WARM_STANDBY
* Data warehouse → IMPORTANT, COLD_RESTORE

Admins refine these post-add to match their actual deployment. The wizard / edit form is the place to do that.

## Adding entries

1. Append a new object to `SYSTEM_LIBRARY`
2. Pick a `kind` from `TechSystemKind`
3. Pick a `suggestedTier` from `TechSystemTier`
4. Set realistic RTO / RPO / MTPD; if unsure, look at how an adjacent entry treats them

## See also

* [Vendors & tech systems](../domain-model/vendors-and-tech.md) — the runtime `TechSystem` model and DR-test ledger
