"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  Building2,
  ClipboardCheck,
  FileSearch,
  Gavel,
  Layers,
  LogOut,
  Plus,
  Save,
  ShieldCheck,
  ShieldQuestion,
  Trash2,
} from "lucide-react";
import {
  addVendorAssessmentAction,
  removeVendorAssessmentAction,
  upsertVendorMtpFieldsAction,
} from "@/app/actions/vendor-mtp";
import {
  ASSESSMENT_KIND_LABEL,
  ASSESSMENT_OUTCOME_LABEL,
  CLOUD_DEPLOYMENT_LABEL,
  COMPLIANCE_LABEL,
  COUNTRY,
  FUNCTION_CATEGORY,
  IMPACT_DISCONTINUE_LABEL,
  MATERIALITY_REASON_LABEL,
  REINTEGRATION_LABEL,
  SERVICE_TYPE,
  SUBSTITUTABILITY_LABEL,
} from "@/lib/mtp-taxonomy";

type Assessment = {
  id: string;
  kind: "RISK" | "AUDIT" | "FINANCIAL_DD" | "CYBER_DD";
  assessedAt: Date;
  outcome: "SATISFACTORY" | "NON_SATISFACTORY" | "ONGOING" | "NOT_APPLICABLE";
  commentary: string | null;
};

// Cut down to what the editor needs — accepts the full Vendor row.
type VendorForEditor = {
  id: string;
  name: string;
  isMaterialThirdParty: boolean;
  // 2
  contractRef: string | null;
  legalName: string | null;
  legalEntityIdentifier: string | null;
  isOutsourcing: boolean | null;
  serviceTypeTaxonomy: string | null;
  cloudDeployment: "PUBLIC" | "PRIVATE" | "HYBRID" | "NON_CLOUD" | null;
  productServiceDescription: string | null;
  supplyChainRanking: number | null;
  contractStartAt: Date | null;
  contractEndAt: Date | null;
  serviceCommencedAt: Date | null;
  noticePeriodVendorDays: number | null;
  noticePeriodFirmDays: number | null;
  governingLaw: string | null;
  contractAnnualValueGBP: number | null;
  // 3
  materialityReason: string | null;
  materialityAssessedAt: Date | null;
  functionCategory: string | null;
  supportsCoreIBSElement: boolean | null;
  itPRASafetySoundness: string | null;
  itPRAFinancialStability: string | null;
  itPRAPolicyholderProtection: string | null;
  itFCAClientHarm: string | null;
  itFCAMarketIntegrity: string | null;
  itBankFMIRegulator: string | null;
  countryDataStored: string | null;
  countryServiceDeliveredFrom: string | null;
  // 4
  compliesWithRules: "YES" | "NO" | "ONGOING" | null;
  assuranceSummary: string | null;
  smfSignedOff: boolean | null;
  governanceCommittee: string | null;
  governanceApprovedAt: Date | null;
  // 5
  substitutability: string | null;
  reintegrationAbility: string | null;
  impactOfDiscontinuing: string | null;
  // relations
  assessments: Assessment[];
  ibsLinks: { ibs: { id: string; name: string; criticality: string } }[];
};

type Readiness = {
  checks: { id: string; ref: string; label: string; ok: boolean }[];
  passed: number;
  total: number;
  isRegisterReady: boolean;
};

type Props = {
  vendor: VendorForEditor;
  readiness: Readiness;
  canEdit: boolean;
};

export default function MtpEditor({ vendor, readiness, canEdit }: Props) {
  const [isMTP, setIsMTP] = useState(vendor.isMaterialThirdParty);
  const [supportsIBS, setSupportsIBS] = useState<boolean | null>(vendor.supportsCoreIBSElement);

  return (
    <div className="space-y-6">
      <ReadinessHeader readiness={readiness} isMTP={isMTP} />

      <form action={upsertVendorMtpFieldsAction} className="space-y-5">
        <input type="hidden" name="vendorId" value={vendor.id} />
        {/* MTP master switch — hidden until checked, then visible to confirm */}
        <section className="rounded-xl border border-line bg-surface-1 p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="isMaterialThirdParty"
              checked={isMTP}
              onChange={(e) => setIsMTP(e.target.checked)}
              disabled={!canEdit}
              className="mt-1"
            />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-300" />
                This vendor is a Material Third Party (MTP)
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                When checked, this vendor appears in the annual register snapshot and the
                full register sections 2–5 below become required for register / notification.
                Materiality classification is the firm&apos;s call — we don&apos;t auto-classify.
              </p>
            </div>
          </label>
        </section>

        {/* 2 Service provider */}
        <Section icon={Building2} title="2 Service provider">
          <Grid>
            <Field
              label="Contract reference (2.01)"
              name="contractRef"
              defaultValue={vendor.contractRef}
              required={isMTP}
              hint="Your firm's internal reference for this contractual arrangement."
            />
            <Field
              label="Legal name (2.02)"
              name="legalName"
              defaultValue={vendor.legalName}
              required={isMTP}
              hint="As stated in the contract — used consistently across notifications."
            />
            <Field
              label="Legal Entity Identifier · LEI (2.03)"
              name="legalEntityIdentifier"
              defaultValue={vendor.legalEntityIdentifier}
              maxLength={20}
              pattern="[A-Za-z0-9]{20}"
              hint="20 alphanumeric characters, e.g. 506700GE1G29325QX363."
            />
            <BoolToggle
              label="Outsourcing? (2.04)"
              name="isOutsourcing"
              defaultValue={vendor.isOutsourcing}
              yes="Outsourcing"
              no="Non-outsourcing"
            />
            <DropdownLargeList
              label="Type of service (2.05)"
              name="serviceTypeTaxonomy"
              defaultValue={vendor.serviceTypeTaxonomy}
              options={SERVICE_TYPE}
            />
            <Dropdown
              label="Cloud deployment (2.06)"
              name="cloudDeployment"
              defaultValue={vendor.cloudDeployment ?? ""}
              options={Object.entries(CLOUD_DEPLOYMENT_LABEL).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Field
              label="Supply-chain ranking (2.08)"
              name="supplyChainRanking"
              type="number"
              min={0}
              defaultValue={vendor.supplyChainRanking ?? ""}
              hint="Intra-group: 0 · Direct provider: 1 · Sub-contractor: 2..."
            />
            <Field
              label="Contract commencement (2.09)"
              name="contractStartAt"
              type="date"
              defaultValue={fmtDate(vendor.contractStartAt)}
            />
            <Field
              label="Service commencement (2.10)"
              name="serviceCommencedAt"
              type="date"
              defaultValue={fmtDate(vendor.serviceCommencedAt)}
            />
            <Field
              label="Renewal / end date (2.11)"
              name="contractEndAt"
              type="date"
              defaultValue={fmtDate(vendor.contractEndAt)}
            />
            <Field
              label="Notice period — vendor (2.12)"
              name="noticePeriodVendorDays"
              type="number"
              min={0}
              suffix="days"
              defaultValue={vendor.noticePeriodVendorDays ?? ""}
            />
            <Field
              label="Notice period — firm (2.13)"
              name="noticePeriodFirmDays"
              type="number"
              min={0}
              suffix="days"
              defaultValue={vendor.noticePeriodFirmDays ?? ""}
            />
            <DropdownLargeList
              label="Governing law (2.14)"
              name="governingLaw"
              defaultValue={vendor.governingLaw}
              options={COUNTRY}
              hint="Jurisdiction whose laws govern the contract."
            />
            <Field
              label="Annual contract value GBP (3.15)"
              name="contractAnnualValueGBP"
              type="number"
              min={0}
              prefix="£"
              defaultValue={vendor.contractAnnualValueGBP ?? ""}
            />
          </Grid>
          <TextArea
            label="Product / service description (2.07)"
            name="productServiceDescription"
            rows={3}
            defaultValue={vendor.productServiceDescription ?? ""}
          />
        </Section>

        {/* 3 Materiality + IBS */}
        <Section icon={ClipboardCheck} title="3 Materiality + IBS">
          <Grid>
            <Dropdown
              label="Reason for materiality (3.01)"
              name="materialityReason"
              defaultValue={vendor.materialityReason ?? ""}
              options={Object.entries(MATERIALITY_REASON_LABEL).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Field
              label="Materiality assessment date (3.02)"
              name="materialityAssessedAt"
              type="date"
              defaultValue={fmtDate(vendor.materialityAssessedAt)}
            />
            <DropdownLargeList
              label="Function category (3.03)"
              name="functionCategory"
              defaultValue={vendor.functionCategory}
              options={FUNCTION_CATEGORY}
            />
            <BoolToggle
              label="Supports core IBS element? (3.06)"
              name="supportsCoreIBSElement"
              defaultValue={vendor.supportsCoreIBSElement}
              onChange={setSupportsIBS}
              yes="Core"
              no="Non-core"
            />
            <DropdownLargeList
              label="Country data is stored (3.13)"
              name="countryDataStored"
              defaultValue={vendor.countryDataStored}
              options={COUNTRY}
            />
            <DropdownLargeList
              label="Country service delivered from (3.14)"
              name="countryServiceDeliveredFrom"
              defaultValue={vendor.countryServiceDeliveredFrom}
              options={COUNTRY}
            />
          </Grid>

          {vendor.ibsLinks.length > 0 && (
            <p className="text-[11px] text-soft">
              IBS links: {vendor.ibsLinks.map((l) => l.ibs.name).join(", ")}
            </p>
          )}

          {supportsIBS && (
            <Grid>
              <Field
                label="IT · PRA Safety & Soundness (3.07)"
                name="itPRASafetySoundness"
                defaultValue={vendor.itPRASafetySoundness}
              />
              <Field
                label="IT · PRA Financial Stability (3.08)"
                name="itPRAFinancialStability"
                defaultValue={vendor.itPRAFinancialStability}
              />
              <Field
                label="IT · PRA Policyholder Protection (3.09)"
                name="itPRAPolicyholderProtection"
                defaultValue={vendor.itPRAPolicyholderProtection}
              />
              <Field
                label="IT · FCA Client Harm (3.10)"
                name="itFCAClientHarm"
                defaultValue={vendor.itFCAClientHarm}
              />
              <Field
                label="IT · FCA Market Integrity (3.11)"
                name="itFCAMarketIntegrity"
                defaultValue={vendor.itFCAMarketIntegrity}
              />
              <Field
                label="IT · Bank as FMI Regulator (3.12)"
                name="itBankFMIRegulator"
                defaultValue={vendor.itBankFMIRegulator}
              />
            </Grid>
          )}
        </Section>

        {/* 4 Compliance + governance */}
        <Section icon={Gavel} title="4 Compliance + governance">
          <Grid>
            <Dropdown
              label="Complies with FCA/PRA/FMI rules? (4.10)"
              name="compliesWithRules"
              defaultValue={vendor.compliesWithRules ?? ""}
              options={Object.entries(COMPLIANCE_LABEL).map(([k, v]) => ({ value: k, label: v }))}
            />
            <BoolToggle
              label="Signed off by SMF / accountable person? (4.12)"
              name="smfSignedOff"
              defaultValue={vendor.smfSignedOff}
              yes="Yes"
              no="No"
            />
            <Field
              label="Governance committee (4.13)"
              name="governanceCommittee"
              defaultValue={vendor.governanceCommittee}
              hint="Used only when SMF sign-off = No."
            />
            <Field
              label="Governance approval date (4.14)"
              name="governanceApprovedAt"
              type="date"
              defaultValue={fmtDate(vendor.governanceApprovedAt)}
            />
          </Grid>
          <TextArea
            label="Assurance summary (4.11) — required when 'No' for compliance"
            name="assuranceSummary"
            rows={3}
            defaultValue={vendor.assuranceSummary ?? ""}
          />
        </Section>

        {/* 5 Exit + substitutability */}
        <Section icon={LogOut} title="5 Exit + substitutability">
          <Grid>
            <Dropdown
              label="Substitutability (5.01)"
              name="substitutability"
              defaultValue={vendor.substitutability ?? ""}
              options={Object.entries(SUBSTITUTABILITY_LABEL).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Dropdown
              label="Reintegration ability (5.02)"
              name="reintegrationAbility"
              defaultValue={vendor.reintegrationAbility ?? ""}
              options={Object.entries(REINTEGRATION_LABEL).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Dropdown
              label="Impact of discontinuing (5.03)"
              name="impactOfDiscontinuing"
              defaultValue={vendor.impactOfDiscontinuing ?? ""}
              options={Object.entries(IMPACT_DISCONTINUE_LABEL).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Grid>
        </Section>

        {canEdit && (
          <div className="flex justify-end border-t border-line pt-3">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500">
              <Save size={13} />
              Save MTP fields
            </button>
          </div>
        )}
      </form>

      {/* 4 Assessment history (out-of-form because it's append-only) */}
      <AssessmentsPanel vendorId={vendor.id} assessments={vendor.assessments} canEdit={canEdit} />
    </div>
  );
}

function ReadinessHeader({ readiness, isMTP }: { readiness: Readiness; isMTP: boolean }) {
  const pct = readiness.total === 0 ? 100 : Math.round((readiness.passed / readiness.total) * 100);
  const tone = readiness.isRegisterReady
    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
    : pct >= 70
      ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
      : "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30";

  if (!isMTP) {
    return (
      <section className="rounded-xl border border-dashed border-line bg-surface-1 p-4 text-sm text-muted">
        <p className="flex items-center gap-1.5 font-semibold text-ink">
          <ShieldQuestion size={14} />
          Not yet marked as Material Third Party
        </p>
        <p className="mt-1 text-[11px] text-soft">
          Tick the checkbox below to start filling out register sections 2–5.
        </p>
      </section>
    );
  }

  return (
    <section className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Layers size={14} />
            Register-ready: {readiness.passed} / {readiness.total} ({pct}%)
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Required fields for Annex 3 annual register + notification submission.
          </p>
        </div>
        <div className="flex h-2 w-48 overflow-hidden rounded-full bg-white/40">
          <div
            className={`h-full ${readiness.isRegisterReady ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-rose-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {!readiness.isRegisterReady && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-ink">
            Show the {readiness.total - readiness.passed} fields still missing
          </summary>
          <ul className="mt-2 space-y-0.5 text-[11px]">
            {readiness.checks
              .filter((c) => !c.ok)
              .map((c) => (
                <li key={c.id} className="flex items-center gap-1.5 text-rose-800 dark:text-rose-200">
                  <AlertOctagon size={10} />
                  <span className="font-mono">{c.ref}</span> {c.label}
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function AssessmentsPanel({
  vendorId,
  assessments,
  canEdit,
}: {
  vendorId: string;
  assessments: Assessment[];
  canEdit: boolean;
}) {
  const byKind = useMemo(() => {
    const map: Record<string, Assessment[]> = { RISK: [], AUDIT: [], FINANCIAL_DD: [], CYBER_DD: [] };
    for (const a of assessments) map[a.kind].push(a);
    return map;
  }, [assessments]);

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
      <header>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <FileSearch size={14} className="text-indigo-600 dark:text-indigo-300" />
          4 Assessment history
        </h2>
        <p className="mt-0.5 text-[11px] text-soft">
          Append-only. The most recent of each kind feeds the register / notification submission.
          Risk + audit + financial DD + cyber DD are all regulator-required.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["RISK", "AUDIT", "FINANCIAL_DD", "CYBER_DD"] as const).map((kind) => (
          <KindBlock
            key={kind}
            vendorId={vendorId}
            kind={kind}
            assessments={byKind[kind]}
            canEdit={canEdit}
          />
        ))}
      </div>
    </section>
  );
}

function KindBlock({
  vendorId,
  kind,
  assessments,
  canEdit,
}: {
  vendorId: string;
  kind: "RISK" | "AUDIT" | "FINANCIAL_DD" | "CYBER_DD";
  assessments: Assessment[];
  canEdit: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const latest = assessments[0]; // ordered by assessedAt desc

  return (
    <div className="rounded-md border border-line bg-surface-0 p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold text-ink">{ASSESSMENT_KIND_LABEL[kind]}</p>
        {latest ? (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${OUTCOME_TONE[latest.outcome]}`}
          >
            {ASSESSMENT_OUTCOME_LABEL[latest.outcome]}
          </span>
        ) : (
          <span className="text-[10px] text-soft">No record</span>
        )}
      </div>
      {latest && (
        <p className="mt-1 text-[10px] text-soft">
          Last: {latest.assessedAt.toISOString().slice(0, 10)}
          {latest.commentary && (
            <span className="block italic">&ldquo;{latest.commentary.slice(0, 90)}{latest.commentary.length > 90 ? "…" : ""}&rdquo;</span>
          )}
        </p>
      )}
      {assessments.length > 1 && (
        <details className="mt-1 text-[10px] text-soft">
          <summary className="cursor-pointer">+ {assessments.length - 1} earlier</summary>
          <ul className="mt-1 space-y-0.5">
            {assessments.slice(1).map((a) => (
              <li key={a.id} className="flex items-center justify-between">
                <span>
                  {a.assessedAt.toISOString().slice(0, 10)} · {ASSESSMENT_OUTCOME_LABEL[a.outcome]}
                </span>
                {canEdit && (
                  <form action={removeVendorAssessmentAction} className="inline">
                    <input type="hidden" name="vendorId" value={vendorId} />
                    <input type="hidden" name="assessmentId" value={a.id} />
                    <button className="text-soft hover:text-rose-700" title="Remove this assessment">
                      <Trash2 size={9} />
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
      {canEdit && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-line bg-surface-1 px-2 py-1 text-[10px] text-muted hover:border-line-strong hover:text-ink"
        >
          <Plus size={10} />
          Record assessment
        </button>
      )}
      {showForm && (
        <form
          action={async (fd) => {
            await addVendorAssessmentAction(fd);
            setShowForm(false);
          }}
          className="mt-2 space-y-1.5"
        >
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="kind" value={kind} />
          <input
            name="assessedAt"
            type="date"
            required
            className="w-full rounded border border-line-strong bg-surface-1 px-1.5 py-1 text-[10px]"
          />
          <select
            name="outcome"
            required
            defaultValue="SATISFACTORY"
            className="w-full rounded border border-line-strong bg-surface-1 px-1.5 py-1 text-[10px]"
          >
            {Object.entries(ASSESSMENT_OUTCOME_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <textarea
            name="commentary"
            rows={2}
            placeholder="Commentary (required if Non-satisfactory)"
            className="w-full rounded border border-line-strong bg-surface-1 px-1.5 py-1 text-[10px]"
          />
          <div className="flex justify-between gap-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[10px] text-soft hover:text-ink"
            >
              Cancel
            </button>
            <button className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white">
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const OUTCOME_TONE: Record<string, string> = {
  SATISFACTORY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  NON_SATISFACTORY: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  ONGOING: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  NOT_APPLICABLE: "bg-surface-2 text-muted",
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Icon size={14} className="text-indigo-600 dark:text-indigo-300" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  hint,
  prefix,
  suffix,
  defaultValue,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue"> & {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  defaultValue?: string | number | Date | null;
}) {
  const dv =
    defaultValue instanceof Date
      ? defaultValue.toISOString().slice(0, 10)
      : defaultValue !== null && defaultValue !== undefined
        ? String(defaultValue)
        : "";
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <div className="mt-1 flex items-center gap-1">
        {prefix && <span className="text-xs text-soft">{prefix}</span>}
        <input
          {...props}
          defaultValue={dv}
          className="w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
        />
        {suffix && <span className="text-xs text-soft">{suffix}</span>}
      </div>
      {hint && <span className="mt-0.5 block text-[10px] text-soft">{hint}</span>}
    </label>
  );
}

function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <textarea
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
      />
    </label>
  );
}

function Dropdown({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
      >
        <option value="">— pick —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-0.5 block text-[10px] text-soft">{hint}</span>}
    </label>
  );
}

function DropdownLargeList({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  options: readonly string[];
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
      >
        <option value="">— pick —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {hint && <span className="mt-0.5 block text-[10px] text-soft">{hint}</span>}
    </label>
  );
}

function BoolToggle({
  label,
  name,
  defaultValue,
  yes,
  no,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue: boolean | null;
  yes: string;
  no: string;
  onChange?: (v: boolean | null) => void;
}) {
  const [value, setValue] = useState<boolean | null>(defaultValue);
  return (
    <div className="block text-sm">
      <span className="text-ink">{label}</span>
      <div className="mt-1 flex gap-1.5">
        {[
          { v: true, label: yes },
          { v: false, label: no },
        ].map((o) => (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => {
              const next = value === o.v ? null : o.v;
              setValue(next);
              onChange?.(next);
            }}
            className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${
              value === o.v
                ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                : "border-line bg-surface-1 text-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value === null ? "" : String(value)} />
    </div>
  );
}

function fmtDate(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString().slice(0, 10) : undefined;
}
