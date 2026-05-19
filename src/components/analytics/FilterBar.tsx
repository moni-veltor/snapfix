"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  CalendarRange,
  ChevronDown,
  Filter,
  Globe,
  Layers,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { RANGE_PRESETS } from "@/lib/analytics-filters";

type IBSOption = { id: string; code: string; name: string; criticality: string };

type Props = {
  ibsOptions: IBSOption[];
};

const JURISDICTIONS = ["UK", "EU", "UK_AND_EU", "US", "GLOBAL"] as const;
const CLASSIFICATIONS = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SECRET"] as const;

export default function FilterBar({ ibsOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = useMemo(() => {
    return {
      range: searchParams.get("range") ?? "1y",
      jurisdiction: searchParams.get("jurisdiction") ?? "",
      classification: searchParams.get("classification") ?? "",
      ibsIds: (searchParams.get("ibsIds") ?? "")
        .split(",")
        .filter(Boolean),
    };
  }, [searchParams]);

  const [pickedIbs, setPickedIbs] = useState<Set<string>>(new Set(current.ibsIds));
  const [open, setOpen] = useState(false);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "" || value === "all") next.delete(key);
      else next.set(key, value);
      startTransition(() => {
        router.replace(`/analytics?${next.toString()}`);
      });
    },
    [router, searchParams],
  );

  const applyIbs = () => {
    const next = new URLSearchParams(searchParams.toString());
    if (pickedIbs.size === 0) next.delete("ibsIds");
    else next.set("ibsIds", Array.from(pickedIbs).join(","));
    startTransition(() => {
      router.replace(`/analytics?${next.toString()}`);
    });
    setOpen(false);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    const audience = searchParams.get("audience");
    if (audience) next.set("audience", audience);
    setPickedIbs(new Set());
    startTransition(() => {
      router.replace(`/analytics?${next.toString()}`);
    });
  };

  const hasFilters =
    current.range !== "1y" ||
    !!current.jurisdiction ||
    !!current.classification ||
    current.ibsIds.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-1 p-3">
      <Filter size={13} className="text-soft" />

      <SelectPill
        icon={CalendarRange}
        value={current.range}
        onChange={(v) => updateParam("range", v)}
        options={RANGE_PRESETS.map((p) => ({ value: p.key, label: p.label }))}
      />

      <SelectPill
        icon={Globe}
        value={current.jurisdiction}
        placeholder="All jurisdictions"
        onChange={(v) => updateParam("jurisdiction", v)}
        options={[
          { value: "", label: "All jurisdictions" },
          ...JURISDICTIONS.map((j) => ({ value: j, label: j.replace("_", " + ") })),
        ]}
      />

      <SelectPill
        icon={ShieldCheck}
        value={current.classification}
        placeholder="All classifications"
        onChange={(v) => updateParam("classification", v)}
        options={[
          { value: "", label: "All classifications" },
          ...CLASSIFICATIONS.map((c) => ({ value: c, label: c })),
        ]}
      />

      {/* IBS multi-select */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${
            pickedIbs.size > 0
              ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
              : "border-line bg-surface-0 text-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          <Layers size={11} />
          IBSs{pickedIbs.size > 0 ? ` (${pickedIbs.size})` : ""}
          <ChevronDown size={10} />
        </button>
        {open && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-[320px] w-72 overflow-y-auto rounded-md border border-line bg-surface-1 p-2 shadow-[var(--shadow-card-lg)]">
            {ibsOptions.length === 0 ? (
              <p className="p-2 text-[11px] text-soft">No IBSs in the register yet.</p>
            ) : (
              <>
                <ul className="space-y-0.5">
                  {ibsOptions.map((ibs) => (
                    <li key={ibs.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-surface-2">
                        <input
                          type="checkbox"
                          checked={pickedIbs.has(ibs.id)}
                          onChange={(e) => {
                            setPickedIbs((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(ibs.id);
                              else next.delete(ibs.id);
                              return next;
                            });
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-ink">{ibs.name}</span>
                          <span className="block font-mono text-[10px] text-soft">
                            {ibs.code} · {ibs.criticality}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-line pt-2">
                  <button
                    type="button"
                    onClick={() => setPickedIbs(new Set())}
                    className="text-[10px] text-soft hover:text-ink"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyIbs}
                    className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                  >
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-0 px-2 py-1 text-[11px] text-muted hover:border-line-strong hover:text-ink"
        >
          <RotateCcw size={10} />
          Reset filters
        </button>
      )}

      {isPending && <span className="ml-auto text-[10px] text-soft">Updating…</span>}
    </div>
  );
}

function SelectPill({
  icon: Icon,
  value,
  options,
  onChange,
  placeholder,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const current = options.find((o) => o.value === value);
  const isDefault = value === "" || value === "1y" || value === "all";
  return (
    <label
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${
        isDefault
          ? "border-line bg-surface-0 text-muted hover:border-line-strong hover:text-ink"
          : "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
      }`}
    >
      <Icon size={11} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer bg-transparent text-[11px] outline-none"
      >
        {options.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {!current && placeholder && <span>{placeholder}</span>}
    </label>
  );
}

