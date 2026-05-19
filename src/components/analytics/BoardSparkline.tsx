"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

type Props = {
  values: number[];
  tone?: "ok" | "warn" | "critical" | "neutral";
};

const TONE_FILL: Record<NonNullable<Props["tone"]>, string> = {
  ok: "#10b981",
  warn: "#d97706",
  critical: "#dc2626",
  neutral: "#4f46e5",
};

/**
 * Minimal sparkline used as the background graphic on each Board KPI tile.
 * Recharts AreaChart with no axes / no tooltip — just shape signal.
 */
export default function BoardSparkline({ values, tone = "neutral" }: Props) {
  const data = values.map((v, i) => ({ i, v }));
  const stroke = TONE_FILL[tone];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.6} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={stroke}
          strokeWidth={1.5}
          fill={`url(#spark-${tone})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
