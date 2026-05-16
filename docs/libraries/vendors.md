# Vendor library

114 real-world providers across 16 sectors. Lives in `src/lib/vendor-library.ts`.

## Shape of an entry

```ts
{
  slug: "thought-machine",
  name: "Thought Machine",
  serviceKind: "Cloud-native core banking (Vault)",
  category: "Core banking",
  sectors: ["banking"],
  description: "Smart-contract-based core banking ledger.",
  suggestedTier: "TIER_1",
  isDoraCritical: true,
  hyperscaler: "GCP",
  assuranceKind: "SOC2_TYPE_2",
  statusUrl: "https://status.thoughtmachine.io",
}
```

## Categories

25 vendor categories across two groups:

* **Financial services**: Core banking, Payments, Card issuing, Open banking, KYC / Identity, AML / Sanctions, Fraud, Reconciliations, Documents & e-sign, Cloud & infra, Communications, Customer & CRM, Treasury
* **Cross-sector**: Energy & utilities, Telecoms infra, Healthcare IT, Retail & ecommerce, Transport & travel, Logistics & shipping, Government IT, Education tech, Media & broadcast, Manufacturing & industrial, Cybersecurity, Productivity & HR

## Sectors

Same `Sector` type as the other libraries. Universal-sector vendors (CrowdStrike, Okta, Microsoft 365, Workday, ServiceNow, PagerDuty) tag all 16. Sector-specific vendors tag the obvious one or two.

`isDoraCritical: true` is set for the rails and platforms a UK financial-services firm is likely to declare DORA-critical (hyperscalers, payments rails, identity providers, cyber EDR).

## The clone action

`addLibraryVendorAction(slug)` in `src/app/actions/vendors.ts`:

1. `requireOrgRole("OWNER", "ADMIN")`
2. Look up `LibraryVendor` by slug
3. Dedupe by name within the org
4. Create the `Vendor` row with library values
5. Write `vendor.added-from-library` audit
6. `revalidatePath` + redirect to `/vendors`

## What we deliberately don't bake in

* **Contract dates** — they're customer-specific. The post-clone wizard / edit form is how admins fill these in.
* **Annual value** — same; customer-specific.
* **Exit plan** — same.
* **Specific assurance-report expiry** — we set the *kind* (`SOC2_TYPE_2` etc.) but never an `assuranceExpiryAt` because it changes monthly per customer.

## Quality bar

* Real vendors only. No invented names.
* Service-kind in one short noun phrase.
* Description in one or two sentences, factual, not marketing-speak.
* `statusUrl` only if the vendor publishes one.
* `suggestedTier` reflects how a typical UK bank / fintech would tier this vendor — admins override to match their actual contractual posture.

## Adding entries

1. Append a new object to `VENDOR_LIBRARY`
2. Pick a category from `VENDOR_CATEGORIES`
3. Tag with one or more `sectors`
4. Set `isDoraCritical` only if you're sure — over-tagging dilutes the signal

## See also

* [Vendors & tech systems](../domain-model/vendors-and-tech.md) — the runtime `Vendor` model
* [Forms, actions & toasts](../conventions/forms-and-actions.md) — the wizard + modal pattern
