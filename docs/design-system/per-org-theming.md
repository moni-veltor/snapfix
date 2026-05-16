# Per-org theming

Every `Organization` row carries an optional `accentHex`. When set, the layout injects two CSS-variable overrides that retint the brand accent across the entire app shell — without rebuilding components.

## What gets retinted

When `Organization.accentHex` is set, this overrides:

* `--accent` — the raw value
* `--accent-soft` — derived as the same hex at 12% opacity

These flow through to:

* Focus rings on inputs
* Active sidebar item
* Active tab indicators
* "Icon background" tint inside PageHero
* Active filter chip on library grids
* `ProgressRing` stroke
* `Sparkline` stroke
* `MiniHeatmap` cell ramp top end
* "Add … from library" button accents
* Brand pill backgrounds (`bg-accent-soft`)
* The default Compose menu trigger

## What it does NOT retint

Deliberately scoped — these stay on their canonical tones regardless of accent:

* Status chips (rose / amber / emerald / cyan) — they have specific semantic meaning
* The signature `--gradient-brand` — that's the SnapFix mark, not the customer's
* Sector tones — categorical, not chromatic-brand
* Tier tones in `TIER_TONE` lookups
* Tone-coded surfaces like `bg-rose-50 border-rose-200`

This is deliberate: the customer's brand colours the **chrome**, not the **signal**. A critical-tone chip should always look critical, even if the customer's brand is rose.

## How it's applied

In [`src/app/(app)/layout.tsx`](https://github.com/moni-veltor/snapfix/blob/main/src/app/(app)/layout.tsx):

```tsx
function accentVars(hex: string | null): React.CSSProperties {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return {};
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    ["--accent" as string]: hex,
    ["--accent-soft" as string]: `rgba(${r}, ${g}, ${b}, 0.12)`,
  } as React.CSSProperties;
}

// applied to the page root
<div className="flex min-h-screen bg-surface-0 text-ink"
     style={accentVars(org?.accentHex ?? null)}>
  ...
</div>
```

Hex is validated server-side (six-digit hex only). Invalid input means no override is applied; brand defaults stay.

## How admins set it

Settings → Organisation settings → Brand accent. Native HTML5 colour picker plus a 6-swatch preset row:

| Preset | Hex | Vibe |
|---|---|---|
| SnapFix indigo (default) | `#4f46e5` | Default brand |
| Sky | `#0ea5e9` | Cool, calm |
| Emerald | `#10b981` | Operations, resilience |
| Amber | `#f59e0b` | Energy, warmth |
| Rose | `#ef4444` | Risk-led, intentional bold |
| Violet | `#a855f7` | Governance, advisory |

The preset row is visual-only — clicking a swatch should set the colour-picker value (the inputs are wired to the same form, picker drives the value).

## Logo + branding

Beyond accent, organisations can:

* Upload a logo via `Organization.logoBlobUrl` (Vercel Blob).
* Set a `tier` (`TIER_1` / `TIER_2` / `TIER_3`).
* (Future) custom email-template headers.

The logo appears in the sidebar at the top-left, replacing the default Hoot mascot when set. Square images work best (8x8 to 64x64 px effective). Accepted formats: PNG, JPG, SVG, WebP, up to 1 MB.

## How customers see it

A customer setting `accentHex: "#10b981"` (emerald) gets:

* Emerald focus rings on every input
* Emerald active sidebar pill
* Emerald `ProgressRing` strokes
* Emerald `bg-accent-soft` tint (12% emerald) wherever the brand-soft background is used

But still:

* Rose for critical / live / overdue chips
* Indigo for the SnapFix wordmark on the marketing site
* The signature gradient unchanged on the dashboard headline banner

This separation is what makes the theming **safe** — the customer can pick any colour and the semantic chrome (critical, warn, ok) still reads correctly.

## How to test

* Set `Organization.accentHex` to e.g. `#f59e0b`.
* Reload the app.
* The sidebar's active item, every focus ring, the IBS posture ring, the active library filter chip should all turn amber.
* Status chips (overdue: rose, attested: emerald) should NOT have changed.
* The "+ Add IBS" hero button should still be slate-900 / indigo-500 (primary buttons are explicitly not accent-tinted).

If anything semantic-status-coded changes hue when the accent changes, that's a bug.

## Page-family zones (`.zone-*`)

A parallel-but-separate mechanism. Four CSS classes can be applied to a page container to swap the accent for that page only:

* `.zone-exercise` — amber
* `.zone-intel` — cyan
* `.zone-governance` — violet
* `.zone-control` — indigo (default)

Designed so future exercise / intel / governance "modes" can switch hue without re-themeing the whole app. Largely dormant today — used sparingly.

## Hierarchy

When all four are in play:

1. Customer's `accentHex` is the base.
2. `.zone-*` class on a page container overrides for that page.
3. Status chips and the signature gradient ignore both.

In practice, customers will set an accent; zones are rare; status colours are always canonical.
