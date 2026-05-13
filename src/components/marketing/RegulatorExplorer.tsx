"use client";

import { useState } from "react";
import { REGULATORS } from "@/lib/regulators-data";

export default function RegulatorExplorer() {
  const [activeSlug, setActiveSlug] = useState(REGULATORS[0].slug);
  const active = REGULATORS.find((r) => r.slug === activeSlug) ?? REGULATORS[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="space-y-1">
        {REGULATORS.map((r) => {
          const selected = r.slug === activeSlug;
          return (
            <button
              key={r.slug}
              type="button"
              onClick={() => setActiveSlug(r.slug)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                selected
                  ? "bg-indigo-500/15 text-indigo-200"
                  : "text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              <span className="font-semibold">{r.name}</span>
              <span className="block text-[11px] text-slate-400">{r.fullName}</span>
            </button>
          );
        })}
      </aside>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-white">{active.fullName}</h2>
            <p className="mt-1 text-xs text-slate-400">{active.scope}</p>
          </div>
          <a
            href={active.url}
            target="_blank"
            rel="noopener"
            className="text-xs text-indigo-300 hover:text-indigo-200"
          >
            Open source ↗
          </a>
        </div>
        <p className="mt-3 rounded-md bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100">
          <strong>Headline framework:</strong> {active.framework}
        </p>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            What they expect
          </h3>
          <ul className="mt-2 space-y-3">
            {active.expects.map((e) => (
              <li key={e.title} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="text-sm font-semibold text-white">{e.title}</div>
                <p className="mt-1 text-sm text-slate-400">{e.detail}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Notification obligations
          </h3>
          <ul className="mt-2 space-y-2">
            {active.notifications.map((n, i) => (
              <li
                key={i}
                className="grid gap-2 rounded-md border border-rose-500/20 bg-rose-500/[0.06] p-3 text-sm sm:grid-cols-[1fr_auto_auto]"
              >
                <div className="text-slate-200">{n.trigger}</div>
                <div className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-200">
                  {n.sla}
                </div>
                <div className="text-[11px] text-slate-400">Owned by {n.owner}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
