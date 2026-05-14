import { useId } from "react";

type Props = {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  gradient?: boolean;
  color?: string;
  label?: string;
  sublabel?: string;
  className?: string;
};

/**
 * Hero-scale progress ring. Same shape as Donut but signature treatment —
 * brand-gradient stroke option, used for resilience score / posture score
 * at the top of dashboards. Bigger by default than Donut.
 */
export default function ProgressRing({
  value,
  max = 100,
  size = 160,
  thickness = 14,
  gradient = true,
  color = "var(--accent)",
  label,
  sublabel,
  className = "",
}: Props) {
  const pct = Math.max(0, Math.min(1, value / max));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const center = size / 2;
  const reactId = useId();
  const gradientId = `pr-${reactId.replace(/:/g, "")}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={thickness}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gradient ? `url(#${gradientId})` : color}
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
            <span className="text-3xl font-semibold leading-none text-ink">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
