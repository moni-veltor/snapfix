"use client";

import { useEffect, useState } from "react";

type Step = {
  label: string;
  detail: string;
  tone: "neutral" | "rose" | "amber" | "emerald" | "indigo";
};

const SCRIPT: Step[] = [
  { label: "D-Day 09:32", detail: "Tier 1 system down (Thought Machine, P1)", tone: "rose" },
  { label: "D-Day 09:34", detail: "🚨 IMT invoked by CRO — High severity classified", tone: "rose" },
  { label: "D-Day 09:34", detail: "FCA + PRA notification clocks started (4h SLA)", tone: "amber" },
  { label: "D-Day 09:36", detail: "Tech Recovery — sitrep filed (RED)", tone: "rose" },
  { label: "D-Day 09:40", detail: "Employee comms sent — cascade unlocked", tone: "indigo" },
  { label: "D-Day 09:45", detail: "Customer comms drafted by COO, approved by CEO", tone: "emerald" },
  { label: "D-Day 09:52", detail: "First IMT meeting · next at D-Day 10:30", tone: "indigo" },
];

type Clock = string;

export default function AnimatedHero() {
  const [idx, setIdx] = useState(0);
  const [clock, setClock] = useState<Clock>("09:32");

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % SCRIPT.length);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setClock((c) => {
        const [h, m] = c.split(":").map(Number);
        const total = h * 60 + m + 1;
        const nh = Math.floor(total / 60) % 24;
        const nm = total % 60;
        return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
      });
    }, 600);
    return () => clearInterval(t);
  }, []);

  // Visible window: current + 2 previous
  const visible = [
    SCRIPT[(idx - 2 + SCRIPT.length) % SCRIPT.length],
    SCRIPT[(idx - 1 + SCRIPT.length) % SCRIPT.length],
    SCRIPT[idx],
  ];

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.30) 0%, transparent 70%)",
        }}
      />
      <div className="relative rounded-2xl border border-white/[0.08] bg-[color:var(--night-surface-elev)] shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 font-mono text-xs text-slate-500">
            snapfix.app/exercises/.../live
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            live
          </span>
        </div>

        <div className="p-5">
          {/* Top stripe — incident state */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rose-300/30 bg-rose-500/[0.08] p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
                <span className="rounded-full bg-rose-600 px-1.5 py-0.5 font-semibold text-white">
                  IMT INVOKED
                </span>
                <span className="font-mono text-slate-400">INC-2026-05-13-A</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                Core banking outage — ransomware suspected
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Pill label="Overall HIGH" tone="rose" />
                <Pill label="Fin HIGH" tone="rose" />
                <Pill label="Cust HIGH" tone="rose" />
                <Pill label="Sys HIGH" tone="rose" />
                <Pill label="Cyber → High" tone="indigo" />
              </div>
            </div>
            <div className="rounded-md bg-slate-900 px-3 py-2 font-mono text-base text-white">
              D-Day {clock}
            </div>
          </div>

          {/* Feed window */}
          <div className="mt-4 space-y-2">
            {visible.map((s, i) => (
              <FeedRow key={`${s.label}-${idx}-${i}`} step={s} fresh={i === 2} />
            ))}
          </div>

          {/* Bottom: regulator clocks */}
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-amber-300/30 bg-amber-500/[0.06] p-3 text-xs">
            <ClockBox label="FCA" remaining="3h 26m" />
            <ClockBox label="PRA" remaining="3h 26m" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: "rose" | "indigo" }) {
  const cls =
    tone === "rose"
      ? "bg-rose-600 text-white"
      : "bg-indigo-500/30 text-indigo-100 ring-1 ring-inset ring-indigo-400/40";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>{label}</span>
  );
}

function FeedRow({ step, fresh }: { step: Step; fresh: boolean }) {
  const cls = TONE[step.tone];
  return (
    <div
      className={`rounded-md border p-2.5 text-[13px] transition-all duration-500 ${cls} ${
        fresh ? "animate-[fadeUp_0.4s_ease-out]" : "opacity-80"
      }`}
      style={{ animationDelay: fresh ? "0s" : undefined }}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-slate-500">{step.label}</span>
        <span className="text-slate-200">{step.detail}</span>
      </div>
    </div>
  );
}

const TONE: Record<Step["tone"], string> = {
  neutral: "border-white/[0.08] bg-white/[0.03]",
  rose: "border-rose-400/30 bg-rose-500/[0.08]",
  amber: "border-amber-400/30 bg-amber-500/[0.08]",
  emerald: "border-emerald-400/30 bg-emerald-500/[0.08]",
  indigo: "border-indigo-400/30 bg-indigo-500/[0.08]",
};

function ClockBox({ label, remaining }: { label: string; remaining: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-white/[0.04] p-2">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">{label} notify</div>
        <div className="font-mono text-sm text-amber-200">{remaining}</div>
      </div>
      <span className="rounded-full bg-amber-500/30 px-1.5 py-0.5 text-[10px] text-amber-100">
        SLA 4h
      </span>
    </div>
  );
}
