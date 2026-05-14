"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckSquare,
  ClipboardList,
  Layers,
  Scale,
  Sparkles,
} from "lucide-react";
import { createIBSAction, updateIBSAction } from "@/app/actions/ibs";
import ImportanceWizard from "@/components/ibs/ImportanceWizard";

type IBS = {
  id?: string;
  code?: string;
  name?: string;
  outcome?: string | null;
  description?: string | null;
  processType?: string | null;
  processOwner?: string | null;
  secondLineReviewer?: string | null;
  reviewDueAt?: Date | null;
  customerJourneys?: string[];
  productsCovered?: string[];
  impactToleranceMin?: number;
  fcaToleranceMin?: number | null;
  praToleranceMin?: number | null;
  toleranceRationale?: string | null;
  criticality?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  technology?: string[];
  peopleNotes?: string | null;
  facilities?: string | null;
  thirdParties?: string[];
  information?: string[];
  processes?: string[];
  impactCustomerFinancial?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactVulnerableCustomer?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactLossOfLicense?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactRegulatoryFine?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactReputational?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  impactLossOfCapital?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  importanceAssessmentNotes?: string | null;
  vulnerabilitiesNotes?: string | null;
  testingNotes?: string | null;
  coversPeople?: boolean;
  coversProperty?: boolean;
  coversTechnology?: boolean;
  coversDataAvailability?: boolean;
  coversDataIntegrity?: boolean;
  coversThirdParty?: boolean;
};

type TabKey = "identity" | "tolerance" | "resources" | "importance" | "coverage";

const TABS: { key: TabKey; label: string; icon: typeof Sparkles; hint: string }[] = [
  { key: "identity", label: "Identity", icon: Sparkles, hint: "Name, outcome, ownership" },
  { key: "tolerance", label: "Tolerance", icon: Scale, hint: "Limits, criticality, rationale" },
  { key: "resources", label: "Resource map", icon: Layers, hint: "Tech, 3rd parties, processes" },
  { key: "importance", label: "Importance", icon: ClipboardList, hint: "6-dimension assessment" },
  { key: "coverage", label: "Coverage & notes", icon: CheckSquare, hint: "Harm types & free text" },
];

export default function IBSForm({ existing }: { existing?: IBS }) {
  const isEdit = !!existing?.id;
  const action = isEdit ? updateIBSAction : createIBSAction;
  const [tab, setTab] = useState<TabKey>("identity");

  return (
    <form action={action} className="space-y-5">
      {isEdit && existing?.id && <input type="hidden" name="id" value={existing.id} />}

      <TabBar value={tab} onChange={setTab} />

      <Panel active={tab === "identity"}>
        <Section title="Identity">
          <Grid>
            <Field label="Code" name="code" required defaultValue={existing?.code} placeholder="IBS_01" />
            <Field label="Name" name="name" required defaultValue={existing?.name} placeholder="Deposit Account Opening" wide />
            <TextArea label="Outcome (1 sentence)" name="outcome" defaultValue={existing?.outcome ?? ""} placeholder="New and existing customers can open deposit accounts and fund them" wide rows={2} />
            <TextArea label="Description" name="description" defaultValue={existing?.description ?? ""} wide rows={3} />
          </Grid>
        </Section>

        <Section title="Governance & ownership">
          <Grid>
            <Field label="Process type" name="processType" defaultValue={existing?.processType ?? ""} placeholder="A" />
            <Field label="Process owner" name="processOwner" defaultValue={existing?.processOwner ?? ""} placeholder="Chief Technology Officer" />
            <Field label="2nd-line reviewer" name="secondLineReviewer" defaultValue={existing?.secondLineReviewer ?? ""} placeholder="Chief Risk Officer" />
            <Field label="Review due" name="reviewDueAt" type="date" defaultValue={existing?.reviewDueAt ? new Date(existing.reviewDueAt).toISOString().slice(0, 10) : ""} />
          </Grid>
        </Section>
      </Panel>

      <Panel active={tab === "tolerance"}>
        <Section title="Impact tolerance">
          <Grid>
            <Field label="Primary tolerance (minutes)" name="impactToleranceMin" type="number" min={0} required defaultValue={existing?.impactToleranceMin?.toString() ?? "240"} />
            <Field label="FCA tolerance (minutes)" name="fcaToleranceMin" type="number" min={0} defaultValue={existing?.fcaToleranceMin?.toString() ?? ""} placeholder="e.g. 5760 (4 days)" />
            <Field label="PRA tolerance (minutes)" name="praToleranceMin" type="number" min={0} defaultValue={existing?.praToleranceMin?.toString() ?? ""} placeholder="e.g. 2880 (2 days)" />
            <Select label="Criticality" name="criticality" defaultValue={existing?.criticality ?? "HIGH"} options={["LOW","MEDIUM","HIGH","CRITICAL"]} />
            <TextArea label="Tolerance rationale" name="toleranceRationale" defaultValue={existing?.toleranceRationale ?? ""} rows={4} wide placeholder="Cascading event of 31h considering business and non-business hours; FCA = 4 days, PRA = 2 days" />
          </Grid>
          <Tip>
            Primary tolerance is *your* declared limit. FCA / PRA tolerances are the regulator-facing
            ones — typically wider. The gap between them is your operating headroom.
          </Tip>
        </Section>

        <Section title="Methodology">
          <Grid>
            <TextArea label="Customer journeys (one per line)" name="customerJourneys" defaultValue={(existing?.customerJourneys ?? []).join("\n")} rows={4} placeholder={"Customer mobile registration\nCustomer ID/V check\nCustomer AML checks\nCustomer login"} />
            <TextArea label="Products covered (one per line)" name="productsCovered" defaultValue={(existing?.productsCovered ?? []).join("\n")} rows={4} placeholder={"Notice accounts\n1-year fixed term\n2-year fixed term"} />
          </Grid>
        </Section>
      </Panel>

      <Panel active={tab === "resources"}>
        <Section title="Resource map">
          <Grid>
            <TextArea label="Technology / platforms (one per line)" name="technology" defaultValue={(existing?.technology ?? []).join("\n")} rows={4} placeholder={"Core Banking Platform\nPayment Gateway\nKYC/AML Platform"} />
            <TextArea label="3rd parties (one per line)" name="thirdParties" defaultValue={(existing?.thirdParties ?? []).join("\n")} rows={4} placeholder={"Thought Machine\nClearBank\nSumsub\nComplyAdvantage"} />
            <TextArea label="Information / data types" name="information" defaultValue={(existing?.information ?? []).join("\n")} rows={3} placeholder={"Customer identification data\nKYC documentation\nDeposit details"} />
            <TextArea label="Processes" name="processes" defaultValue={(existing?.processes ?? []).join("\n")} rows={3} placeholder={"Digital application submission\nIdentity verification\nAccount creation"} />
            <TextArea label="People notes" name="peopleNotes" defaultValue={existing?.peopleNotes ?? ""} rows={2} wide />
            <Field label="Facilities" name="facilities" defaultValue={existing?.facilities ?? ""} placeholder="AWS UK region, multi-AZ" wide />
          </Grid>
          <Tip>
            Resource entries here power the interactive dependency map on the IBS detail
            page — and surface shared-dependency risks across other IBSs.
          </Tip>
        </Section>
      </Panel>

      <Panel active={tab === "importance"}>
        <Section title="Importance assessment">
          <p className="mb-3 flex items-start gap-1.5 text-xs text-muted">
            <BookOpen size={12} className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-300" />
            Score across six dimensions. Overall importance is the highest of the six.
            Each dimension carries threshold guidance — pick the band that best describes
            the worst-plausible impact.
          </p>
          <ImportanceWizard
            existing={{
              impactCustomerFinancial: (existing?.impactCustomerFinancial as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null) ?? "",
              impactVulnerableCustomer: (existing?.impactVulnerableCustomer as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null) ?? "",
              impactLossOfLicense: (existing?.impactLossOfLicense as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null) ?? "",
              impactRegulatoryFine: (existing?.impactRegulatoryFine as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null) ?? "",
              impactReputational: (existing?.impactReputational as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null) ?? "",
              impactLossOfCapital: (existing?.impactLossOfCapital as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null) ?? "",
            }}
          />
        </Section>
      </Panel>

      <Panel active={tab === "coverage"}>
        <Section title="Risk coverage (6-box)">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Toggle label="People" name="coversPeople" defaultChecked={!!existing?.coversPeople} />
            <Toggle label="Property" name="coversProperty" defaultChecked={!!existing?.coversProperty} />
            <Toggle label="Technology" name="coversTechnology" defaultChecked={!!existing?.coversTechnology} />
            <Toggle label="Data availability" name="coversDataAvailability" defaultChecked={!!existing?.coversDataAvailability} />
            <Toggle label="Data integrity" name="coversDataIntegrity" defaultChecked={!!existing?.coversDataIntegrity} />
            <Toggle label="Third party" name="coversThirdParty" defaultChecked={!!existing?.coversThirdParty} />
          </div>
        </Section>

        <Section title="Notes (markdown)">
          <Grid>
            <TextArea label="Importance assessment notes" name="importanceAssessmentNotes" defaultValue={existing?.importanceAssessmentNotes ?? ""} rows={3} wide />
            <TextArea label="Vulnerabilities" name="vulnerabilitiesNotes" defaultValue={existing?.vulnerabilitiesNotes ?? ""} rows={3} wide />
            <TextArea label="Testing notes" name="testingNotes" defaultValue={existing?.testingNotes ?? ""} rows={3} wide />
          </Grid>
        </Section>
      </Panel>

      <FooterBar tab={tab} onChange={setTab} isEdit={isEdit} />
    </form>
  );
}

function TabBar({ value, onChange }: { value: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div
      role="tablist"
      className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1 rounded-xl border border-line bg-surface-1/95 p-1 backdrop-blur"
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`group flex flex-1 min-w-[140px] items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
              active
                ? "bg-gradient-brand text-white shadow-[var(--shadow-card)]"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon size={14} className="shrink-0" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">{t.label}</span>
              <span
                className={`block truncate text-[10px] ${
                  active ? "text-white/80" : "text-soft"
                }`}
              >
                {t.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FooterBar({
  tab,
  onChange,
  isEdit,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
  isEdit: boolean;
}) {
  const idx = TABS.findIndex((t) => t.key === tab);
  const prev = idx > 0 ? TABS[idx - 1] : null;
  const next = idx < TABS.length - 1 ? TABS[idx + 1] : null;
  return (
    <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-elev/95 p-3 shadow-[var(--shadow-card-md)] backdrop-blur">
      <div className="text-xs text-muted">
        Step <span className="font-semibold text-ink">{idx + 1}</span> of {TABS.length} · {TABS[idx].label}
      </div>
      <div className="flex items-center gap-2">
        {prev && (
          <button
            type="button"
            onClick={() => onChange(prev.key)}
            className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
          >
            ← {prev.label}
          </button>
        )}
        {next ? (
          <button
            type="button"
            onClick={() => onChange(next.key)}
            className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
          >
            {next.label} →
          </button>
        ) : null}
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {isEdit ? "Save changes" : "Create IBS"}
        </button>
      </div>
    </div>
  );
}

function Panel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div hidden={!active} className="space-y-5">
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 p-2.5 text-[11px] text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-200">
      <Sparkles size={11} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function Field({
  label,
  wide,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-ink">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-ink outline-none placeholder:text-soft focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
      />
    </label>
  );
}

function TextArea({
  label,
  wide,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-ink">{label}</span>
      <textarea
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-ink outline-none placeholder:text-soft focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
      />
    </label>
  );
}

function Select({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <select
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-ink outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-line bg-surface-0 px-3 py-2 text-sm text-ink hover:border-line-strong">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="rounded" />
      <span>{label}</span>
    </label>
  );
}
