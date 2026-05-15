"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addEventAction } from "@/app/actions/scenarios";
import { Input, Textarea, FormField } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";

type Props = {
  scenarioId: string;
  /** Next available event number, used as the default. */
  nextEventNo: number;
  /** Role titles already on exercise rosters — used by the validator. */
  knownRoles: string[];
  /** When provided, the form wraps the server action with a success toast +
   *  this callback (used by the modal wrapper to auto-close). */
  onSuccess?: () => void;
  /** Hide the dashed-card chrome — modal supplies its own. */
  bare?: boolean;
};

/**
 * Authoring surface for scenario events — the scheduled beats of the MSEL.
 * Same pattern as InjectComposer (validator + preview-as-participant) but
 * tighter; events are simpler and don't have a template library yet.
 */
export default function EventComposer({
  scenarioId,
  nextEventNo,
  knownRoles,
  onSuccess,
  bare = false,
}: Props) {
  const [eventNo, setEventNo] = useState(nextEventNo);
  const [scheduledTime, setScheduledTime] = useState("00:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [senderRoleTitle, setSenderRoleTitle] = useState("");
  const [toRoles, setToRoles] = useState("");
  const [ccRoles, setCcRoles] = useState("");
  const [expectedActions, setExpectedActions] = useState("");
  const [objectives, setObjectives] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setSenderRoleTitle("");
    setToRoles("");
    setCcRoles("");
    setExpectedActions("");
    setObjectives("");
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

  const outerCls = bare
    ? "space-y-4"
    : "space-y-4 rounded-lg border border-dashed border-line-strong bg-surface-1 p-4";

  const formAction = onSuccess
    ? async (fd: FormData) => {
        try {
          await addEventAction(fd);
          toast.success(`Event #${eventNo} added`, {
            description: title || undefined,
          });
          onSuccess();
        } catch {
          toast.error("Couldn't add the event — please try again.");
        }
      }
    : addEventAction;

  return (
    <div className={outerCls}>
      <div className="flex items-baseline justify-between gap-3">
        {!bare && <h3 className="text-sm font-semibold text-ink">Add an event</h3>}
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Clear
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="scenarioId" value={scenarioId} />

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Event #" required>
              <Input
                name="eventNo"
                type="number"
                min={1}
                required
                value={eventNo}
                onChange={(e) => setEventNo(Number(e.target.value) || 1)}
              />
            </FormField>
            <FormField label="D-Day time (HH:MM)" required>
              <Input
                name="scheduledTime"
                required
                pattern="[0-9]{2}:[0-9]{2}"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="00:00"
              />
            </FormField>
          </div>

          <FormField label="Title" required>
            <Input
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="One-line title (shown in the participant inbox)"
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

          <FormField label="Cc" hint="Comma-separated role titles (optional)">
            <Input
              name="ccRoleTitles"
              value={ccRoles}
              onChange={(e) => setCcRoles(e.target.value)}
              placeholder='e.g. "CEO, CRO"'
            />
          </FormField>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Expected actions" hint="One per line — surfaced in the facilitator view">
              <Textarea
                name="expectedActions"
                rows={3}
                value={expectedActions}
                onChange={(e) => setExpectedActions(e.target.value)}
              />
            </FormField>
            <FormField label="Objectives" hint="One per line — what this beat tests">
              <Textarea
                name="objectives"
                rows={3}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
              />
            </FormField>
          </div>

          <Button variant="primary" size="md" type="submit" className="w-full">
            Add event
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
              <Pill variant="critical" tone="soft" size="sm">
                EVENT
              </Pill>
              <Pill variant="critical" tone="solid" size="sm">
                unread
              </Pill>
              {senderRoleTitle && (
                <span className="text-muted">from {senderRoleTitle}</span>
              )}
            </div>
            <div className="mt-2 text-sm font-medium text-ink">
              {title || <span className="text-soft italic">(title)</span>}
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
          {errors.length === 0 && title && description && (
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
