# Server actions

Every mutating operation in SnapFix goes through a server action. There is no REST layer (apart from the NextAuth required handler).

## Shape of an action

```ts
// src/app/actions/vendors.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const Schema = z.object({ name: z.string().min(1) });

export async function upsertVendorAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const data = Schema.parse(Object.fromEntries(formData));

  const created = await prisma.vendor.create({
    data: { ...data, orgId: me.orgId },
  });

  await audit({
    orgId: me.orgId,
    actorId: me.id,
    action: "vendor.added-from-library", // or a relevant AuditAction
    targetType: "vendor",
    targetId: created.id,
    summary: `Created vendor ${created.name}`,
  });

  revalidatePath("/vendors");
  redirect("/vendors");
}
```

The five lines you must always include:

1. **`"use server";`** at the top of the file.
2. **`await requireOrgUser()` or `requireOrgRole(...)`** — every action.
3. **Zod-validate** the formData. Never trust raw values.
4. **`audit()`** the mutation if it changes org-scoped state.
5. **`revalidatePath()` or `redirect()`** — without one of these the UI shows stale data.

## Calling actions from forms

```tsx
// Server component — direct binding
<form action={upsertVendorAction}>
  <input name="name" required />
  <button type="submit">Save</button>
</form>
```

```tsx
// Client component — wrap with withToast for UX feedback
"use client";
import { withToast } from "@/lib/toast-action";
import { upsertVendorAction } from "@/app/actions/vendors";

<form
  action={withToast(upsertVendorAction, {
    success: "Vendor saved",
    description: "Open it in the register to link IBSs.",
    error: "Couldn't save vendor",
  })}
>
  ...
</form>
```

The `withToast()` helper handles Next.js redirect signals correctly — when the action redirects, it fires success and re-throws so the framework continues. See [Forms, actions & toasts](../conventions/forms-and-actions.md) for the full pattern.

## Action file organisation

One file per domain area:

```
src/app/actions/
  auth.ts              # signInAction, signOutAction
  scenarios.ts         # createScenarioAction, addLibraryScenarioAction, ...
  ibs.ts               # createIBSAction, updateIBSAction, addLibraryIBSAction, ...
  vendors.ts           # upsertVendorAction, addLibraryVendorAction, deleteVendorAction
  tech-recovery.ts     # upsertTechSystemAction, logDRTestAction, addLibrarySystemAction
  exercises.ts         # createExerciseAction, addParticipantAction, releaseEventAction, ...
  org.ts               # member-management, invitations
  settings.ts          # updateOrgSettingsAction, uploadOrgLogoAction, ...
  action-items.ts
  notifications.ts
```

Public-facing: every action is exported. The file's `"use server"` directive makes them all callable from the client without ceremony.

## Common pitfalls

* **Forgetting to await `requireOrgRole`.** Type system won't catch it. The function throws if the user isn't an admin — but only if you actually await. Always `const me = await requireOrgRole(...)`.
* **Trusting `formData.get("id")` directly.** Use the Zod schema. The action runs on the server but the form is shipped by the client; an attacker can post anything.
* **No `revalidatePath`.** UI shows stale data after the redirect; you'll think the action didn't run.
* **Importing client-only modules.** Server-action files cannot import anything that requires a browser environment.

See also: [Audit trail](../conventions/audit-trail.md).
