type Segment = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  segments: Segment[];
  total?: number;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  className?: string;
};

const FALLBACK_COLORS = [
  "var(--accent)",
  "#06b6d4",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#64748b",
];

/**
 * Horizontal stacked bar — segment composition (severity mix, vendor tiers,
 * harm types). Renders inline segments with optional legend below. Pure SVG.
 */
export default function Bar({
  segments,
  total,
  height = 14,
  showLegend = true,
  showLabels = false,
  className = "",
}: Props) {
  const sum = total ?? segments.reduce((acc, s) => acc + s.value, 0);
  if (sum === 0) {
    return (
      <div
        className={`rounded-full bg-surface-2 ${className}`}
        style={{ height }}
        aria-label="no data"
      />
    );
  }

  return (
    <div className={className}>
      <div
        className="relative flex overflow-hidden rounded-full bg-surface-2"
        style={{ height }}
        role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}
      >
        {segments.map((s, i) => {
          const pct = (s.value / sum) * 100;
          return (
            <div
              key={s.label}
              title={`${s.label}: ${s.value}`}
              style={{
                width: `${pct}%`,
                background: s.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
              }}
              className="relative flex items-center justify-center text-[9px] font-semibold text-white"
            >
              {showLabels && pct > 8 && (
                <span className="px-1">{s.value}</span>
              )}
            </div>
          );
        })}
      </div>
      {showLegend && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          {segments.map((s, i) => (
            <li key={s.label} className="flex items-center gap-1.5 text-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: s.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                }}
              />
              <span className="text-ink">{s.label}</span>
              <span className="text-soft">{s.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
