# Palette

The complete colour reference. Hex values are the raw source-of-truth; you generally consume them via tokens (next page) rather than directly.

## Brand — Trust Indigo

The platform's identity colour. Indigo for trust + cyan for signal-and-action.

| Token | Hex | Where used |
|---|---|---|
| `--brand-primary` | `#4f46e5` (indigo-600) | Primary buttons, focus rings, the brand pill |
| `--brand-primary-hover` | `#4338ca` (indigo-700) | Hover state on primary buttons |
| `--brand-light` | `#818cf8` (indigo-400) | Accent on dark backgrounds — replaces `--accent` in dark mode |
| `--brand-deep` | `#1e1b4b` (indigo-950) | Marketing-site deep backgrounds |
| `--brand-accent` | `#06b6d4` (cyan-500) | Second hue in the signature gradient |

Brand gradients:

* **`--gradient-brand`** — `linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #06b6d4 100%)` — the signature treatment.
* **`--gradient-brand-soft`** — same hues at 12% / 10% opacity — used behind PageHero icons + softer hero backgrounds.
* **`--gradient-night`** — same hues at higher opacity on near-black — used on the marketing site.

The signature gradient is reserved for: hero CTAs, the performance ring, the active sidebar pill, success celebrations. **Three uses per page maximum.** Overuse kills the signal.

## Semantic state tones

Used on chips, pills, status badges, and tone-coded surfaces. Always paired with a `dark:` variant for proper dark-mode contrast.

| Tone | Light bg / text | Dark bg / text | Used for |
|---|---|---|---|
| **Critical** (rose) | `bg-rose-100 text-rose-800` | `dark:bg-rose-950/40 dark:text-rose-200` | LIVE incident, breached tolerance, overdue, error, failed DR test |
| **Warn** (amber) | `bg-amber-100 text-amber-800` | `dark:bg-amber-950/40 dark:text-amber-200` | Renewal in 30 days, partial coverage, attestation pending, near-miss |
| **OK** (emerald) | `bg-emerald-100 text-emerald-800` | `dark:bg-emerald-950/40 dark:text-emerald-200` | Attested, no incidents, closed, fully applied, all readiness checks pass |
| **Info** (cyan) | `bg-cyan-100 text-cyan-800` | `dark:bg-cyan-950/40 dark:text-cyan-200` | Renewal in 90 days, in-progress, neutral progression |
| **Accent** (indigo) | `bg-indigo-100 text-indigo-800` | `dark:bg-indigo-950/40 dark:text-indigo-200` | Default-active filter chip, brand-tinted UI |
| **Neutral** (slate) | `bg-surface-2 text-muted` | (same; tokens swap) | Inactive chip, secondary metadata |

## Raw scale colours used

When a chip or pill needs a categorical tone (not status), pick from these:

| Hue | Light | Dark | Used for |
|---|---|---|---|
| Rose | `bg-rose-100 text-rose-800` | `dark:bg-rose-950/40 dark:text-rose-200` | Critical, payments-fintech, DORA, incidents |
| Amber | `bg-amber-100 text-amber-800` | `dark:bg-amber-950/40 dark:text-amber-200` | Cards & ATM, telecoms (sector), warning state |
| Cyan | `bg-cyan-100 text-cyan-800` | `dark:bg-cyan-950/40 dark:text-cyan-200` | Open banking, logistics, in-progress, info |
| Emerald | `bg-emerald-100 text-emerald-800` | `dark:bg-emerald-950/40 dark:text-emerald-200` | Trading, reconciliations, healthcare, attested, OK |
| Indigo | `bg-indigo-100 text-indigo-800` | `dark:bg-indigo-950/40 dark:text-indigo-200` | Banking, customer access, brand default |
| Violet | `bg-violet-100 text-violet-800` | `dark:bg-violet-950/40 dark:text-violet-200` | Lending, treasury, insurance |
| Fuchsia | `bg-fuchsia-100 text-fuchsia-800` | `dark:bg-fuchsia-950/40 dark:text-fuchsia-200` | AML / sanctions, asset-wealth |
| Pink | `bg-pink-100 text-pink-800` | `dark:bg-pink-950/40 dark:text-pink-200` | Fraud, retail/ecommerce |
| Sky | `bg-sky-100 text-sky-800` | `dark:bg-sky-950/40 dark:text-sky-200` | Aviation/transport, water supply |
| Orange | `bg-orange-100 text-orange-800` | `dark:bg-orange-950/40 dark:text-orange-200` | Communications, energy/utilities |
| Lime | `bg-lime-100 text-lime-800` | `dark:bg-lime-950/40 dark:text-lime-200` | Customer & CRM, higher education |
| Teal | `bg-teal-100 text-teal-800` | `dark:bg-teal-950/40 dark:text-teal-200` | Documents & e-sign, technology/SaaS |
| Purple | `bg-purple-100 text-purple-800` | `dark:bg-purple-950/40 dark:text-purple-200` | Media & broadcasting |
| Stone | `bg-stone-200 text-stone-800` | `dark:bg-stone-800/60 dark:text-stone-200` | Manufacturing |
| Zinc | `bg-zinc-200 text-zinc-800` | `dark:bg-zinc-800/60 dark:text-zinc-200` | Legal / professional |
| Slate | `bg-slate-200 text-slate-800` | `dark:bg-slate-800/60 dark:text-slate-200` | Government |

These exist in `SECTOR_TONE`, `CATEGORY_TONE`, `TIER_TONE` lookup objects in [`src/lib/library/sectors.ts`](https://github.com/moni-veltor/snapfix/blob/main/src/lib/library/sectors.ts) and in each library grid component.

## Page-family zones

Four pre-defined "zones" swap `--accent` and `--accent-soft` without changing components. Apply by adding a `.zone-*` class to a page container.

| Zone | Light accent | Dark accent | Intended for |
|---|---|---|---|
| `.zone-control` (default) | `#4f46e5` indigo-600 | `#818cf8` indigo-400 | Default — dashboards, registers |
| `.zone-exercise` | `#f59e0b` amber-500 | `#fbbf24` amber-400 | Live exercise pages, war-room |
| `.zone-intel` | `#06b6d4` cyan-500 | `#22d3ee` cyan-400 | Analytics, threat intel |
| `.zone-governance` | `#8b5cf6` violet-500 | `#a78bfa` violet-400 | Settings, compliance, audit |

Used sparingly today; designed so that a future Exercise / Intel / Governance "mode" can switch the entire app's accent in one CSS class.

## Per-org accent override

Every `Organization` row has an optional `accentHex`. When set, the layout injects two CSS variable overrides onto the page root, replacing the indigo default with the customer's brand. See [Per-org theming](per-org-theming.md).

## Marketing site palette (night theme)

Used only on the public marketing pages (`(marketing)` route group), not in the authed app.

| Token | Hex |
|---|---|
| `--night-base` | `#06061b` |
| `--night-surface` | `#0f0f24` |
| `--night-surface-elev` | `#15152e` |
| `--night-line` | `#1f2042` |
| `--night-line-strong` | `#2c2d5a` |
| `--night-ink` | `#e2e8f0` |
| `--night-ink-muted` | `#94a3b8` |
| `--night-ink-soft` | `#64748b` |

Plus a marketing-only hero gradient `bg-night-hero` — three radial layers stacked on the night base.
