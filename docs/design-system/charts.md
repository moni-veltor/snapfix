# Charts & stats

Lightweight chart primitives — SVG-based, no external dependency. Live under [`src/components/ui/charts/`](https://github.com/moni-veltor/snapfix/tree/main/src/components/ui/charts).

## `ProgressRing`

Circular progress indicator. Used for the dashboard pulse score, tech-recovery posture score, achievements XP.

```tsx
import { ProgressRing } from "@/components/ui/charts";

<ProgressRing
  value={78}
  label="78"
  sublabel="Posture score"
  size={140}
  thickness={12}
/>
```

Props:

| Prop | Type | Notes |
|---|---|---|
| `value` | `number` (0–100) | Required. |
| `label` | `string` | Big number inside the ring. |
| `sublabel` | `string` (optional) | Small text under the big number. |
| `size` | `number` | Diameter in pixels. Default 96. |
| `thickness` | `number` | Stroke width. Default 8. |

Colour: stroke is `var(--accent)`, so it respects per-org accent overrides automatically. The "track" is `border-line`.

## `Sparkline`

Tiny inline line chart. Used on the dashboard for weekly exercise cadence and on individual register cards for trend.

```tsx
import { Sparkline } from "@/components/ui/charts";

<Sparkline values={[0, 1, 2, 1, 4, 3, 5]} height={32} />
```

Props:

| Prop | Type | Notes |
|---|---|---|
| `values` | `number[]` | The data series. |
| `height` | `number` (optional) | Pixels. Default 24. |

Stroke is `var(--accent)`. No axes, no labels — by design.

## `MiniHeatmap`

A 7×N grid of cells coloured by value. Used on the Coverage Analytics page for the IBS × risk-dimension matrix.

```tsx
import { MiniHeatmap } from "@/components/ui/charts";

<MiniHeatmap
  rows={["IBS_01 Mobile banking", "IBS_02 Card auth"]}
  cells={[
    [0, 1, 2, 0, 1, 1],
    [1, 1, 1, 2, 0, 0],
  ]}
/>
```

Cell colour ramps from `bg-surface-2` (zero) through `bg-accent-soft` to `bg-accent` (max).

## `Bar`

Segmented horizontal bar — the "tier mix" stat tile uses this.

```tsx
import { Bar } from "@/components/ui/charts";

<Bar
  segments={[
    { label: "Critical", value: 2, color: "#ef4444" },
    { label: "Essential", value: 4, color: "#f59e0b" },
    { label: "Important", value: 6, color: "#6366f1" },
  ]}
  height={10}
/>
```

The one place in the app where raw hex is acceptable on chrome — these are categorical colour codes, not chrome tokens.

## `StatTile` / `Stat`

Compact metric tile. Used above every register / board. Tone-coded.

```tsx
function Stat({
  label,
  value,
  icon,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: "ok" | "warn" | "critical" | "neutral";
  sub?: string;
}) {
  const cls =
    tone === "critical"
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
          : "border-line bg-surface-1";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-soft">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
      {sub && <div className="text-[10px] text-soft">{sub}</div>}
    </div>
  );
}
```

Re-used across action items, IBS register, departments, presets coverage, etc. Often inlined into each page rather than centralised — the shape is consistent.

Conventions:

| Tone | When |
|---|---|
| `neutral` | Plain count — no qualitative judgement |
| `ok` | "This is good" — closed items, fully attested, low overdue |
| `warn` | "Worth a look" — partial coverage, near a threshold |
| `critical` | "Act now" — overdue, breached, expired |

Always pair with a tiny icon (`size={12}`) on the eyebrow row — it doubles as a visual anchor when scanning a dashboard.

## Layout: stat row above board

```tsx
<section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <Stat label="Open" value={32} icon={<ListChecks size={12} />} />
  <Stat label="In progress" value={8} icon={<Clock size={12} />} />
  <Stat label="Overdue" value={5} tone="critical" icon={<Flame size={12} />} />
  <Stat label="Closed (7d)" value={12} tone="ok" icon={<CheckCircle2 size={12} />} />
</section>
```

2-column on mobile, 4-column on `sm` and up. Always exactly 4 tiles for a dashboard row (more becomes a wall; fewer feels empty).
