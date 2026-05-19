"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const INDIGO = "#4f46e5";
const ROSE = "#dc2626";
const AMBER = "#d97706";
const EMERALD = "#10b981";

type TrendPoint = { label: string; value: number };

export function TrendLine({
  data,
  yLabel,
  yDomain,
  threshold,
}: {
  data: TrendPoint[];
  yLabel?: string;
  yDomain?: [number, number];
  threshold?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="label" fontSize={10} tick={{ fill: "currentColor" }} />
        <YAxis
          domain={yDomain ?? ["auto", "auto"]}
          fontSize={10}
          tick={{ fill: "currentColor" }}
          label={
            yLabel
              ? {
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 10,
                  fill: "currentColor",
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: 6 }}
          labelStyle={{ fontSize: 10 }}
        />
        {threshold !== undefined && (
          <Line
            type="monotone"
            dataKey={() => threshold}
            stroke={AMBER}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={INDIGO}
          strokeWidth={2}
          dot={{ r: 3, fill: INDIGO }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

type BarPoint = { label: string; value: number; tone?: "ok" | "warn" | "critical" | "neutral" };

export function ToneBars({ data, yLabel }: { data: BarPoint[]; yLabel?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="label" fontSize={10} tick={{ fill: "currentColor" }} />
        <YAxis
          fontSize={10}
          tick={{ fill: "currentColor" }}
          label={
            yLabel
              ? {
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 10,
                  fill: "currentColor",
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: 6 }}
          labelStyle={{ fontSize: 10 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={
                d.tone === "critical"
                  ? ROSE
                  : d.tone === "warn"
                    ? AMBER
                    : d.tone === "ok"
                      ? EMERALD
                      : INDIGO
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
