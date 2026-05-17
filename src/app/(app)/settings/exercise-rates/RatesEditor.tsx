"use client";

import { useMemo, useState } from "react";
import { Plus, PoundSterling, Save, Trash2 } from "lucide-react";
import { saveExerciseRatesAction } from "@/app/actions/exercise-rates";

type Props = {
  initialRates: Record<string, number>;
  initialCurrency: string;
  /** Org role titles pre-populated from OrganizationRole catalogue. */
  catalogueRoles: { abbreviation: string; title: string }[];
  sectorDefaults: Record<string, number>;
};

export default function RatesEditor({
  initialRates,
  initialCurrency,
  catalogueRoles,
  sectorDefaults,
}: Props) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [rates, setRates] = useState<Record<string, number>>(initialRates);
  const [newRole, setNewRole] = useState("");
  const [newRate, setNewRate] = useState<number>(200);

  // Suggest catalogue roles that don't yet have an explicit rate.
  const catalogueGaps = useMemo(() => {
    return catalogueRoles.filter((r) => rates[r.abbreviation] === undefined);
  }, [catalogueRoles, rates]);

  const sortedRoles = useMemo(() => Object.keys(rates).sort(), [rates]);

  const setRate = (role: string, value: number) => {
    setRates((prev) => ({ ...prev, [role]: value }));
  };
  const remove = (role: string) => {
    setRates((prev) => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
  };

  return (
    <form action={saveExerciseRatesAction} className="space-y-5">
      <input type="hidden" name="ratesJson" value={JSON.stringify(rates)} />

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-line bg-surface-0 p-4">
        <div>
          <p className="text-sm font-semibold text-ink">Currency</p>
          <p className="text-[11px] text-muted">Used everywhere we surface cost.</p>
        </div>
        <select
          name="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm"
        >
          <option value="GBP">GBP £</option>
          <option value="EUR">EUR €</option>
          <option value="USD">USD $</option>
        </select>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Per-role hourly loaded cost ({currency})
        </h3>
        {sortedRoles.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-surface-1 p-3 text-[11px] text-muted">
            No custom rates yet — exercises will fall back to sector defaults
            (CEO {sectorDefaults.CEO} · CRO {sectorDefaults.CRO} · catch-all{" "}
            {sectorDefaults.__default__}).
          </p>
        ) : (
          <ul className="space-y-1.5">
            {sortedRoles.map((role) => (
              <li
                key={role}
                className="flex items-center gap-2 rounded-md border border-line bg-surface-0 px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 font-mono text-ink">{role}</span>
                <div className="relative">
                  <PoundSterling size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-soft" />
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step={10}
                    value={rates[role]}
                    onChange={(e) => setRate(role, parseInt(e.target.value, 10) || 0)}
                    className="w-28 rounded-md border border-line-strong bg-surface-1 py-1 pl-6 pr-2 text-sm"
                  />
                </div>
                <span className="text-[11px] text-soft">/ hr</span>
                <button
                  type="button"
                  onClick={() => remove(role)}
                  className="text-soft hover:text-rose-700"
                  title="Remove (will fall back to default)"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {catalogueGaps.length > 0 && (
          <div className="mt-3 rounded-md border border-line bg-surface-1 p-3">
            <p className="text-[11px] text-muted">
              Add catalogue role from your org chart:
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {catalogueGaps.slice(0, 12).map((r) => (
                <button
                  key={r.abbreviation}
                  type="button"
                  onClick={() => setRate(r.abbreviation, sectorDefaults[r.abbreviation] ?? sectorDefaults.__default__)}
                  className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted hover:bg-indigo-100 hover:text-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-200"
                >
                  + {r.abbreviation}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 rounded-md border border-line bg-surface-1 p-3">
          <p className="text-[11px] text-muted">Add a custom role:</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              maxLength={120}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Role title (e.g. Treasurer)"
              className="flex-1 rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min={0}
              max={100000}
              step={10}
              value={newRate}
              onChange={(e) => setNewRate(parseInt(e.target.value, 10) || 0)}
              className="w-24 rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (newRole.trim() === "") return;
                setRate(newRole.trim(), newRate);
                setNewRole("");
                setNewRate(200);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Plus size={11} />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-line pt-3">
        <button className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500">
          <Save size={13} />
          Save rates
        </button>
      </div>
    </form>
  );
}
