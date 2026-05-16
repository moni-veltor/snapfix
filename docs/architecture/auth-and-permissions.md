# Auth & permissions

How sign-in, sessions and role gates work.

## Sign-in

NextAuth v4 with the **credentials provider**. The route handler lives at `src/app/api/auth/[...nextauth]/route.ts`. The `signInAction` server action in `src/app/actions/auth.ts` is what the sign-in form binds to.

Sessions are **JWT**, not database-backed. This avoids a DB hit per request.

## What's in the JWT

The session token carries:

* `user.id` — the User row id
* `user.name`, `user.email`
* `user.orgId` — the org the user is currently scoped to
* `user.orgRole` — `"OWNER"` | `"ADMIN"` | `"MEMBER"` | `"PARTICIPANT"`

Whenever org membership changes (role change, removal), the JWT will eventually go stale until the user signs out / back in. This is acceptable for a v1 internal-team product. See the [Roadmap](../roadmap.md) for the multi-org switcher work that addresses this properly.

## The two gate helpers

`src/lib/auth.ts` exports two helpers used at the top of every server page and action:

```ts
// Any authenticated org user — read-only paths
const me = await requireOrgUser();
// → { id, email, orgId, orgRole, ... }

// Admin-or-owner — mutating org-scoped state
const me = await requireOrgRole("OWNER", "ADMIN");

// Owner only — destructive ops
const me = await requireOrgRole("OWNER");
```

Both throw / redirect if the gate isn't met. They never return a falsy value — your downstream code can rely on `me.orgId` being defined.

## Role hierarchy

| Role | Can |
|---|---|
| `OWNER` | Everything in the org. Add/remove `ADMIN`s. Change settings. Delete the org. |
| `ADMIN` | Manage IBS register, vendor register, tech-recovery register, scenarios, exercises, action items. Invite members. Cannot delete the org. |
| `MEMBER` | Read-only on most surfaces. Author own scenarios? Pending. |
| `PARTICIPANT` | Live exercise participation only — claim a seat, capture decisions, see released events / injects. Cannot author scenarios or modify the register. |

The "+ New" Compose menu in the sidebar is gated on `canManageOrg`, which is `orgRole === "OWNER" || orgRole === "ADMIN"`.

## Gating pattern in a page

```tsx
// src/app/(app)/vendors/page.tsx
export default async function VendorsPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  // ... fetch data, render
  // ... pass `canManage` into child components for UI gating
}
```

## Gating pattern in an action

```ts
// src/app/actions/vendors.ts
export async function upsertVendorAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  // ... validate, mutate, audit, revalidate
}
```

The action gate is the *authoritative* one. A page can render a hidden form for a member; if the action doesn't gate, the member could still POST.

## Cross-cutting "is this mine" checks

Many actions also need to verify a row belongs to the user's org:

```ts
const existing = await prisma.vendor.findFirst({
  where: { id, orgId: me.orgId },
  select: { id: true },
});
if (!existing) return;
```

Use `findFirst({ where: { id, orgId } })` and check the result — never `findUnique({ where: { id } })` for org-scoped tables. The latter would let one org read another's row by id-guessing.

## Sign-out

```tsx
<form action={signOutAction}>
  <button type="submit">Sign out</button>
</form>
```

The sidebar's user panel does this exact thing.
