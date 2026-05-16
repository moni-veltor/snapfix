# Organizations & users

The tenancy and identity layer.

## Models

* **`Organization`** — a tenant. `name`, `slug`, `tier` (`TIER_1` / `TIER_2` / `TIER_3` — banking-style scale), `logoBlobUrl`, `accentHex`. Every org-scoped table FKs into this.
* **`User`** — a person. Created via NextAuth credentials sign-up.
* **`Account`, `Session`, `VerificationToken`** — NextAuth adapter tables. Sessions are JWT in this app so `Session` rows are not the active-session source of truth; they exist because the Prisma adapter requires them.
* **`Invitation`** — pending member invitations sent by admins.
* **`OrganizationRole`** — links a `User` to an `Organization` with a role.

## Membership shape (today)

Each `User` has **one current org** scope. The JWT carries `orgId` and `orgRole`. A user can in principle exist across multiple orgs but the runtime always treats them as in one at a time.

This is the single-tenant simplification. The org switcher UI is shipped but the schema work that lets it actually switch (`Membership` join table, `User.activeOrgId`) is on the [Roadmap](../roadmap.md).

## Roles

| Role | Capabilities |
|---|---|
| `OWNER` | Full control. Cannot be removed by other admins. |
| `ADMIN` | Can manage registers (IBS, vendor, tech), scenarios, exercises, members. Cannot delete the org. |
| `MEMBER` | Read-only on most surfaces. Author own scenarios (planned). |
| `PARTICIPANT` | Live exercise participation only. |

The two helpers in `src/lib/auth.ts`:

```ts
const me = await requireOrgUser();                       // any role
const me = await requireOrgRole("OWNER", "ADMIN");       // admins
```

## Invitation flow

1. Admin enters an email at `/org`
2. `InvitationAction` creates an `Invitation` row + emails the user via Resend
3. Recipient hits a tokenised URL, signs up / signs in
4. On accept, `OrganizationRole` is created and the `Invitation` marked `ACCEPTED`

Invitations expire 14 days after creation (enforced at accept-time).

## Per-org branding

Two fields on `Organization` drive the look:

* **`logoBlobUrl`** — uploaded via Vercel Blob, rendered in the sidebar in place of the SnapFix Hoot logo when set
* **`accentHex`** — replaces the indigo brand accent across the app

The accent is applied by `accentVars(hex)` in `src/app/(app)/layout.tsx`, which converts a hex into inline CSS variables (`--accent`, `--accent-soft`). Components reading those variables (focus rings, active tab markers, chart strokes) automatically retint.

## Common queries

```ts
// "Am I an admin in this org?"
const me = await requireOrgUser();
const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

// "Get the org row for this user"
const org = await prisma.organization.findUnique({
  where: { id: me.orgId },
  select: { name: true, logoBlobUrl: true, accentHex: true, tier: true },
});
```
