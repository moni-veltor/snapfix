# Seeded accounts

`npm run db:seed` provisions a demo organisation, the Simulation-2 scenario, and two users you can sign in as.

| Email | Password | Role |
|---|---|---|
| `facilitator@example.com` | `password123` | `OWNER` / facilitator |
| `participant@example.com` | `password123` | `PARTICIPANT` |

* The facilitator account is an `OWNER` on the seeded org, so it satisfies `requireOrgRole("OWNER", "ADMIN")` for every admin-gated action — settings, library actions, exercise scheduling, etc.
* The participant account is a regular member. Use it to verify a feature you've gated correctly (e.g. participants should not see the "+ New" Compose menu).

## What else seeding produces

* A demo organisation with name, slug, tier.
* The Simulation-2 scenario (an Afin Bank cyber + third-party scenario) including MSEL events, injects, IBSs and impact tolerances.
* Some initial team templates.

## Resetting state

Seeding is idempotent for the users (`upsert`-style) but additive for scenario data. If you want a clean slate during development, drop and re-push the schema against your dev Neon database:

```bash
# in Neon dashboard: reset / drop tables
npm run db:push
npm run db:seed
```

Do not do this against production data. If you need a wipeable dev DB, give it its own Neon project rather than sharing.
