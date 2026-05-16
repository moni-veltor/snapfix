# Elevation & effects

Shadows, gradients, blurs, and motion.

## Shadows (four levels)

Light mode uses crisp small shadows; dark mode uses softer-with-glow.

| Utility | Token | Where |
|---|---|---|
| `shadow-[var(--shadow-card)]` | `--shadow-sm` | Default card resting state |
| `shadow-[var(--shadow-card-md)]` | `--shadow-md` | Card on hover, primary button |
| `shadow-[var(--shadow-card-lg)]` | `--shadow-lg` | Modal, popover, sticky filter bar |
| `shadow-[var(--shadow-card-glow)]` | `--shadow-glow` | Brand glow — performance ring, hero CTA |

Light-mode definitions:

```css
--shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.03);
--shadow-md: 0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04);
--shadow-lg: 0 12px 24px -8px rgba(15, 23, 42, 0.14), 0 4px 8px -2px rgba(15, 23, 42, 0.06);
--shadow-glow: 0 0 0 1px rgba(99, 102, 241, 0.20), 0 8px 24px -6px rgba(99, 102, 241, 0.35);
```

Dark-mode swaps in indigo-tinted glows instead of slate fades.

## Hover lift

The canonical hover treatment is `hover:-translate-y-px` paired with one shadow step up:

```tsx
className="shadow-[var(--shadow-card)] transition-all
  hover:-translate-y-px hover:shadow-[var(--shadow-card-md)]"
```

1px is enough to register; anything more reads as glitchy.

## Gradients

Three gradients, used sparingly:

| Utility | Value | When |
|---|---|---|
| `bg-gradient-brand` | indigo-600 → indigo-500 → cyan-500 (135°) | Hero CTAs, the performance ring, active sidebar pill, achievements |
| `bg-gradient-brand-soft` | same hues at 12%/10% opacity | Behind PageHero icons, dashboard headline banner |
| `bg-night-hero` | three radial layers on near-black | Marketing-site hero only |
| `text-gradient-brand` | gradient as text colour via background-clip | Brand wordmark, signature stats |

**Three uses per page maximum.** Overuse kills the signal.

## Backdrop blur on sticky bars

Library filter bars, IBS attestation review tray, and modal backdrops all use a translucent surface plus backdrop-blur:

```tsx
className="sticky top-0 z-10 bg-surface-0/95 backdrop-blur
  supports-[backdrop-filter]:bg-surface-0/80"
```

The `supports-[backdrop-filter]` query downgrades gracefully on browsers without backdrop-filter (uses the higher-opacity background instead).

## Border radius

Tailwind defaults. The conventions:

| Class | When |
|---|---|
| `rounded-md` | Buttons, inputs, simple cards |
| `rounded-lg` | Modals, alerts, stat tiles, themed-coloured tone boxes |
| `rounded-xl` | Hero, large content cards, library cards, attestation panels |
| `rounded-full` | Pills, chips, status badges |

Never `rounded-sm` (too tight) or `rounded-2xl` and above (too soft, "marketing site" energy).

## Spacing rhythm

Vertical spacing within a page uses `space-y-*`:

| Class | When |
|---|---|
| `space-y-1.5` | Tight list of small cards / chip rows |
| `space-y-3` | List of medium cards, inputs in a form |
| `space-y-4` | Sections within a card, form fieldsets |
| `space-y-6` | Top-level page sections (PageHero → stats → grid) |
| `space-y-8` | Coarse breakup, e.g. evidence-pack sections |

The standard page wrapper is `<div className="space-y-6">`.

## Z-index ladder

| Layer | z-index | Examples |
|---|---|---|
| Default | (none) | All body content |
| Sticky bar | `z-10` | Library filter bar, exercise transition bar |
| Modal backdrop + dialog | `z-50` | `Modal` primitive — sits over everything app-level |
| Sidebar dropdowns | `z-50` | Compose menu, notification bell |
| Toast notifications | (Sonner-managed) | Above everything |

No element in app code should use a z-index higher than 50.

## Animations

Three named keyframe animations live in `globals.css`:

| Animation | When |
|---|---|
| `fadeUp` | Marketing micro-motion — content fading up 6px on mount |
| `shimmer` | Skeleton loading placeholders |
| `sparkle` | Closure celebration — fires when an incident closes with all 5 criteria met |
| `hum` | Breached / critical state pulse — calmer than the live-presence ping |

Tailwind's `animate-ping` is used for the LIVE incident dot — a sharp, attention-grabbing ping. The `hum` keyframe is its calmer cousin for "something is wrong but it's not new".
