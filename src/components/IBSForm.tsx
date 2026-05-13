"use client";

import { createIBSAction, updateIBSAction } from "@/app/actions/ibs";

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

export default function IBSForm({ existing }: { existing?: IBS }) {
  const isEdit = !!existing?.id;
  const action = isEdit ? updateIBSAction : createIBSAction;

  return (
    <form action={action} className="space-y-8">
      {isEdit && existing?.id && <input type="hidden" name="id" value={existing.id} />}

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

      <Section title="Methodology">
        <Grid>
          <TextArea label="Customer journeys (one per line)" name="customerJourneys" defaultValue={(existing?.customerJourneys ?? []).join("\n")} rows={4} placeholder={"Customer mobile registration\nCustomer ID/V check\nCustomer AML checks\nCustomer login"} />
          <TextArea label="Products covered (one per line)" name="productsCovered" defaultValue={(existing?.productsCovered ?? []).join("\n")} rows={4} placeholder={"Notice accounts\n1-year fixed term\n2-year fixed term"} />
        </Grid>
      </Section>

      <Section title="Impact tolerance">
        <Grid>
          <Field label="Primary tolerance (minutes)" name="impactToleranceMin" type="number" min={0} required defaultValue={existing?.impactToleranceMin?.toString() ?? "240"} />
          <Field label="FCA tolerance (minutes)" name="fcaToleranceMin" type="number" min={0} defaultValue={existing?.fcaToleranceMin?.toString() ?? ""} placeholder="e.g. 5760 (4 days)" />
          <Field label="PRA tolerance (minutes)" name="praToleranceMin" type="number" min={0} defaultValue={existing?.praToleranceMin?.toString() ?? ""} placeholder="e.g. 2880 (2 days)" />
          <Select label="Criticality" name="criticality" defaultValue={existing?.criticality ?? "HIGH"} options={["LOW","MEDIUM","HIGH","CRITICAL"]} />
          <TextArea label="Tolerance rationale" name="toleranceRationale" defaultValue={existing?.toleranceRationale ?? ""} rows={3} wide placeholder="Cascading event of 31h considering business and non-business hours; FCA = 4 days, PRA = 2 days" />
        </Grid>
      </Section>

      <Section title="Resource map">
        <Grid>
          <TextArea label="Technology / platforms (one per line)" name="technology" defaultValue={(existing?.technology ?? []).join("\n")} rows={4} placeholder={"Core Banking Platform\nPayment Gateway\nKYC/AML Platform"} />
          <TextArea label="3rd parties (one per line)" name="thirdParties" defaultValue={(existing?.thirdParties ?? []).join("\n")} rows={4} placeholder={"Thought Machine\nClearBank\nSumsub\nComplyAdvantage"} />
          <TextArea label="Information / data types" name="information" defaultValue={(existing?.information ?? []).join("\n")} rows={3} placeholder={"Customer identification data\nKYC documentation\nDeposit details"} />
          <TextArea label="Processes" name="processes" defaultValue={(existing?.processes ?? []).join("\n")} rows={3} placeholder={"Digital application submission\nIdentity verification\nAccount creation"} />
          <TextArea label="People notes" name="peopleNotes" defaultValue={existing?.peopleNotes ?? ""} rows={2} wide />
          <Field label="Facilities" name="facilities" defaultValue={existing?.facilities ?? ""} placeholder="AWS UK region, multi-AZ" wide />
        </Grid>
      </Section>

      <Section title="Importance assessment">
        <Grid>
          <Select label="Customer financial loss" name="impactCustomerFinancial" defaultValue={existing?.impactCustomerFinancial ?? ""} options={["","LOW","MEDIUM","HIGH","CRITICAL"]} />
          <Select label="Vulnerable customer impact" name="impactVulnerableCustomer" defaultValue={existing?.impactVulnerableCustomer ?? ""} options={["","LOW","MEDIUM","HIGH","CRITICAL"]} />
          <Select label="Loss of licence risk" name="impactLossOfLicense" defaultValue={existing?.impactLossOfLicense ?? ""} options={["","LOW","MEDIUM","HIGH","CRITICAL"]} />
          <Select label="Regulatory fine" name="impactRegulatoryFine" defaultValue={existing?.impactRegulatoryFine ?? ""} options={["","LOW","MEDIUM","HIGH","CRITICAL"]} />
          <Select label="Reputational" name="impactReputational" defaultValue={existing?.impactReputational ?? ""} options={["","LOW","MEDIUM","HIGH","CRITICAL"]} />
          <Select label="Loss of capital" name="impactLossOfCapital" defaultValue={existing?.impactLossOfCapital ?? ""} options={["","LOW","MEDIUM","HIGH","CRITICAL"]} />
        </Grid>
      </Section>

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

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          {isEdit ? "Save changes" : "Create IBS"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-md border border-line bg-surface-1 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  wide,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-slate-700">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
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
      <span className="text-slate-700">{label}</span>
      <textarea
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
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
      <span className="text-slate-700">{label}</span>
      <select
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2"
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
    <label className="flex items-center gap-2 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}
