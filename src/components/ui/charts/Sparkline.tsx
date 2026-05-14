type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  ariaLabel?: string;
  className?: string;
};

/**
 * Tiny SVG line chart for inline trends — last 30 days of incidents, drill
 * scores over time, etc. Pure SVG, no JS, server-component safe. Pass any
 * `color` (CSS var or hex) so callers can tint per zone.
 */
export default function Sparkline({
  values,
  width = 96,
  height = 28,
  color = "currentColor",
  fill = true,
  ariaLabel,
  className = "",
}: Props) {
  if (values.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        aria-label={ariaLabel ?? "no data"}
        className={className}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.3}
        />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const fillPath = `${linePath} L${width.toFixed(1)},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label={ariaLabel ?? "trend"}
      className={className}
      style={{ color }}
    >
      {fill && (
        <path
          d={fillPath}
          fill={color}
          opacity={0.12}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
