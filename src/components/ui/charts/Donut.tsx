type Props = {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
};

/**
 * Single-value donut. Shows progress toward a target — coverage, completion,
 * health score. Center renders a label + sublabel (e.g. "82%", "coverage").
 * Pure SVG, no JS.
 */
export default function Donut({
  value,
  max = 100,
  size = 96,
  thickness = 10,
  color = "var(--accent)",
  trackColor = "var(--surface-2)",
  label,
  sublabel,
  className = "",
}: Props) {
  const pct = Math.max(0, Math.min(1, value / max));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label && (
            <span className="text-base font-semibold leading-none text-ink">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="mt-0.5 text-[10px] uppercase tracking-wider text-soft">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
