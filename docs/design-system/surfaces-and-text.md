# Surfaces & text

The four-surface depth model and three-level text hierarchy. These are the tokens you'll reach for 90% of the time.

## Surfaces (four levels)

| Token | Light | Dark | Used for |
|---|---|---|---|
| `bg-surface-0` | `#f8fafc` slate-50 | `#07071a` warm near-black | Page background |
| `bg-surface-1` | `#ffffff` white | `#11122a` indigo-tinted dark | Cards, panels, the standard "thing on a page" surface |
| `bg-surface-2` | `#f1f5f9` slate-100 | `#181a36` nested dark | Hovered state, inset / pressed state, secondary panel |
| `bg-surface-elev` | `#ffffff` white | `#1c1e40` elevated dark | Modals, popovers, the elevated layer |

Pattern in practice:

```tsx
// Page background = surface-0 (set by the layout)
<div className="space-y-6 bg-surface-0">
  {/* A card sits on surface-1, lifts on hover to surface-2 */}
  <article className="rounded-xl border border-line bg-surface-1 hover:bg-surface-2">
    {/* A nested input or inset detail sits on surface-0 */}
    <input className="bg-surface-0" />
  </article>

  {/* A modal floats above everything on surface-elev */}
  <Modal>...</Modal>
</div>
```

Light mode and dark mode swap the values; you only ever write the token.

## Text (three levels)

| Token | Light | Dark | Used for |
|---|---|---|---|
| `text-ink` | `#0f172a` slate-900 | `#e2e8f0` slate-200 | Titles, body text, primary content |
| `text-muted` | `#475569` slate-600 | `#a5b1c8` softer slate | Metadata, secondary text, labels under inputs |
| `text-soft` | `#94a3b8` slate-400 | `#6b7691` faintest slate | Hint text, eyebrow labels, "—" placeholders |

Hierarchy in practice:

```tsx
<header>
  <p className="text-[10px] uppercase tracking-wider text-soft">Eyebrow</p>
  <h1 className="text-2xl font-semibold text-ink">Title</h1>
  <p className="text-sm text-muted">Pitch text — the explanatory sentence under a title.</p>
</header>
```

## Borders

| Token | Light | Dark | Used for |
|---|---|---|---|
| `border-line` | `#e2e8f0` slate-200 | `rgba(255,255,255,0.08)` | Default card/input borders |
| `border-line-strong` | `#cbd5e1` slate-300 | `rgba(255,255,255,0.16)` | Stronger inputs, hovered cards, focus-context borders |

Hover treatment for clickable cards (canonical pattern):

```tsx
<article className="rounded-xl border border-line bg-surface-1 transition-all
  hover:-translate-y-px hover:border-line-strong hover:bg-surface-2
  hover:shadow-[var(--shadow-card-md)]">
```

Three things happen on hover, none of them showy:

1. The card lifts 1px (`-translate-y-px`)
2. Border firms up
3. Shadow steps up one level

This is the "interactive" signal across the whole app.

## Accent

The active-state colour, swappable per zone and per org.

| Token | Light | Dark |
|---|---|---|
| `accent` (raw var) | `#4f46e5` indigo-600 | `#818cf8` indigo-400 |
| `bg-accent-soft` | `#eef2ff` indigo-50 | `rgba(99,102,241,0.18)` |

Used for: active sidebar item, focus rings, active tab indicators, the "icon background" behind a PageHero icon.

Per-org override: see [Per-org theming](per-org-theming.md).

## What NOT to do

```tsx
// ❌ Raw scale colour for chrome
<p className="text-slate-700">...</p>
<div className="bg-white dark:bg-slate-900">...</div>

// ❌ Hex / inline style
<div style={{ background: "#1f2937" }}>...</div>

// ❌ Hand-rolling a dark-mode swap for something that has a token
<div className="bg-slate-100 dark:bg-slate-800">...</div>
```

```tsx
// ✅ Semantic tokens
<p className="text-ink">...</p>
<div className="bg-surface-1">...</div>
<div className="bg-surface-2">...</div>
```

The raw scale colours (rose, amber, emerald, cyan, indigo, etc.) are fine when used for **categorical** purposes — chip tones, sector tints, status pills — but never for chrome.
