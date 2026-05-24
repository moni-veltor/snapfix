"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Crown,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { assignMemberAction, removeExerciseMemberAction } from "@/app/actions/exercises";
import {
  importRosterCsvAction,
  inviteVendorParticipantAction,
  removeVendorParticipantAction,
  setCoFacilitatorAction,
  setDeputyAction,
  setParticipantScopeAction,
} from "@/app/actions/exercise-wizard";

type OrgUser = { id: string; name: string | null; email: string };
type OrgRole = {
  id: string;
  abbreviation: string;
  title: string;
  isSMF: boolean;
  defaultHolderId: string | null;
};
type OrgVendor = {
  id: string;
  name: string;
  tier: string;
  isDoraCritical: boolean;
  contactName: string | null;
  contactEmail: string | null;
};
type Participant = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleTitle: string;
  exerciseRole: string;
  deputyParticipantId: string | null;
  isObserver: boolean;
  isStakeholder: boolean;
};
type VendorParticipant = {
  id: string;
  vendorName: string;
  contactName: string;
  contactEmail: string;
  scope: "OBSERVER_ONLY" | "RESPONDER_ROLE" | "FULL_PARTICIPANT";
};

type Props = {
  exerciseId: string;
  orgUsers: OrgUser[];
  orgRoles: OrgRole[];
  orgVendors: OrgVendor[];
  participants: Participant[];
  vendorParticipants: VendorParticipant[];
  facilitatorId: string | null;
  coFacilitatorId: string | null;
  /** Participant ids on other exercises within the next 7 days — for conflict warning. */
  conflictUserIds: Set<string>;
};

export default function StepTeam({
  exerciseId,
  orgUsers,
  orgRoles,
  orgVendors,
  participants,
  vendorParticipants,
  facilitatorId,
  coFacilitatorId,
  conflictUserIds,
}: Props) {
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

  // Build occupancy map: roleAbbr → participant
  const occupants = useMemo(() => {
    const map = new Map<string, Participant>();
    for (const p of participants) {
      map.set(p.roleTitle, p);
    }
    return map;
  }, [participants]);

  const conflictParticipants = participants.filter((p) => conflictUserIds.has(p.userId));

  const smfRoles = orgRoles.filter((r) => r.isSMF);
  const unfilledSMFs = smfRoles.filter((r) => !occupants.has(r.abbreviation));

  return (
    <div className="space-y-6">
      {/* ─── Roster sanity sidebar (mobile: stacked; desktop: inline) ─── */}
      <RosterSanity
        participantCount={participants.length}
        smfTotal={smfRoles.length}
        smfFilled={smfRoles.length - unfilledSMFs.length}
        deputiesAssigned={participants.filter((p) => p.deputyParticipantId).length}
        conflicts={conflictParticipants.length}
      />

      {/* ─── Co-facilitator picker ───────────────────────────────────── */}
      <Section
        icon={Crown}
        title="Backup facilitator"
        hint="Single-facilitator design is anti-resilience. Name a co-facilitator who can take over if the primary is unavailable."
      >
        <form action={setCoFacilitatorAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <label className="flex-1">
            <span className="block text-[11px] text-muted">Co-facilitator</span>
            <select
              name="coFacilitatorId"
              defaultValue={coFacilitatorId ?? ""}
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
            >
              <option value="">— none —</option>
              {orgUsers
                .filter((u) => u.id !== facilitatorId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
            </select>
          </label>
          <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Save
          </button>
        </form>
      </Section>

      {/* ─── Seat map ─────────────────────────────────────────────────── */}
      <Section icon={Users} title="IMT seat map" hint="Click an empty seat to assign someone. SMF seats unfilled show as critical.">
        {orgRoles.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-surface-0 p-3 text-[11px] text-muted">
            No IMT role catalogue yet. Set up roles in{" "}
            <Link href="/templates" className="font-medium text-indigo-600 underline">
              Templates
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {orgRoles.map((r) => {
              const occupant = occupants.get(r.abbreviation);
              const conflict = occupant && conflictUserIds.has(occupant.userId);
              const isUnfilledSMF = !occupant && r.isSMF;
              return (
                <SeatCard
                  key={r.id}
                  exerciseId={exerciseId}
                  role={r}
                  occupant={occupant}
                  orgUsers={orgUsers}
                  participants={participants}
                  isCritical={isUnfilledSMF}
                  hasConflict={!!conflict}
                />
              );
            })}
          </div>
        )}
      </Section>

      {/* ─── Observer + stakeholder scopes ────────────────────────────── */}
      <Section
        icon={Users}
        title="Observer / stakeholder access"
        hint="Observers see everything read-only (no decisions, no comms send). Stakeholders see only the executive summary — status + closure + score + cost. Layered on top of the participant's role, not a replacement."
      >
        {participants.length === 0 ? (
          <p className="text-[11px] text-soft">Assign people in the seat map above first.</p>
        ) : (
          <ul className="space-y-1.5">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-0 p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink">{p.userName}</p>
                  <p className="text-[10px] text-soft">
                    <span className="font-mono">{p.roleTitle}</span> · {p.exerciseRole}
                  </p>
                </div>
                <form
                  action={setParticipantScopeAction}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="exerciseId" value={exerciseId} />
                  <input type="hidden" name="participantId" value={p.id} />
                  <label className="inline-flex items-center gap-1 text-[10px] text-muted">
                    <input
                      type="checkbox"
                      name="isObserver"
                      defaultChecked={p.isObserver}
                    />
                    Observer
                  </label>
                  <label className="inline-flex items-center gap-1 text-[10px] text-muted">
                    <input
                      type="checkbox"
                      name="isStakeholder"
                      defaultChecked={p.isStakeholder}
                    />
                    Stakeholder
                  </label>
                  <button className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-indigo-500">
                    Save
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ─── Vendor participants ──────────────────────────────────────── */}
      <Section
        icon={Building2}
        title="Third-party / vendor participants"
        hint="Critical vendors who need to test their incident response alongside yours. Each gets a scoped, time-bounded access link."
      >
        {vendorParticipants.length > 0 && (
          <ul className="space-y-2">
            {vendorParticipants.map((vp) => (
              <li
                key={vp.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-0 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{vp.vendorName}</p>
                  <p className="text-[11px] text-muted">
                    {vp.contactName} · {vp.contactEmail} ·{" "}
                    <span className="font-semibold uppercase tracking-wider">{vp.scope.replace("_", " ")}</span>
                  </p>
                </div>
                <form action={removeVendorParticipantAction}>
                  <input type="hidden" name="exerciseId" value={exerciseId} />
                  <input type="hidden" name="vendorParticipantId" value={vp.id} />
                  <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-soft hover:text-rose-700">
                    <Trash2 size={11} />
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {!showVendorForm ? (
          <button
            type="button"
            onClick={() => setShowVendorForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line bg-surface-0 px-3 py-2 text-sm text-muted hover:border-line-strong hover:text-ink"
          >
            <Plus size={12} />
            Invite a vendor
          </button>
        ) : orgVendors.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-surface-0 p-3 text-[11px] text-muted">
            No vendors in the register yet.{" "}
            <Link href="/vendors" className="font-medium text-indigo-600 underline">
              Add one
            </Link>{" "}
            first.
          </p>
        ) : (
          <form
            action={async (fd) => {
              await inviteVendorParticipantAction(fd);
              setShowVendorForm(false);
            }}
            className="grid gap-2 rounded-md border border-line bg-surface-0 p-3 sm:grid-cols-2"
          >
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <label className="text-[11px]">
              <span className="text-muted">Vendor</span>
              <select
                name="vendorId"
                required
                defaultValue=""
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              >
                <option value="" disabled>
                  — pick —
                </option>
                {orgVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.isDoraCritical ? " (DORA critical)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px]">
              <span className="text-muted">Scope</span>
              <select
                name="scope"
                required
                defaultValue="OBSERVER_ONLY"
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              >
                <option value="OBSERVER_ONLY">Observer only</option>
                <option value="RESPONDER_ROLE">Responder role (sees own injects)</option>
                <option value="FULL_PARTICIPANT">Full participant</option>
              </select>
            </label>
            <label className="text-[11px]">
              <span className="text-muted">Contact name</span>
              <input
                type="text"
                name="contactName"
                required
                maxLength={120}
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-[11px]">
              <span className="text-muted">Contact email</span>
              <input
                type="email"
                name="contactEmail"
                required
                className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowVendorForm(false)}
                className="rounded-md px-2 py-1 text-[11px] text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
                <UserPlus size={11} />
                Send scoped invite
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* ─── CSV roster import ────────────────────────────────────────── */}
      <Section icon={Upload} title="Bulk import roster" hint="One row per participant: email,roleTitle[,teamName]. Users not in the org are skipped.">
        {!showCsvImport ? (
          <button
            type="button"
            onClick={() => setShowCsvImport(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line bg-surface-0 px-3 py-2 text-sm text-muted hover:border-line-strong hover:text-ink"
          >
            <Upload size={12} />
            Paste CSV
          </button>
        ) : (
          <form
            action={async (fd) => {
              await importRosterCsvAction(fd);
              setShowCsvImport(false);
            }}
            className="space-y-2"
          >
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <textarea
              name="csv"
              required
              rows={6}
              placeholder="email,roleTitle,teamName&#10;jane.smith@example.com,CRO,Incident Management&#10;tom.jones@example.com,CTO,Tech Recovery" aria-label="email,roleTitle,teamName&#10;jane.smith@example.com,CRO,Incident Management&#10;tom.jones@example.com,CTO,Tech Recovery"
              className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCsvImport(false)}
                className="rounded-md px-2 py-1 text-[11px] text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
                <Upload size={11} />
                Import
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <Link
          href={`/exercises/new?step=2&id=${exerciseId}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
        >
          <ArrowLeft size={14} />
          Back to Scenarios
        </Link>
        <Link
          href={`/exercises/new?step=4&id=${exerciseId}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500"
        >
          Next: Injects
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
      <header>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Icon size={14} className="text-indigo-600 dark:text-indigo-300" />
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-[11px] text-soft">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function RosterSanity({
  participantCount,
  smfTotal,
  smfFilled,
  deputiesAssigned,
  conflicts,
}: {
  participantCount: number;
  smfTotal: number;
  smfFilled: number;
  deputiesAssigned: number;
  conflicts: number;
}) {
  const smfPct = smfTotal === 0 ? 100 : Math.round((smfFilled / smfTotal) * 100);
  return (
    <section className="grid gap-3 rounded-xl border border-line bg-surface-1 p-5 sm:grid-cols-4">
      <Tile icon={Users} label="On roster" value={String(participantCount)} />
      <Tile
        icon={ShieldCheck}
        label="SMF seats filled"
        value={`${smfFilled}/${smfTotal}`}
        tone={smfPct === 100 ? "ok" : smfPct >= 50 ? "warn" : "critical"}
        sub={`${smfPct}%`}
      />
      <Tile
        icon={UserCog}
        label="Deputies named"
        value={String(deputiesAssigned)}
        sub={`${participantCount > 0 ? Math.round((deputiesAssigned / participantCount) * 100) : 0}%`}
      />
      <Tile
        icon={AlertTriangle}
        label="Scheduling conflicts"
        value={String(conflicts)}
        tone={conflicts === 0 ? "ok" : "warn"}
        sub={conflicts === 0 ? "none in next 7d" : "double-booked this week"}
      />
    </section>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "ok" | "warn" | "critical";
}) {
  const valueColor =
    tone === "ok"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : tone === "critical"
          ? "text-rose-600 dark:text-rose-300"
          : "text-ink";
  return (
    <div className="rounded-md border border-line bg-surface-0 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        <Icon size={11} />
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className="text-[10px] text-soft">{sub}</div>}
    </div>
  );
}

function SeatCard({
  exerciseId,
  role,
  occupant,
  orgUsers,
  participants,
  isCritical,
  hasConflict,
}: {
  exerciseId: string;
  role: OrgRole;
  occupant: Participant | undefined;
  orgUsers: OrgUser[];
  participants: Participant[];
  isCritical: boolean;
  hasConflict: boolean;
}) {
  const [showAssign, setShowAssign] = useState(false);

  const border = isCritical
    ? "border-rose-300 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
    : occupant
      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
      : "border-line bg-surface-0";

  return (
    <div className={`rounded-md border p-3 ${border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <span className="font-mono">{role.abbreviation}</span>
            {role.isSMF && (
              <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                SMF
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted">{role.title}</p>
        </div>
        {isCritical && <AlertTriangle size={12} className="text-rose-600" />}
        {occupant && !isCritical && <CheckCircle2 size={12} className="text-emerald-600" />}
      </div>

      {occupant ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs font-medium text-ink">{occupant.userName}</p>
          {hasConflict && (
            <p className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
              <AlertTriangle size={9} />
              Also on another exercise this week
            </p>
          )}
          <form action={setDeputyAction} className="flex items-center gap-1">
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input type="hidden" name="participantId" value={occupant.id} />
            <select
              name="deputyParticipantId"
              defaultValue={occupant.deputyParticipantId ?? ""}
              onChange={(e) => e.target.form?.requestSubmit()}
              className="flex-1 rounded border border-line-strong bg-surface-1 px-1.5 py-1 text-[10px]"
            >
              <option value="">— no deputy —</option>
              {participants
                .filter((p) => p.id !== occupant.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    Deputy: {p.userName}
                  </option>
                ))}
            </select>
          </form>
          <form action={removeExerciseMemberAction}>
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input type="hidden" name="participantId" value={occupant.id} />
            <button className="text-[10px] text-soft hover:text-rose-700">Unassign</button>
          </form>
        </div>
      ) : !showAssign ? (
        <button
          type="button"
          onClick={() => setShowAssign(true)}
          className={`mt-2 w-full rounded-md border border-dashed px-2 py-1.5 text-[11px] ${
            isCritical
              ? "border-rose-400 text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950/50"
              : "border-line text-soft hover:border-line-strong hover:text-muted"
          }`}
        >
          <Plus size={10} className="mr-1 inline" />
          {isCritical ? "Critical — assign" : "Assign someone"}
        </button>
      ) : (
        <form
          action={async (fd) => {
            await assignMemberAction(fd);
            setShowAssign(false);
          }}
          className="mt-2 space-y-1"
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="roleTitle" value={role.abbreviation} />
          <input type="hidden" name="exerciseRole" value="PARTICIPANT" />
          <select
            name="userId"
            required
            defaultValue={role.defaultHolderId ?? ""}
            className="w-full rounded border border-line-strong bg-surface-1 px-1.5 py-1 text-[10px]"
          >
            <option value="" disabled>
              — pick —
            </option>
            {orgUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
                {u.id === role.defaultHolderId && " (default)"}
              </option>
            ))}
          </select>
          <div className="flex justify-between gap-1">
            <button
              type="button"
              onClick={() => setShowAssign(false)}
              className="text-[10px] text-soft hover:text-ink"
            >
              Cancel
            </button>
            <button className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white">
              Assign
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
