"use client";

import { useState } from "react";

type TabKey = "IBS" | "SITREP" | "AAR";

export default function TemplateGenerators() {
  const [tab, setTab] = useState<TabKey>("IBS");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-white/10">
        {(["IBS", "SITREP", "AAR"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "border-indigo-400 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {LABEL[key]}
          </button>
        ))}
      </div>

      {tab === "IBS" && <IBSGenerator />}
      {tab === "SITREP" && <SitrepGenerator />}
      {tab === "AAR" && <AARGenerator />}
    </div>
  );
}

const LABEL: Record<TabKey, string> = {
  IBS: "IBS register (CSV)",
  SITREP: "Sitrep (Markdown)",
  AAR: "After-Action Report (Markdown)",
};

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function IBSGenerator() {
  const [rows, setRows] = useState([
    {
      code: "IBS_01",
      name: "Deposit account opening",
      outcome: "New customers can open deposit accounts within 1 business day",
      toleranceHours: 48,
      tier: "Tier 1",
      owner: "COO",
    },
    {
      code: "IBS_02",
      name: "Customer access to funds",
      outcome: "Existing customers can access their funds",
      toleranceHours: 4,
      tier: "Tier 1",
      owner: "COO",
    },
    {
      code: "IBS_03",
      name: "Urgent customer comms",
      outcome: "Customers can reach the firm for urgent issues",
      toleranceHours: 2,
      tier: "Tier 1",
      owner: "CCO",
    },
  ]);

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        code: `IBS_${String(prev.length + 1).padStart(2, "0")}`,
        name: "",
        outcome: "",
        toleranceHours: 24,
        tier: "Tier 2",
        owner: "",
      },
    ]);

  const updateRow = (i: number, field: keyof (typeof rows)[number], value: string | number) => {
    setRows((prev) => prev.map((r, j) => (i === j ? { ...r, [field]: value } : r)));
  };

  const removeRow = (i: number) => setRows((prev) => prev.filter((_, j) => j !== i));

  const download = () => {
    const header = "code,name,outcome,impact_tolerance_hours,tier,owner";
    const lines = rows.map((r) =>
      [
        r.code,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.outcome.replace(/"/g, '""')}"`,
        r.toleranceHours,
        r.tier,
        r.owner,
      ].join(","),
    );
    downloadFile("ibs-register.csv", [header, ...lines].join("\n"), "text/csv");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        A starter IBS register. Edit the rows in place, add your own, then export to CSV. The
        CSV imports cleanly into Excel, Google Sheets, and the SnapFix IBS register.
      </p>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-xs">
          <thead className="bg-white/[0.04] text-slate-300">
            <tr>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Outcome</Th>
              <Th>Tolerance (h)</Th>
              <Th>Tier</Th>
              <Th>Owner</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/5">
                <Td>
                  <Inp value={r.code} onChange={(v) => updateRow(i, "code", v)} />
                </Td>
                <Td>
                  <Inp value={r.name} onChange={(v) => updateRow(i, "name", v)} />
                </Td>
                <Td>
                  <Inp value={r.outcome} onChange={(v) => updateRow(i, "outcome", v)} />
                </Td>
                <Td>
                  <Inp
                    type="number"
                    value={String(r.toleranceHours)}
                    onChange={(v) => updateRow(i, "toleranceHours", Number(v) || 0)}
                  />
                </Td>
                <Td>
                  <select
                    value={r.tier}
                    onChange={(e) => updateRow(i, "tier", e.target.value)}
                    className="w-full rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white"
                  >
                    <option>Tier 1</option>
                    <option>Tier 2</option>
                    <option>Tier 3</option>
                  </select>
                </Td>
                <Td>
                  <Inp value={r.owner} onChange={(v) => updateRow(i, "owner", v)} />
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-rose-300 hover:text-rose-100"
                  >
                    ×
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.04]"
        >
          + Add row
        </button>
        <button
          type="button"
          onClick={download}
          className="rounded-md bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
        >
          Download CSV ↓
        </button>
      </div>
    </div>
  );
}

function SitrepGenerator() {
  const [bu, setBu] = useState("Tech Recovery");
  const [status, setStatus] = useState<"GREEN" | "AMBER" | "RED">("AMBER");
  const [summary, setSummary] = useState(
    "Core banking application failing intermittently since 14:05. Failover to DR site initiated; ~40 minutes ETA to green.",
  );
  const [issues, setIssues] = useState(
    "- Vendor escalation in progress (Thought Machine, P1)\n- Customer service queue depth doubled in last 15 min",
  );
  const [asks, setAsks] = useState("- Authority to extend OOH staffing\n- IMT decision on customer comms timing");
  const [next, setNext] = useState("15:00");

  const generated = `# Sitrep — ${bu}
**Status:** ${status}
**D-Day:** ${new Date().toISOString().slice(11, 16)}
**Next update:** ${next}

## Situation
${summary}

## Issues
${issues}

## Asks of the IMT
${asks}
`;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Fill in the form on the left; the markdown sitrep updates on the right. Download to
        paste into Slack, Teams or the incident channel.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Field label="Business unit">
            <Inp value={bu} onChange={setBu} />
          </Field>
          <Field label="Status">
            <div className="flex gap-1">
              {(["GREEN", "AMBER", "RED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                    status === s ? STATUS_ACTIVE[s] : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Next update (D-Day HH:MM)">
            <Inp value={next} onChange={setNext} />
          </Field>
          <Field label="Situation summary">
            <Ta value={summary} onChange={setSummary} rows={3} />
          </Field>
          <Field label="Issues / blockers (one per line)">
            <Ta value={issues} onChange={setIssues} rows={3} />
          </Field>
          <Field label="Asks of the IMT">
            <Ta value={asks} onChange={setAsks} rows={3} />
          </Field>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Preview
          </div>
          <pre className="mt-1 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-200">
            {generated}
          </pre>
          <button
            type="button"
            onClick={() => downloadFile("sitrep.md", generated, "text/markdown")}
            className="mt-2 w-full rounded-md bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
          >
            Download markdown ↓
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_ACTIVE = {
  GREEN: "bg-emerald-500 text-white",
  AMBER: "bg-amber-500 text-white",
  RED: "bg-rose-500 text-white",
} as const;

function AARGenerator() {
  const [data, setData] = useState({
    incidentName: "Q2 cyber tabletop — ransomware on core banking",
    summary: "",
    timeline: "",
    rootCause: "",
    customerImpact: "",
    regulatoryImpact: "",
    controls: "",
    worked: "",
    remediation: "",
  });

  const update = (k: keyof typeof data, v: string) => setData((prev) => ({ ...prev, [k]: v }));

  const generated = `# After-Action Report — ${data.incidentName}

## Incident summary
${data.summary || "_(write a 3–5 sentence summary)_"}

## Timeline
${data.timeline || "_(D-Day timestamps, key events, decisions taken)_"}

## Root cause
${data.rootCause || "_(preliminary RCA — full RCA may follow separately)_"}

## Customer impact
${data.customerImpact || "_(volumes, duration, harm typology)_"}

## Regulatory impact
${data.regulatoryImpact || "_(notifications made, regulator interactions, any reportable findings)_"}

## Control failures
${data.controls || "_(controls that should have triggered, missed alerts, gaps identified)_"}

## What worked well
${data.worked || "_(call out the things the team did right — equally important)_"}

## Remediation commitments
${data.remediation || "_(action items with owner, due date, evidence-of-completion criterion)_"}
`;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Generates the eight-section Post-Incident Report structure from Afin IMP §6.5.3. Fill
        the sections, download, paste into Confluence / SharePoint / your ERM platform.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Field label="Incident name"><Inp value={data.incidentName} onChange={(v) => update("incidentName", v)} /></Field>
          <Field label="Incident summary"><Ta rows={3} value={data.summary} onChange={(v) => update("summary", v)} /></Field>
          <Field label="Timeline"><Ta rows={3} value={data.timeline} onChange={(v) => update("timeline", v)} /></Field>
          <Field label="Root cause"><Ta rows={2} value={data.rootCause} onChange={(v) => update("rootCause", v)} /></Field>
          <Field label="Customer impact"><Ta rows={2} value={data.customerImpact} onChange={(v) => update("customerImpact", v)} /></Field>
          <Field label="Regulatory impact"><Ta rows={2} value={data.regulatoryImpact} onChange={(v) => update("regulatoryImpact", v)} /></Field>
          <Field label="Control failures"><Ta rows={2} value={data.controls} onChange={(v) => update("controls", v)} /></Field>
          <Field label="What worked well"><Ta rows={2} value={data.worked} onChange={(v) => update("worked", v)} /></Field>
          <Field label="Remediation commitments"><Ta rows={3} value={data.remediation} onChange={(v) => update("remediation", v)} /></Field>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preview</div>
          <pre className="mt-1 max-h-[600px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-200">{generated}</pre>
          <button
            type="button"
            onClick={() => downloadFile("aar.md", generated, "text/markdown")}
            className="mt-2 w-full rounded-md bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
          >
            Download markdown ↓
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Inp({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
    />
  );
}

function Ta({
  value,
  onChange,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows ?? 3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
    />
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>;
}
