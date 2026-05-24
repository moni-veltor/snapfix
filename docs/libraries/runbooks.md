# Runbook library

`src/lib/library/runbooks.ts` ships 50 best-practice templates the IMT can walk during a scenario or a real incident. Each is `LibraryRunbook`-shaped:

```ts
type LibraryRunbook = {
  slug: string;
  title: string;
  description: string;
  category: RunbookCategory;
  ownerRoleTitle: string;
  applicableTiers: readonly FirmTier[];
  trigger?: { severityAtLeast?: SeverityLevel; scenarioCategoryEquals?: string };
  escalates?: ReadonlyArray<LibraryRunbookEscalation>;
  steps: LibraryRunbookStep[];
};
```

## Tier presets

Templates are tagged with the firm tiers they apply to:

* `ALL_TIERS` — TIER_1 + TIER_2 + TIER_3 (universal)
* `BANKS` — TIER_1 + TIER_2 (bank-authorised firms only)
* `GSIB` — TIER_1 only

The `/runbooks` page uses these to filter the library drawer. Of the 50 templates, 47 are universal, 2 are bank-only (`pra-material-incident`, `dora-major-ict-incident`), and 1 is G-SIB-only (`boe-settlement-incident`).

## Categories

| Category | Examples |
|---|---|
| `RANSOMWARE` | `ransomware-response` |
| `CYBER` | `phishing-credential-compromise`, `supply-chain-compromise`, `insider-threat-privileged-user`, `zero-day-disclosure`, `lost-device-with-data`, `data-exfiltration-discovered`, `compromised-admin-credentials`, `wire-fraud-surge`, `ddos-response` |
| `CLOUD_REGION_OUTAGE` | `cloud-region-outage`, `hyperscaler-service-outage`, `dns-provider-outage`, `cdn-outage` |
| `VENDOR_FAILURE` | `material-vendor-outage`, `payments-scheme-outage`, `card-scheme-outage`, `kyc-vendor-outage`, `sms-otp-failure`, `email-provider-outage`, `saas-critical-outage`, `contact-centre-outage` |
| `BCP_ACTIVATION` | `bcp-activation`, `office-inaccessible`, `severe-weather`, `pandemic-absence`, `wan-loss`, `db-failover-gone-wrong`, `kubernetes-cluster-outage` |
| `DATA_INCIDENT` | `mass-data-breach`, `data-quality-ledger`, `backup-integrity-failure`, `sar-overload`, `cross-border-data-block`, `data-corruption` |
| `PEOPLE_DISRUPTION` | `key-person-loss`, `smf-emergency-leave`, `mass-absence-strike`, `outsource-centre-closure`, `solo-operator-unavailable` |
| `REGULATORY_NOTIFICATION` | `fca-material-incident`, `pra-material-incident`, `ico-72h-breach`, `boe-settlement-incident`, `dora-major-ict-incident` |
| `OTHER` | `market-dislocation`, `sanctions-hit-cascade`, `hostile-inspection`, `active-major-fraud`, `exec-succession-crisis` |

## Step kinds

Each `LibraryRunbookStep` has one of five `kind` values:

| Kind | What it does |
|---|---|
| `ACTION` | A thing to do. Owner-role completes it. |
| `DECISION` | Maps to a `DecisionType` (`INVOKE_IMT`, `ACTIVATE_BCP`, etc.). Completing this step auto-writes a `DecisionRecord` + `IncidentLogEntry`. |
| `NOTIFICATION` | Carries a `regulatorTrigger: { regulator, slaHours, trigger }`. Starting the step creates a `RegulatorNotification` row with the SLA clock; completing flips it to SENT. |
| `COMMS` | Carries a `commsTemplate: { stakeholder, subject, bodyTemplate }`. Starting creates a `CommunicationDraft` row; completing marks APPROVED. |
| `CHECKPOINT` | Coordination point — "everyone signed off" / "all systems green". |

`dependsOn: string[]` is a list of earlier step slugs that must reach COMPLETE (or SKIPPED) before this step becomes startable. Resolved to `blocksOrders[]` integer indices at clone time.

## Escalation chains

20 of the 50 library entries declare downstream chains via `escalates`. Examples:

```ts
// RANSOMWARE escalates to BCP + 3 regulator playbooks
escalates: [
  { targetSlug: "bcp-activation",          severityAtLeast: "HIGH", rationale: "Severe cyber outages usually need BCP-side workarounds in parallel." },
  { targetSlug: "fca-material-incident",   severityAtLeast: "HIGH", rationale: "Likely material under FCA rules — file the 4h notification." },
  { targetSlug: "ico-72h-breach",                                   rationale: "Any personal-data exposure triggers ICO 72h clock." },
  { targetSlug: "dora-major-ict-incident", severityAtLeast: "HIGH", rationale: "EU DORA major ICT-incident classification likely." },
]
```

Resolver: when the library entry is cloned into the org, `resolveLibraryEscalations(orgId)` walks every library entry, finds the matching org runbook (by title), and inserts `RunbookEscalation` rows in both directions. Idempotent — runs after every single clone *and* after the bulk seed.

## Owner-role conventions

Library entries reference role titles using compact abbreviations the IMT typically uses:

* `CRO`, `CEO`, `COO`, `CFO`, `CISO`, `CTO`, `CPO`
* `Head of Comms`, `Head of Payments`, `Head of People`, `Head of Procurement`
* `DPO`, `SMF`, `IMT Chair`, `Action Committee Chair`

These don't have to match an org's role catalogue exactly — the pre-flight panel surfaces `STEP_OWNERS_NOT_IN_CATALOGUE` for any mismatch so admins know to either rename the role or rename the step owner.

## Regulator-trigger conventions

NOTIFICATION steps carry the SLA clock:

```ts
regulatorTrigger: {
  regulator: "FCA" | "PRA" | "ICO" | "BANK_OF_ENGLAND" | "OTHER",
  slaHours: 4 | 24 | 72 | …,
  trigger: "POST_INVOCATION" | "POST_AWARENESS",
}
```

`POST_INVOCATION` starts the SLA clock from the IMT invocation timestamp; `POST_AWARENESS` starts from when the team became aware (the inject that triggered the step). The live workspace's regulator clocks consume this.

## See also

* [Runbooks subsystem](../architecture/runbooks.md) — the execution layer
* [Runbooks & drills (user guide)](../user-guide/runbooks.md) — how admins use the library
