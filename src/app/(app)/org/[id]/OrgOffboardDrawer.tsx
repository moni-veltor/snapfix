"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  Crown,
  ShieldCheck,
  Sparkles,
  UserMinus,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { offboardMemberAction } from "@/app/actions/org";

type Seat = {
  id: string;
  abbreviation: string;
  title: string;
  isSMF: boolean;
  isExecutive: boolean;
  /** Suggested replacement if the seat has a named deputy. */
  suggestedReplacementUserId: string | null;
  suggestedReplacementName: string | null;
};

type OwnedIBS = {
  id: string;
  code: string;
  name: string;
};

type Candidate = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  userId: string;
  userName: string;
  seats: Seat[];
  ownedIBSs: OwnedIBS[];
  openActionItemsCount: number;
  candidates: Candidate[];
};

type Step = "review" | "reassign" | "confirm";

/**
 * Guided offboard. Three steps:
 *  1. Review the impact of removing this person.
 *  2. Reassign each seat / IBS (or accept the deputy auto-suggestion).
 *  3. Confirm — fires offboardMemberAction in one transaction.
 *
 * Replaces the bare ConfirmButton that left orgs with vacated seats
 * + orphaned IBSs after a removal.
 */
export default function OrgOffboardDrawer({
  userId,
  userName,
  seats,
  ownedIBSs,
  openActionItemsCount,
  candidates,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("review");
  const [seatChoices, setSeatChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      seats.map((s) => [s.id, s.suggestedReplacementUserId ?? ""]),
    ),
  );
  const [ibsChoices, setIbsChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(ownedIBSs.map((i) => [i.id, ""])),
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const totalImpact =
    seats.length + ownedIBSs.length + openActionItemsCount;
  const vacatingCount = seats.filter((s) => !seatChoices[s.id]).length;
  const orphanedIBSCount = ownedIBSs.filter((i) => !ibsChoices[i.id]).length;

  function close() {
    setOpen(false);
    setStep("review");
  }

  function submit() {
    const fd = new FormData();
    fd.set("userId", userId);
    for (const [roleId, holder] of Object.entries(seatChoices)) {
      fd.set(`reassignSeat:${roleId}`, holder);
    }
    for (const [ibsId, owner] of Object.entries(ibsChoices)) {
      fd.set(`reassignIBS:${ibsId}`, owner);
    }
    startTransition(async () => {
      await offboardMemberAction(fd);
      close();
      router.push("/org");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-100 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-200"
      >
        <UserMinus size={11} />
        Offboard from org
      </button>

      <Drawer
        open={open}
        onClose={close}
        title={`Offboard ${userName}`}
        subtitle="Reassign their seats + IBSs, then remove from the org."
        width="md"
      >
        <div className="border-b border-line bg-surface-1 px-5 pt-3">
          <ol className="flex items-center gap-2 text-[11px]">
            <StepDot label="Review" active={step === "review"} done={step !== "review"} />
            <ChevronRight size={11} className="text-soft" />
            <StepDot
              label="Reassign"
              active={step === "reassign"}
              done={step === "confirm"}
            />
            <ChevronRight size={11} className="text-soft" />
            <StepDot label="Confirm" active={step === "confirm"} done={false} />
          </ol>
        </div>

        <div className="p-5">
          {step === "review" && (
            <ReviewStep
              userName={userName}
              seats={seats}
              ownedIBSs={ownedIBSs}
              openActionItemsCount={openActionItemsCount}
            />
          )}
          {step === "reassign" && (
            <ReassignStep
              seats={seats}
              ownedIBSs={ownedIBSs}
              candidates={candidates}
              seatChoices={seatChoices}
              setSeatChoices={setSeatChoices}
              ibsChoices={ibsChoices}
              setIbsChoices={setIbsChoices}
            />
          )}
          {step === "confirm" && (
            <ConfirmStep
              userName={userName}
              vacatingCount={vacatingCount}
              orphanedIBSCount={orphanedIBSCount}
              openActionItemsCount={openActionItemsCount}
            />
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line bg-surface-1 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              if (step === "confirm") setStep("reassign");
              else if (step === "reassign") setStep("review");
              else close();
            }}
            className="rounded-md px-3 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink"
          >
            {step === "review" ? "Cancel" : "Back"}
          </button>
          {step !== "confirm" ? (
            <button
              type="button"
              onClick={() => setStep(step === "review" ? "reassign" : "confirm")}
              disabled={totalImpact === 0 && step === "review"}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {step === "review" && totalImpact === 0
                ? "Nothing to reassign — go to confirm"
                : "Next"}
              <ChevronRight size={11} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {pending ? "Removing…" : "Reassign + remove"}
              <UserMinus size={11} />
            </button>
          )}
        </footer>
      </Drawer>
    </>
  );
}

function StepDot({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  const cls = active
    ? "bg-slate-900 text-white dark:bg-indigo-500"
    : done
      ? "bg-emerald-500 text-white"
      : "bg-surface-2 text-soft";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Step bodies ─────────────────────────────────────────────────────────

function ReviewStep({
  userName,
  seats,
  ownedIBSs,
  openActionItemsCount,
}: {
  userName: string;
  seats: Seat[];
  ownedIBSs: OwnedIBS[];
  openActionItemsCount: number;
}) {
  const total = seats.length + ownedIBSs.length + openActionItemsCount;
  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">
        Removing <span className="font-semibold text-ink">{userName}</span> will affect:
      </p>

      <ul className="space-y-2">
        <ImpactRow
          label={`${seats.length} IMT seat${seats.length === 1 ? "" : "s"} default-held`}
          tone={seats.length > 0 ? "warn" : "ok"}
          detail={
            seats.length > 0
              ? `Including ${seats.filter((s) => s.isSMF).length} SMF seat${
                  seats.filter((s) => s.isSMF).length === 1 ? "" : "s"
                }.`
              : "No standing seats to vacate."
          }
        />
        <ImpactRow
          label={`${ownedIBSs.length} IBS${ownedIBSs.length === 1 ? "" : "s"} process-owned`}
          tone={ownedIBSs.length > 0 ? "warn" : "ok"}
          detail={
            ownedIBSs.length > 0
              ? "Each needs a replacement owner before they go unmanaged."
              : "No IBS ownership to transfer."
          }
        />
        <ImpactRow
          label={`${openActionItemsCount} open action item${openActionItemsCount === 1 ? "" : "s"} assigned`}
          tone={openActionItemsCount > 0 ? "warn" : "ok"}
          detail={
            openActionItemsCount > 0
              ? "Action items stay open; reassign them on the action-items page after offboard."
              : "No open actions assigned."
          }
        />
      </ul>

      {total === 0 && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          Clean removal — nothing to reassign.
        </div>
      )}
    </div>
  );
}

function ReassignStep({
  seats,
  ownedIBSs,
  candidates,
  seatChoices,
  setSeatChoices,
  ibsChoices,
  setIbsChoices,
}: {
  seats: Seat[];
  ownedIBSs: OwnedIBS[];
  candidates: Candidate[];
  seatChoices: Record<string, string>;
  setSeatChoices: (v: Record<string, string>) => void;
  ibsChoices: Record<string, string>;
  setIbsChoices: (v: Record<string, string>) => void;
}) {
  if (seats.length === 0 && ownedIBSs.length === 0) {
    return (
      <p className="text-sm text-muted">Nothing to reassign — go to confirm.</p>
    );
  }
  return (
    <div className="space-y-5 text-sm">
      {seats.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft">
            IMT seats
          </h3>
          <ul className="space-y-2">
            {seats.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-0 p-3"
              >
                {s.isSMF ? (
                  <Crown size={11} className="text-amber-600 dark:text-amber-300" />
                ) : (
                  <ShieldCheck size={11} className="text-soft" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    <span className="font-mono text-[11px] text-soft">{s.abbreviation}</span>{" "}
                    {s.title}
                  </p>
                  {s.suggestedReplacementName && (
                    <p className="text-[10px] text-soft">
                      Deputy {s.suggestedReplacementName} pre-selected.
                    </p>
                  )}
                </div>
                <select
                  value={seatChoices[s.id] ?? ""}
                  onChange={(e) =>
                    setSeatChoices({ ...seatChoices, [s.id]: e.target.value })
                  }
                  className="rounded-md border border-line-strong bg-surface-0 px-2 py-1 text-xs"
                >
                  <option value="">Vacate (leave unassigned)</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? c.email}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ownedIBSs.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft">
            IBSs owned
          </h3>
          <ul className="space-y-2">
            {ownedIBSs.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-0 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    <span className="font-mono text-[11px] text-soft">{i.code}</span>{" "}
                    {i.name}
                  </p>
                </div>
                <select
                  value={ibsChoices[i.id] ?? ""}
                  onChange={(e) =>
                    setIbsChoices({ ...ibsChoices, [i.id]: e.target.value })
                  }
                  className="rounded-md border border-line-strong bg-surface-0 px-2 py-1 text-xs"
                >
                  <option value="">Leave unassigned</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? c.email}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ConfirmStep({
  userName,
  vacatingCount,
  orphanedIBSCount,
  openActionItemsCount,
}: {
  userName: string;
  vacatingCount: number;
  orphanedIBSCount: number;
  openActionItemsCount: number;
}) {
  const warnings = vacatingCount + orphanedIBSCount > 0;
  return (
    <div className="space-y-4 text-sm">
      <p className="text-ink">
        Ready to remove <span className="font-semibold">{userName}</span> from the
        organisation.
      </p>

      <ul className="space-y-1.5 text-xs">
        {vacatingCount > 0 && (
          <li className="flex items-start gap-2 rounded-md bg-amber-50 px-2 py-1.5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle size={11} className="mt-0.5" />
            {vacatingCount} seat{vacatingCount === 1 ? "" : "s"} will be vacated — fill them in the role catalogue.
          </li>
        )}
        {orphanedIBSCount > 0 && (
          <li className="flex items-start gap-2 rounded-md bg-amber-50 px-2 py-1.5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle size={11} className="mt-0.5" />
            {orphanedIBSCount} IBS{orphanedIBSCount === 1 ? "" : "s"} will have no process owner.
          </li>
        )}
        {openActionItemsCount > 0 && (
          <li className="flex items-start gap-2 rounded-md bg-amber-50 px-2 py-1.5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle size={11} className="mt-0.5" />
            {openActionItemsCount} open action item{openActionItemsCount === 1 ? "" : "s"} stay open — reassign on /action-items.
          </li>
        )}
        {!warnings && openActionItemsCount === 0 && (
          <li className="flex items-start gap-2 rounded-md bg-emerald-50 px-2 py-1.5 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            <Sparkles size={11} className="mt-0.5" />
            Everything reassigned — clean removal.
          </li>
        )}
      </ul>

      <p className="text-[11px] text-muted">
        The user will lose access immediately. They can be re-invited later.
      </p>
    </div>
  );
}

function ImpactRow({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "ok" | "warn";
}) {
  const dot = tone === "ok" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <li className="flex items-start gap-2 rounded-md border border-line bg-surface-0 p-3">
      <span className={`mt-1 block h-2 w-2 flex-none rounded-full ${dot}`} />
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-[11px] text-muted">{detail}</p>
      </div>
    </li>
  );
}

