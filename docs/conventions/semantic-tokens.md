# Semantic tokens

Tailwind v4 lets us define a semantic token layer on top of the colour palette. SnapFix uses it consistently — **never use raw colour utilities like `text-slate-700`** in app code.

## The tokens

Defined in `src/app/globals.css` under `@theme inline` + `@custom-variant dark`:

| Token | Purpose |
|---|---|
| `text-ink` | Primary text (titles, body) |
| `text-muted` | Secondary text |
| `text-soft` | Tertiary / labels / metadata |
| `bg-surface-0` | Base background |
| `bg-surface-1` | Card / panel surface |
| `bg-surface-2` | Inset / pressed surface |
| `bg-surface-elev` | Elevated surface (modals, popovers) |
| `bg-accent-soft` | Accent-tinted background for highlighted regions |
| `border-line` | Default borders |
| `border-line-strong` | Stronger borders (inputs, focused state) |

## CSS variables

Behind the tokens are CSS variables — `--ink`, `--muted`, `--soft`, `--surface-0..elev`, `--accent`, `--accent-soft`, `--line`. Tailwind reads them via `bg-[var(--surface-1)]`-style classes through the `@theme inline` directive.

The per-org accent theming in `src/app/(app)/layout.tsx` works by injecting `--accent` and `--accent-soft` overrides at the layout root from `Organization.accentHex`.

## Dark mode

Dark mode uses the `@custom-variant dark` Tailwind v4 feature. Every component reads `text-ink` (etc.) and gets the right colour in either mode automatically.

When you *must* differentiate, use the `dark:` modifier on a semantic token:

```tsx
<div className="bg-surface-1 dark:bg-slate-950">
```

But this is rare. Most things "just work" if you use the tokens.

## What not to do

```tsx
// ❌ Raw slate utility
<p className="text-slate-700">...</p>

// ❌ Hard-coded hex
<div style={{ background: "#1f2937" }}>...</div>

// ❌ Dark-mode duplication for things that have a token
<div className="bg-white dark:bg-slate-900">...</div>
```

```tsx
// ✅ Semantic token
<p className="text-ink">...</p>

// ✅ Surface token (handles both modes)
<div className="bg-surface-1">...</div>

// ✅ Dark-mode modifier only when semantic doesn't suffice
<div className="text-ink dark:text-slate-200">...</div>
```

## Tone scales (for chips, badges, status pills)

Categorical tones are *fine* to use raw — they're stable across mode shifts:

```tsx
// Tier chips, sector chips, etc.
"bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
"bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
"bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
```

These live in lookup objects like `SECTOR_TONE` and `CATEGORY_TONE`. Don't reach for them on text or chrome — only badges / chips.

## Why we bother

Semantic tokens are one of three durable UX gates established for the project:

1. Semantic tokens (no hard slate text)
2. Tabbed / panelled views preferred over long scroll
3. Interactive over informational

If a PR breaks #1, request a fix before merging.

## See also

* [Code style](code-style.md)
