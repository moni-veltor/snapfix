type Cell = number; // count of exercises that tested this IBS × dimension

type IBSRow = {
  id: string;
  code: string;
  name: string;
  criticality: string;
  // 6-box counts
  people: Cell;
  property: Cell;
  technology: Cell;
  dataAvailability: Cell;
  dataIntegrity: Cell;
  thirdParty: Cell;
};

type Props = {
  rows: IBSRow[];
};

const COLS: { key: keyof Omit<IBSRow, "id" | "code" | "name" | "criticality">; label: string; short: string }[] = [
  { key: "people", label: "People", short: "P" },
  { key: "property", label: "Property", short: "Pr" },
  { key: "technology", label: "Technology", short: "T" },
  { key: "dataAvailability", label: "Data avail.", short: "DA" },
  { key: "dataIntegrity", label: "Data integ.", short: "DI" },
  { key: "thirdParty", label: "Third party", short: "3P" },
];

/**
 * IBS × 6-box risk dimension heatmap. Cell colour intensity scales with the
 * number of exercises that tested that IBS against that dimension. Uncovered
 * (count = 0) shows as a rose-tinted empty cell — the regulator's "what
 * haven't you tested?" view at a glance.
 */
export default function IBSCoverageHeatmap({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line bg-surface-1 p-6 text-center text-xs text-muted">
        Add IBSs to the register to see coverage analytics here.
      </p>
    );
  }

  // Max count across all cells, for intensity scaling
  const maxCount = Math.max(
    1,
    ...rows.flatMap((r) => COLS.map((c) => r[c.key])),
  );

  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            <th className="sticky left-0 z-10 min-w-[260px] border-b border-line bg-surface-2 p-3 text-left font-medium">
              Important Business Service
            </th>
            {COLS.map((c) => (
              <th
                key={c.key}
                className="min-w-[80px] border-b border-line p-2 text-center font-medium"
                title={c.label}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  {c.short}
                </div>
                <div className="mt-0.5 text-[11px]">{c.label}</div>
              </th>
            ))}
            <th className="border-b border-line p-2 text-center font-medium">Coverage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const totals = COLS.map((c) => r[c.key]);
            const covered = totals.filter((t) => t > 0).length;
            const coveragePct = Math.round((covered / COLS.length) * 100);
            return (
              <tr key={r.id} className="border-t border-line">
                <td className="sticky left-0 z-10 border-b border-line bg-surface-1 p-3">
                  <div className="font-medium text-ink">
                    <span className="mr-2 font-mono text-muted">{r.code}</span>
                    {r.name}
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-soft">
                    {r.criticality}
                  </div>
                </td>
                {COLS.map((c) => {
                  const count = r[c.key];
                  return <HeatCell key={c.key} count={count} max={maxCount} />;
                })}
                <td className="border-b border-line p-2 text-center">
                  <div className="mx-auto flex max-w-[80px] flex-col items-center gap-0.5">
                    <span
                      className={`text-sm font-semibold ${
                        coveragePct >= 80
                          ? "text-emerald-600 dark:text-emerald-300"
                          : coveragePct >= 40
                            ? "text-amber-600 dark:text-amber-300"
                            : "text-rose-600 dark:text-rose-300"
                      }`}
                    >
                      {coveragePct}%
                    </span>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full ${
                          coveragePct >= 80
                            ? "bg-emerald-500"
                            : coveragePct >= 40
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                        style={{ width: `${coveragePct}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HeatCell({ count, max }: { count: number; max: number }) {
  const intensity = count === 0 ? 0 : Math.min(1, count / max);

  let cellCls: string;
  let textCls = "text-ink";
  if (count === 0) {
    cellCls = "bg-rose-50/40 dark:bg-rose-950/20";
    textCls = "text-rose-500 dark:text-rose-400";
  } else if (intensity < 0.34) {
    cellCls = "bg-emerald-100 dark:bg-emerald-900/30";
    textCls = "text-emerald-800 dark:text-emerald-200";
  } else if (intensity < 0.67) {
    cellCls = "bg-emerald-200 dark:bg-emerald-900/50";
    textCls = "text-emerald-900 dark:text-emerald-100";
  } else {
    cellCls = "bg-emerald-300 dark:bg-emerald-800/70";
    textCls = "text-emerald-950 dark:text-emerald-50";
  }

  return (
    <td className={`border-b border-line text-center ${cellCls}`}>
      <span className={`font-mono text-xs font-semibold ${textCls}`}>
        {count === 0 ? "—" : count}
      </span>
    </td>
  );
}
