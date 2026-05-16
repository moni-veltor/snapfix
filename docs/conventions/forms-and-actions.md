# Forms, actions & toasts

How to build a form that submits to a server action with the right UX. Project-specific primitives below.

## The four primitives

| Primitive | Purpose | Lives at |
|---|---|---|
| `withToast()` | Wrap a server action with success / error / redirect handling | `src/lib/toast-action.ts` |
| `<Modal>` | Dialog primitive with backdrop, ESC handler, X button | `src/components/ui/Modal.tsx` |
| `<SubmitButton>` | Button with pending state via `useFormStatus()` | `src/components/ui/SubmitButton.tsx` |
| `<ToastForm>` | Higher-level form wrapper that bakes in `withToast` | `src/components/ui/ToastForm.tsx` |

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

## Pattern C: modal + wizard

For multi-step forms triggered from a hero action button. Used for vendors, tech systems, IBSs:

```tsx
"use client";

const [open, setOpen] = useState(false);

return (
  <>
    <button onClick={() => setOpen(true)}>Add vendor</button>
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Add a vendor"
      subtitle="Five-step wizard — basics, DORA, contract, assurance, exit plan."
      size="lg"
    >
      <VendorAddWizard onDone={() => setOpen(false)} />
    </Modal>
  </>
);
```

The wizard internally renders all steps in the DOM (visually hidden for inactive steps) so a single `<form>` submission carries every value. Step navigation buttons are `type="button"`; only the final Save is `type="submit"`. See `VendorAddWizard.tsx` for the canonical implementation.

## Modal sizes

```ts
type ModalSize = "sm" | "md" | "lg" | "xl";
// max-w-sm | max-w-md | max-w-2xl | max-w-4xl
```

Pick `lg` for most wizards, `xl` for the tabbed IBS form (it's wide), `md` for confirmations, `sm` for tiny callouts.

## SubmitButton

```tsx
import SubmitButton from "@/components/ui/SubmitButton";

<form action={...}>
  ...
  <SubmitButton variant="primary">Save</SubmitButton>
</form>
```

Shows a spinner during the action via `useFormStatus()`. Disables itself to prevent double-submits. Variants: `primary`, `secondary`, `danger`.

## Where the add-button + modal lives in each register

Mirrors the IBS pattern across vendors and tech-recovery:

* `/ibs` — `IBSAddButton` in the hero, opens `Modal[xl]` containing tabbed `IBSForm`
* `/vendors` — `VendorAddButton` in the hero, opens `Modal[lg]` containing 5-step `VendorAddWizard`
* `/tech-recovery` — `SystemAddButton` in the hero, opens `Modal[lg]` containing 4-step `SystemAddWizard`

The button-in-the-hero placement is one of the durable UX gates — see [Semantic tokens](semantic-tokens.md) for the others.

## Closing modals on submit

Wizards take an `onDone: () => void` prop. The form action:

```tsx
<form
  action={async (fd) => {
    onDone();           // Close modal first
    await action(fd);   // Then run the action (which may redirect)
  }}
>
```

`onDone()` is called *before* the action so the modal closes immediately. If the action redirects, the page navigates and the modal stays closed. If the action stays on the same page, the modal is already closed by the time `revalidatePath` fires.

## See also

* [Server actions](../architecture/server-actions.md)
* [Audit trail](audit-trail.md)
