# Forms, actions & toasts

How to build a form that submits to a server action with the right UX. Project-specific primitives below.

## The primitives

| Primitive | Purpose | Lives at |
|---|---|---|
| `withToast()` | Wrap a server action with success / error / redirect handling | `src/lib/toast-action.ts` |
| `<Modal>` | Dialog primitive with backdrop, ESC handler, X button, focus trap | `src/components/ui/Modal.tsx` |
| `<Drawer>` | Right-edge slide-out panel; same a11y contract as Modal | `src/components/ui/Drawer.tsx` |
| `<SubmitButton>` | Button with pending state via `useFormStatus()` | `src/components/ui/SubmitButton.tsx` |
| `<ToastForm>` | Higher-level form wrapper that bakes in `withToast` | `src/components/ui/ToastForm.tsx` |
| `<StatusBadge>` | Tone-mapped pill with optional icon + a11y label | `src/components/ui/StatusBadge.tsx` |
| `<ListUrlControls>` | Shared search + filter + sort URL params for register pages | `src/components/ui/ListUrlControls.tsx` |
| `<Pagination>` | URL-driven `?page=` primitive used by every list | `src/components/ui/Pagination.tsx` |

## Pattern A: server-form binding (simplest)

When the form lives inside a server component and the action redirects on success, you don't need any wrapper:

```tsx
<form action={deleteVendorAction}>
  <input type="hidden" name="id" value={vendor.id} />
  <button type="submit">Delete</button>
</form>
```

## Pattern B: client form with toasts

When you want a success toast (the common case for non-redirect mutations):

```tsx
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
  <input name="name" required />
  <SubmitButton>Save</SubmitButton>
</form>
```

`withToast()` correctly handles Next.js `redirect()` and `notFound()` signals — they aren't real errors. It fires success and re-throws so the framework can navigate.

## Pattern C: drawer launcher (preferred for hero "add" actions)

A button in the page hero opens a right-edge drawer with the form. Used for vendors, tech systems, IBSs, runbooks, scenarios:

```tsx
"use client";

const [open, setOpen] = useState(false);

return (
  <>
    <button onClick={() => setOpen(true)}>Add vendor</button>
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title="Add a vendor"
      subtitle="Five-step wizard — basics, DORA, contract, assurance, exit plan."
      size="lg"
    >
      <VendorAddWizard onDone={() => setOpen(false)} />
    </Drawer>
  </>
);
```

Drawer over modal because:
* the page stays visible on the left (operators keep the list context)
* form scroll is contained to the drawer
* keyboard users can ESC out without losing list scroll position

The wizard internally renders all steps in the DOM (visually hidden for inactive steps) so a single `<form>` submission carries every value. Step navigation buttons are `type="button"`; only the final Save is `type="submit"`. See `VendorAddWizard.tsx` for the canonical implementation.

## Pattern D: tabbed detail page

Long detail surfaces split into tabs (vendor, IBS, runbook, exercise debrief, settings). Tabs are URL-deep-linkable via `?tab=<key>` and sticky in localStorage so a return visit lands on the last tab used.

URL precedence:
1. `?tab=<key>` from the URL
2. `localStorage.getItem("<surface>:tab")`
3. component default

`useSearchParams` re-syncs the active tab when the URL changes (e.g. when a next-action suggestion deep-links to another tab on the same page).

## Drawer / Modal sizes

```ts
type Size = "sm" | "md" | "lg" | "xl";
// max-w-sm | max-w-md | max-w-2xl | max-w-4xl
```

Pick `lg` for most wizards, `xl` for tabbed forms (they're wide), `md` for confirmations, `sm` for tiny callouts.

## SubmitButton

```tsx
import SubmitButton from "@/components/ui/SubmitButton";

<form action={...}>
  ...
  <SubmitButton variant="primary">Save</SubmitButton>
</form>
```

Shows a spinner during the action via `useFormStatus()`. Disables itself to prevent double-submits. Variants: `primary`, `secondary`, `danger`.

## StatusBadge

```tsx
import StatusBadge from "@/components/ui/StatusBadge";

<StatusBadge tone="warning" icon="alert">3 overdue</StatusBadge>
```

Tones: `ok | info | warning | critical | neutral`. The icon is optional but recommended — colour alone is not a conformant a11y signal. The component renders an `aria-label` if children are non-textual (e.g. just a count).

## ListUrlControls

URL-driven search + filter + sort for register pages. Reads + writes `?q=`, `?filter=`, `?sort=`, `?page=`. The server component reads the same params, so deep-links (e.g. "Action required" filter from a chip) survive page reload + history navigation.

```tsx
<ListUrlControls
  searchKey="q"
  filterKey="filter"
  filters={[
    { value: "", label: "All" },
    { value: "action-required", label: "Action required" },
    { value: "mtp", label: "MTP only" },
  ]}
/>
```

## A11y rules

* Every icon-only button needs `aria-label`.
* Every form input needs an associated `<label>` (use `htmlFor`, not placeholder-as-label).
* Every drawer / modal needs a title; the title element gets `id="drawer-title"` + the dialog gets `aria-labelledby`.
* Tabs use `role="tab"` / `role="tabpanel"` + `aria-selected`. Use the `<Tabs>` primitive — don't roll your own.
* Status colour is paired with icon or text — never colour alone. (See `StatusBadge`.)
* Focus rings: use `focus-visible:ring-2 focus-visible:ring-brand` — don't remove the ring.

## Where the add-button + drawer lives in each register

Mirrors the IBS pattern:

* `/ibs` — `IBSAddButton` in the hero, opens `Drawer[xl]` containing tabbed `IBSForm`
* `/vendors` — `VendorAddButton` in the hero, opens `Drawer[lg]` containing 5-step `VendorAddWizard`
* `/tech-recovery` — `SystemAddButton` in the hero, opens `Drawer[lg]` containing 4-step `SystemAddWizard`
* `/runbooks` — `RunbookAddButton` in the hero, opens `Drawer[lg]` with the create form + a "From library" tab

The button-in-the-hero placement is one of the durable UX gates — see [Semantic tokens](semantic-tokens.md) for the others.

## Closing drawers on submit

Wizards take an `onDone: () => void` prop. The form action:

```tsx
<form
  action={async (fd) => {
    onDone();           // Close drawer first
    await action(fd);   // Then run the action (which may redirect)
  }}
>
```

`onDone()` is called *before* the action so the drawer closes immediately. If the action redirects, the page navigates and the drawer stays closed. If the action stays on the same page, the drawer is already closed by the time `revalidatePath` fires.

## See also

* [Server actions](../architecture/server-actions.md)
* [Semantic tokens](semantic-tokens.md) — the colour + spacing token system
* [Audit trail](audit-trail.md)
