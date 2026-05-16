# Primitives

The named components every feature page composes from. Live under [`src/components/ui/`](https://github.com/moni-veltor/snapfix/tree/main/src/components/ui).

## `PageHero`

The page identity strip. Top of every major destination.

```tsx
import PageHero from "@/components/ui/PageHero";
import { Boxes } from "lucide-react";

<PageHero
  eyebrow="Dependencies"
  icon={Boxes}
  title="Critical third parties"
  pitch="Vendors that support your IBSs. Link each…"
  actions={
    <div className="flex items-center gap-2">
      <Link href="/vendors/library">Browse library</Link>
      <VendorAddButton />
    </div>
  }
/>
```

Props:

| Prop | Type | Notes |
|---|---|---|
| `eyebrow` | `string` (optional) | Small UPPERCASE label above the title. |
| `icon` | `LucideIcon` (optional) | Renders next to the eyebrow, accent-tinted. |
| `title` | `ReactNode` | Required. The H1. |
| `pitch` | `ReactNode` (optional) | The explanatory sentence under the title. |
| `actions` | `ReactNode` (optional) | Top-right slot for CTAs. |
| `className` | `string` (optional) | Extra classes on the outer header. |

What it does behind the scenes: rounded-xl, border-line, bg-surface-1, plus a soft brand-gradient corner decoration. The `actions` slot is the canonical home for hero buttons.

## `Modal`

Dialog primitive. Used everywhere a modal opens: Add IBS, Add Vendor, Add System, Invite teammate, Bulk import, profile edit, scenario wizard, exercise wizard.

```tsx
import Modal from "@/components/ui/Modal";

const [open, setOpen] = useState(false);

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Add a vendor"
  subtitle="Five-step wizard — basics, DORA, contract, assurance, exit plan."
  size="lg"
>
  <VendorAddWizard onDone={() => setOpen(false)} />
</Modal>
```

Props:

| Prop | Type | Notes |
|---|---|---|
| `open` | `boolean` | Required. Controlled. |
| `onClose` | `() => void` | Required. Backdrop-click + ESC + X-button all call this. |
| `title` | `ReactNode` | Required. H2 in the header. |
| `subtitle` | `ReactNode` (optional) | One-line context. |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | Max-width: `max-w-sm` → `max-w-4xl`. Default `md`. |
| `children` | `ReactNode` | Body. Scrolls if taller than `70vh`. |
| `footer` | `ReactNode` (optional) | Sticky footer slot (rarely used; most wizards have their own internal footer). |

Behaviour: backdrop is `bg-black/50 backdrop-blur-sm`. ESC closes. Clicking outside the dialog closes. Body has `max-h-[70vh] overflow-y-auto`.

## `SubmitButton`

Form-status-aware submit button. Replaces raw `<button type="submit">` everywhere.

```tsx
import SubmitButton from "@/components/ui/SubmitButton";

<form action={myAction}>
  ...
  <SubmitButton tone="ok" size="md">Save changes</SubmitButton>
</form>
```

| Prop | Default | Variants |
|---|---|---|
| `tone` | `"primary"` | `primary` (slate-900/indigo-500) · `ok` (emerald) · `danger` (rose) · `outline` (transparent + line border) |
| `size` | `"md"` | `sm` (smaller, used in tight rows) · `md` (default) |
| `disabled` | `false` | Also auto-disables while `useFormStatus().pending` is true |

Shows a spinner during the action. Disables itself to prevent double-submits. Use this instead of raw `<button>` whenever the form has a server action.

## `withToast`

Wraps a server action with Sonner success/error toasts. Handles Next.js redirect signals correctly (they're not errors).

```tsx
import { withToast } from "@/lib/toast-action";

const action = withToast(upsertVendorAction, {
  loading: "Saving…",     // optional — shown while pending
  success: "Vendor saved",
  description: "Open it in the register to link IBSs.",
  error: "Couldn't save vendor",  // optional — defaults to a generic message
});

<form action={action}>...</form>
```

Each option can also be a function `(fd: FormData) => string` for dynamic messages based on form data.

The wrapper:
1. Fires a loading toast if `loading` is set
2. Awaits the action
3. On success → success toast + description
4. On redirect throw (`NEXT_REDIRECT`) → fires success and re-throws (framework handles navigation)
5. On any other throw → error toast + re-throws so dev tools / React still see it

## `ToastForm`

Higher-level wrapper that bakes `withToast` into the form element itself.

```tsx
import ToastForm from "@/components/ui/ToastForm";
import SubmitButton from "@/components/ui/SubmitButton";

<ToastForm
  action={applyIndustryPresetAction}
  toast={{
    loading: `Applying ${preset.label}…`,
    success: `${preset.label} preset applied`,
    description: `${roles} roles · ${ibs} IBSs · ${vendors} vendors`,
    error: "Couldn't apply this preset",
  }}
>
  <input type="hidden" name="presetId" value={preset.id} />
  <SubmitButton size="md" className="w-full">
    Apply {preset.label}
  </SubmitButton>
</ToastForm>
```

Use `ToastForm` when the form is short and dedicated to a single submit. Use `withToast()` directly when you need more control (e.g. wizard with internal step state).

## `Pill`

A tone-coded status badge. Used wherever you need an inline status indicator.

```tsx
import { Pill } from "@/components/ui/Pill";

<Pill kind="ok">APPROVED</Pill>
<Pill kind="critical">CRITICAL</Pill>
<Pill kind="info">DRAFT</Pill>
```

Tone variants map to the [semantic state tones](palette.md#semantic-state-tones).

## `Skeleton`

Loading placeholder. Inherits surface tokens so it works in both modes.

```tsx
import Skeleton from "@/components/ui/Skeleton";

{loading ? <Skeleton className="h-12 w-full" /> : <RealContent />}
```

## `FeaturedCard`

The hero/banner card used on the dashboard headline. Border-coloured per tone with optional brand glow.

```tsx
<FeaturedCard className="border-rose-300" glow>
  ...
</FeaturedCard>
```

## `Tooltip`

Simple title-attribute alternative for richer help text. Used sparingly — most interactive elements just use `title=""` for native browser tooltips. Reserve this for surfaces that need styled tooltips.

## Layout primitives

* **`<Section title=... subtitle=...>`** — section wrapper with consistent heading hierarchy. Used inside analytics + evidence-pack pages.
* **`<Card>`** — generic bordered surface card. Lighter weight than `PageHero`.
* **`<Input>`** — pre-styled input element. Used when not inside a `<label>` block.

## Icons

[`lucide-react`](https://lucide.dev). Always passed via `size` prop (no className font-size).

| Common usage | Size |
|---|---|
| Inline next to label | `size={11}` or `size={12}` |
| Tab / chip with text | `size={13}` |
| Hero icon | `size={14}` or `size={16}` |
| Empty-state illustration | `size={28}` or `size={32}` |
| Mascot (Hoot) | `size={48}` and above |

`strokeWidth` defaults to 2. Use `strokeWidth={2.4}` on primary CTAs for a slightly bolder feel.
