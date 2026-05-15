"use client";

import { useState } from "react";
import { toast } from "sonner";
import { INJECT_TEMPLATES, type InjectTemplate } from "@/lib/inject-templates";
import { addInjectAction } from "@/app/actions/scenarios";
import { Input, Textarea, FormField } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";

type Props = {
  scenarioId: string;
  /** Next available inject number, suggested as the default. */
  nextInjectNo: number;
  /** Role titles already on exercise rosters — used by the validator. */
  knownRoles: string[];
  /** When provided, the form wraps the server action with a success toast
   *  + this callback (used by the modal wrapper to auto-close). */
  onSuccess?: () => void;
  /** Hide the outer dashed card chrome — the modal already supplies its own. */
  bare?: boolean;
};

export default function InjectComposer({ scenarioId, nextInjectNo, knownRoles, onSuccess, bare = false }: Props) {
  const [picked, setPicked] = useState<InjectTemplate | null>(null);
  const [injectNo, setInjectNo] = useState(nextInjectNo);
  const [scheduledTime, setScheduledTime] = useState("00:30");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [senderRoleTitle, setSenderRoleTitle] = useState("");
  const [toRoles, setToRoles] = useState("");
  const [ccRoles, setCcRoles] = useState("");
  const [relation, setRelation] = useState("");

  const applyTemplate = (t: InjectTemplate) => {
    setPicked(t);
    setSummary(t.summary);
    setDescription(t.description);
    setSenderRoleTitle(t.senderRoleTitle);
    setToRoles(t.toRoleTitles.join(", "));
    setCcRoles(t.ccRoleTitles.join(", "));
  };

  const reset = () => {
    setPicked(null);
    setSummary("");
    setDescription("");
    setSenderRoleTitle("");
    setToRoles("");
    setCcRoles("");
    setRelation("");
  };

  const toList = parseRoles(toRoles);
  const ccList = parseRoles(ccRoles);
  const knownLower = new Set(knownRoles.map((r) => r.toLowerCase()));
  const unknownTo = toList.filter((r) => knownLower.size > 0 && !knownLower.has(r.toLowerCase()));
  const unknownCc = ccList.filter((r) => knownLower.size > 0 && !knownLower.has(r.toLowerCase()));

  const errors: string[] = [];
  if (toList.length === 0) errors.push("Nobody will see this — add at least one role on To:");
  if (!senderRoleTitle) errors.push("No sender role — inbox will show 'from —'");
  if (unknownTo.length > 0)
    errors.push(`Unknown To role${unknownTo.length === 1 ? "" : "s"}: ${unknownTo.join(", ")}`);
  if (unknownCc.length > 0)
    errors.push(`Unknown Cc role${unknownCc.length === 1 ? "" : "s"}: ${unknownCc.join(", ")}`);

  // When `bare`, the modal supplies its own header + chrome — render
  // without the outer card and without a duplicate title.
  const outerCls = bare
    ? "space-y-4"
    : "space-y-4 rounded-lg border border-dashed border-line-strong bg-surface-1 p-4";

  const formAction = onSuccess
    ? async (fd: FormData) => {
        try {
          await addInjectAction(fd);
          toast.success(`Inject #${injectNo} added`, {
            description: summary || undefined,
          });
          onSuccess();
        } catch {
          toast.error("Couldn't add the inject — please try again.");
        }
      }
    : addInjectAction;

  return (
    <div className={outerCls}>
      {!bare && (
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">Add an inject</h3>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Clear
          </Button>
        </div>
      )}
      {bare && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Clear form
          </Button>
        </div>
      )}

      {/* Template chips */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Or start from a template
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {INJECT_TEMPLATES.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => applyTemplate(t)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                picked?.slug === t.slug
                  ? "border-indigo-400 bg-indigo-500/15 text-indigo-700 dark:text-indigo-200"
                  : "border-line bg-surface-1 text-muted hover:border-line-strong hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span className="text-[9px] uppercase opacity-60">{t.category}</span>{" "}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column composer + preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="scenarioId" value={scenarioId} />

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Inject #" required>
              <Input
                name="injectNo"
                type="number"
                min={1}
                required
                value={injectNo}
                onChange={(e) => setInjectNo(Number(e.target.value) || 1)}
              />
            </FormField>
            <FormField label="D-Day time (HH:MM)" required>
              <Input
                name="scheduledTime"
                required
                pattern="[0-9]{2}:[0-9]{2}"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="00:30"
              />
            </FormField>
          </div>

          <FormField label="Summary" required>
            <Input
              name="summary"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-line summary (shown in the participant inbox)"
            />
          </FormField>

          <FormField label="Description" required hint="What the participant will read in full">
            <Textarea
              name="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <FormField label="From (sender role)" hint='e.g. "CTO", "Sn.TPM", "Comms Lead"'>
            <Input
              name="senderRoleTitle"
              value={senderRoleTitle}
              onChange={(e) => setSenderRoleTitle(e.target.value)}
            />
          </FormField>

          <FormField label="To" required hint="Comma-separated role titles">
            <Input
              name="toRoleTitles"
              value={toRoles}
              onChange={(e) => setToRoles(e.target.value)}
              placeholder='e.g. "CTO, Sn.TPM, ISM"'
            />
          </FormField>

          <FormField label="Cc" hint="Comma-separated role titles">
            <Input
              name="ccRoleTitles"
              value={ccRoles}
              onChange={(e) => setCcRoles(e.target.value)}
              placeholder='e.g. "CEO, CRO"'
            />
          </FormField>

          <FormField label="Relation" hint="Optional — e.g. 'follows from Event #3'">
            <Input
              name="relation"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
            />
          </FormField>

          <Button variant="primary" size="md" type="submit" className="w-full">
            Add inject
          </Button>
        </form>

        {/* Live preview-as-participant */}
        <div className="space-y-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Preview as participant
          </div>
          <div className="rounded-md border border-rose-300 bg-rose-50/50 p-3 dark:border-rose-700 dark:bg-rose-950/30">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <Pill variant="mono" tone="soft" size="sm" className="font-mono">
                {scheduledTime || "--:--"}
              </Pill>
              <Pill variant="info" tone="soft" size="sm">
                INJECT
              </Pill>
              <Pill variant="critical" tone="solid" size="sm">
                unread
              </Pill>
              {senderRoleTitle && (
                <span className="text-muted">from {senderRoleTitle}</span>
              )}
            </div>
            <div className="mt-2 text-sm font-medium text-ink">
              {summary || <span className="text-soft italic">(summary)</span>}
            </div>
            <div className="mt-1 text-[11px] text-muted">
              <span className="font-semibold">To:</span>{" "}
              {toList.length === 0 ? (
                <em className="text-rose-600 dark:text-rose-400">no recipients</em>
              ) : (
                toList.join(", ")
              )}
              {ccList.length > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold">Cc:</span> {ccList.join(", ")}
                </>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-ink">
              {description || <span className="text-soft italic">(description)</span>}
            </p>
          </div>

          {errors.length > 0 && (
            <ul className="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              {errors.map((e, i) => (
                <li key={i}>· {e}</li>
              ))}
            </ul>
          )}
          {errors.length === 0 && summary && description && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
              ✓ Looks good. {toList.length} recipient{toList.length === 1 ? "" : "s"} on To:.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseRoles(s: string): string[] {
  return s
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}
