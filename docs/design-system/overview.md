# Design system overview

SnapFix's visual language is called **Trust Indigo** — a token-first, dark-mode-native system built on Tailwind v4. This section is the canonical reference for every colour, shadow, primitive, and pattern used in the app.

## Philosophy

Three durable rules everything else flows from:

1. **Semantic tokens, not raw colours.** Components never reach for `text-slate-700` or `bg-rose-600` for chrome. They use `text-ink`, `bg-surface-1`, `border-line`. The token swaps on `.dark`; the component code doesn't.
2. **One signature, used sparingly.** The indigo→cyan gradient is the platform's signature. Hero CTAs, the performance ring, success celebrations. Use it three times on a page and the signal is dead.
3. **Interactive over informational.** Three durable UX gates: semantic tokens, tabbed/panelled views over long scroll, interactive surfaces over read-only displays.

## The token layer

Source: [`src/app/globals.css`](https://github.com/moni-veltor/snapfix/blob/main/src/app/globals.css). All tokens live there.

Three layers stacked:

```
┌──────────────────────────────────────────────────────────┐
│  Tailwind utility       bg-surface-1, text-ink           │
│  ─ resolved via `@theme inline` ──────────────────────── │
│  CSS variable           --surface-1, --ink               │
│  ─ swapped by `.dark` and `.zone-*` ─────────────────── │
│  Raw value              #ffffff (light) / #11122a (dark) │
└──────────────────────────────────────────────────────────┘
```

The middle layer is where the dark-mode and zone-swap magic happens. You write `bg-surface-1` once; it works in light, dark, and any of the four zones without changes.

## Sub-pages

* [Palette](palette.md) — every brand colour with hex + role
* [Surfaces & text](surfaces-and-text.md) — surface-0..elev, ink/muted/soft, borders
* [Elevation & effects](elevation-and-effects.md) — shadows, gradients, animations
* [Primitives](primitives.md) — `Modal`, `PageHero`, `SubmitButton`, `ToastForm`, `withToast`
* [Patterns](patterns.md) — hero+actions, sticky filter bar, modal wizard, library grid
* [Charts](charts.md) — `ProgressRing`, `Sparkline`, `MiniHeatmap`, `Bar`, `StatTile`
* [Per-org theming](per-org-theming.md) — `Organization.accentHex` and how it applies

## What lives outside this doc set

* Sector tone palette — see [Sector taxonomy](../libraries/sector-taxonomy.md). Sectors are categorical labels, not chrome.
* Semantic-token convention rationale — see [Conventions → Semantic tokens](../conventions/semantic-tokens.md).
* Form / wizard implementation — see [Conventions → Forms, actions & toasts](../conventions/forms-and-actions.md). This design-system section documents *what* the system looks like; the conventions section documents *when* to use which pattern.
