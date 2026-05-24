import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { requireOrgRole } from "@/lib/auth";
import PageHero from "@/components/ui/PageHero";
import { createRunbookAction } from "@/app/actions/runbooks";

export const metadata = { title: "New runbook — SnapFix" };

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "CYBER", label: "Cyber" },
  { value: "RANSOMWARE", label: "Ransomware" },
  { value: "CLOUD_REGION_OUTAGE", label: "Cloud region outage" },
  { value: "VENDOR_FAILURE", label: "Vendor failure" },
  { value: "BCP_ACTIVATION", label: "BCP activation" },
  { value: "DATA_INCIDENT", label: "Data incident" },
  { value: "PEOPLE_DISRUPTION", label: "People disruption" },
  { value: "REGULATORY_NOTIFICATION", label: "Regulatory notification" },
  { value: "OTHER", label: "Other" },
];

export default async function NewRunbookPage() {
  await requireOrgRole("OWNER", "ADMIN");
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="New runbook"
        icon={BookOpen}
        title="Create runbook"
        pitch="Steps land next, on the detail page"
        actions={
          <Link
            href="/runbooks"
            className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
          >
            <ArrowLeft size={14} />
            Back to runbooks
          </Link>
        }
      />

      <form
        action={createRunbookAction}
        className="space-y-5 rounded-xl border border-line bg-surface-1 p-6"
      >
        <Field
          label="Title"
          name="title"
          required
          placeholder="e.g. Ransomware response"
          autoFocus
        />

        <Field label="Owner role" name="ownerRoleTitle" placeholder="e.g. CISO, CRO" />

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
            Category
          </label>
          <select
            name="category"
            defaultValue="OTHER"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="One paragraph: when this runbook fires, what it covers, who walks it." aria-label="One paragraph: when this runbook fires, what it covers, who walks it."
          />
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <p className="text-[11px] text-soft">
            Stays as DRAFT until you publish. Steps + linking come next.
          </p>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Create runbook
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required = false,
  autoFocus = false,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </label>
      <input
        type="text"
        name={name}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder} aria-label={placeholder}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}
