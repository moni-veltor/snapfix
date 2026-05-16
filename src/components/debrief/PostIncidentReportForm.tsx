"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  CircleAlert,
  FileText,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { savePIRAction } from "@/app/actions/closure";

type Section = {
  name:
    | "incidentSummary"
    | "timeline"
    | "rootCause"
    | "customerImpact"
    | "regulatoryImpact"
    | "controlFailures"
    | "whatWorkedWell"
    | "remediationCommitments";
  label: string;
  hint: string;
  placeholder: string;
  /** Soft minimum — sections under this are flagged as too thin. */
  minChars: number;
};

const SECTIONS: Section[] = [
  {
    name: "incidentSummary",
    label: "Incident summary",
    hint: "Two to three sentences that a Board member could read cold and understand the event. State what happened, when, the scope of impact, and how it was resolved.",
    placeholder:
      "On {date}, a {what} caused a {scope} disruption to {IBS}. The IMT was invoked at HH:MM; service was restored at HH:MM. {Customers / regulators / staff} were affected as follows...",
    minChars: 200,
  },
  {
    name: "timeline",
    label: "Timeline",
    hint: "Material moments in chronological order with timestamps. Detection, escalation, IMT invocation, key decisions, recovery milestones, all-clear. Use the live incident log as your source — don't re-author from memory.",
    placeholder:
      "HH:MM — Detection (source)\nHH:MM — Escalation to on-call lead\nHH:MM — IMT invoked\nHH:MM — Severity classified as ...\nHH:MM — BCP activated\nHH:MM — Customer comms cascade started\n...",
    minChars: 300,
  },
  {
    name: "rootCause",
    label: "Root cause",
    hint: "Five-whys: what was the direct trigger, the proximate cause, the systemic cause, and the cultural / governance cause. Distinguish what you know from what you suspect — flag if root-cause is still under investigation.",
    placeholder:
      "Direct trigger: ...\nProximate cause: ...\nSystemic cause: ...\nCultural / governance contributors: ...\n\nOutstanding investigation: ...",
    minChars: 200,
  },
  {
    name: "customerImpact",
    label: "Customer impact",
    hint: "Quantitative + qualitative. How many customers, what kind of harm (service unavailable, data exposed, financial loss), and which segments were over-represented. Call out vulnerable-customer cohorts explicitly per Consumer Duty.",
    placeholder:
      "Customers affected: {N} (~{%} of base)\nNature of impact: ...\nVulnerable-customer exposure: ...\nComplaints received in window: ...\nGoodwill / redress commitments: ...",
    minChars: 200,
  },
  {
    name: "regulatoryImpact",
    label: "Regulatory impact",
    hint: "Which regulators were (or should have been) notified, against which clocks, and the status of those notifications. UK GDPR Art. 33 (ICO 72h), DORA/major-incident reporting where relevant, FCA / PRA Principle 11, BoE for systemic firms.",
    placeholder:
      "FCA: ...\nPRA: ...\nICO: ...\nOther (BoE / DPC / overseas): ...\n\nOutstanding notifications: ...",
    minChars: 150,
  },
  {
    name: "controlFailures",
    label: "Control failures",
    hint: "Which preventive or detective controls failed to catch this, which compensating controls held, and which controls didn't exist that should have. Name the control owner so the remediation has a home.",
    placeholder:
      "Controls that failed: ...\nControls that held / compensated: ...\nMissing controls: ...\nControl owner(s) for remediation: ...",
    minChars: 200,
  },
  {
    name: "whatWorkedWell",
    label: "What worked well",
    hint: "Genuinely. The PIR is not just blame — capture the behaviours, processes, and tools that should be reinforced. The Board will look for evidence of operational maturity here.",
    placeholder:
      "- Detection signal fired within {N} min of root event\n- Comms cascade reached employees before media\n- BCP activation was rehearsed in last exercise — team executed without hesitation\n- ...",
    minChars: 100,
  },
  {
    name: "remediationCommitments",
    label: "Remediation commitments",
    hint: "Numbered list of remediation actions, each with an owner, a target date, and a verification mechanism. These feed into ERCC then BRCC; vague commitments will be challenged.",
    placeholder:
      "1. {Action} — Owner: {Name / Role} — Due: {YYYY-MM-DD} — Verified by: {evidence type}\n2. ...\n3. ...",
    minChars: 200,
  },
];

const SECTION_GROUPS: { key: string; label: string; icon: typeof FileText; description: string; names: Section["name"][] }[] = [
  {
    key: "what",
    label: "What happened",
    icon: FileText,
    description: "Factual account of the incident from the log — no opinions yet.",
    names: ["incidentSummary", "timeline", "rootCause"],
  },
  {
    key: "impact",
    label: "Impact",
    icon: CircleAlert,
    description: "Who was hurt and how. The bar is quantitative where possible.",
    names: ["customerImpact", "regulatoryImpact", "controlFailures"],
  },
  {
    key: "forward",
    label: "What we'll do",
    icon: Wrench,
    description: "Reinforce what worked, commit owners and dates to what didn't.",
    names: ["whatWorkedWell", "remediationCommitments"],
  },
];

type Defaults = Partial<Record<Section["name"], string>>;

type Props = {
  exerciseId: string;
  incidentId: string;
  defaults: Defaults;
  alreadySubmitted: boolean;
};

/**
 * Doctrine-aligned PIR form (IMP §6.5.3). Eight mandatory sections
 * grouped into three Board-facing buckets (What happened / Impact /
 * What we'll do) with per-section guidance and live completeness
 * tracking. Submission is gated until all sections have content
 * because partial PIRs going to ERCC/BRCC get bounced.
 */
export default function PostIncidentReportForm({
  exerciseId,
  incidentId,
  defaults,
  alreadySubmitted,
}: Props) {
  const [values, setValues] = useState<Record<Section["name"], string>>(() => {
    const init = {} as Record<Section["name"], string>;
    for (const s of SECTIONS) init[s.name] = defaults[s.name] ?? "";
    return init;
  });

  const completion = useMemo(() => {
    const filled = SECTIONS.filter((s) => (values[s.name]?.trim().length ?? 0) >= s.minChars).length;
    const present = SECTIONS.filter((s) => (values[s.name]?.trim().length ?? 0) > 0).length;
    return { filled, present, total: SECTIONS.length };
  }, [values]);

  const submittable = completion.present === completion.total;

  return (
    <form
      action={savePIRAction}
      className="space-y-5 rounded-xl border border-line bg-surface-1 p-5"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="incidentId" value={incidentId} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-0 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-300" />
          <div>
            <p className="text-sm font-semibold text-ink">PIR completeness</p>
            <p className="text-xs text-muted">
              {completion.present} of {completion.total} sections drafted ·{" "}
              {completion.filled} meet the suggested depth
            </p>
          </div>
        </div>
        <div className="flex h-1.5 w-48 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full transition-all ${
              completion.present === completion.total
                ? "bg-emerald-500"
                : completion.present >= completion.total / 2
                  ? "bg-amber-500"
                  : "bg-rose-500"
            }`}
            style={{ width: `${(completion.present / completion.total) * 100}%` }}
          />
        </div>
      </div>

      {SECTION_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        return (
          <fieldset key={group.key} className="space-y-3 rounded-lg border border-line bg-surface-0 p-4">
            <legend className="px-1">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                <GroupIcon size={14} className="text-indigo-600 dark:text-indigo-300" />
                {group.label}
              </span>
              <span className="ml-2 text-[11px] text-muted">{group.description}</span>
            </legend>

            {group.names.map((name) => {
              const section = SECTIONS.find((s) => s.name === name)!;
              const content = values[section.name] ?? "";
              const len = content.trim().length;
              const status =
                len === 0 ? "empty" : len < section.minChars ? "thin" : "ok";
              return (
                <div key={section.name} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <label
                      htmlFor={`pir-${section.name}`}
                      className="text-sm font-medium text-ink"
                    >
                      {section.label}
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
                        status === "ok"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : status === "thin"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-soft"
                      }`}
                    >
                      {status === "ok" && <CheckCircle2 size={10} />}
                      {status === "thin" && <AlertOctagon size={10} />}
                      {status === "empty" && <Sparkles size={10} />}
                      {len} chars · target {section.minChars}+
                    </span>
                  </div>
                  <p className="flex items-start gap-1.5 text-[11px] text-muted">
                    <HelpCircle size={11} className="mt-0.5 shrink-0 text-soft" />
                    {section.hint}
                  </p>
                  <textarea
                    id={`pir-${section.name}`}
                    name={section.name}
                    rows={6}
                    placeholder={section.placeholder}
                    value={content}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [section.name]: e.target.value }))
                    }
                    className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink"
                  />
                </div>
              );
            })}
          </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <label
          className={`flex items-center gap-2 text-xs ${
            submittable ? "text-ink" : "text-soft"
          }`}
        >
          <input
            type="checkbox"
            name="submit"
            disabled={!submittable || alreadySubmitted}
            defaultChecked={alreadySubmitted}
          />
          {alreadySubmitted ? (
            <>Already submitted to ERCC / BRCC</>
          ) : submittable ? (
            <>Mark as submitted (tables into the next ERCC then BRCC)</>
          ) : (
            <>Draft all 8 sections before this can be marked submitted</>
          )}
        </label>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
          <FileText size={13} />
          Save PIR
        </button>
      </div>
    </form>
  );
}
