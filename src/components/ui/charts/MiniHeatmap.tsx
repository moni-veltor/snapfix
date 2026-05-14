type Props = {
  cells: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  cellSize?: number;
  gap?: number;
  max?: number;
  ariaLabel?: string;
  className?: string;
};

const STOPS = [
  { t: 0, css: "var(--surface-2)" },
  { t: 0.25, css: "rgba(99, 102, 241, 0.18)" },
  { t: 0.5, css: "rgba(99, 102, 241, 0.40)" },
  { t: 0.75, css: "rgba(99, 102, 241, 0.65)" },
  { t: 1, css: "#4f46e5" },
];

function colorFor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = STOPS.length - 1; i >= 0; i--) {
    if (clamped >= STOPS[i].t) return STOPS[i].css;
  }
  return STOPS[0].css;
}

/**
 * Small heatmap for coverage matrices — IBS × control, vendor × tier,
 * scenario × role. Cells coloured by intensity (0 to `max`, or auto). Pure
 * CSS, no SVG, so it scales naturally.
 */
export default function MiniHeatmap({
  cells,
  rowLabels,
  colLabels,
  cellSize = 18,
  gap = 2,
  max,
  ariaLabel,
  className = "",
}: Props) {
  const flat = cells.flat();
  const trueMax = max ?? Math.max(...flat, 1);

  return (
    <div className={className} role="img" aria-label={ariaLabel ?? "heatmap"}>
      {colLabels && (
        <div
          className="flex"
          style={{
            paddingLeft: rowLabels ? 80 : 0,
            gap,
          }}
        >
          {colLabels.map((c) => (
            <div
              key={c}
              className="truncate text-center text-[9px] font-medium uppercase tracking-wider text-soft"
              style={{ width: cellSize }}
              title={c}
            >
              {c}
            </div>
          ))}
        </div>
      )}
      <div className="mt-1 space-y-[2px]" style={{ gap }}>
        {cells.map((row, r) => (
          <div key={r} className="flex items-center" style={{ gap }}>
            {rowLabels && (
              <div
                className="truncate pr-2 text-right text-[10px] text-muted"
                style={{ width: 80 }}
                title={rowLabels[r]}
              >
                {rowLabels[r]}
              </div>
            )}
            {row.map((v, c) => (
              <div
                key={c}
                title={`${rowLabels?.[r] ?? r} × ${colLabels?.[c] ?? c}: ${v}`}
                className="rounded-sm"
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: colorFor(v / trueMax),
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
