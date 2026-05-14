"use client";

import { useState } from "react";
import { Sparkles, Users as UsersIcon, Crown, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { claimSeatAction } from "@/app/actions/seats";
import { visualFor, FAMILY_TONE, type RoleFamily } from "@/lib/role-icons";
import Button from "@/components/ui/Button";
import type { SeatView } from "@/lib/seats";
import type { PresenceMember } from "@/lib/live";

type Props = {
  exerciseId: string;
  exerciseTitle: string;
  scenarioTitle: string;
  meId: string;
  meName: string;
  seats: SeatView[];
  presence: PresenceMember[];
  dDayHHMM: string;
};

const FAMILY_FILTERS: { id: "all" | RoleFamily; label: string }[] = [
  { id: "all", label: "All seats" },
  { id: "executive", label: "Executive" },
  { id: "tactical", label: "Tactical" },
  { id: "comms", label: "Communications" },
  { id: "compliance", label: "Compliance" },
];

/**
 * The "lobby" — what a participant sees before claiming a seat. A grid of
 * seat tiles grouped by family, with a hero card surfacing the suggested
 * seat first. Live presence ribbon at the top so you know who else is in.
 */
export default function SeatLobby({
  exerciseId,
  exerciseTitle,
  scenarioTitle,
  meId,
  meName,
  seats,
  presence,
  dDayHHMM,
}: Props) {
  const [filter, setFilter] = useState<"all" | RoleFamily>("all");

  const suggested = seats.find((s) => s.defaultHolderUserId === meId && !s.holderUserId);
  const visibleSeats = seats.filter((s) => {
    if (suggested && s.id === suggested.id) return false;
    if (filter === "all") return true;
    return visualFor(s.roleAbbreviation).family === filter;
  });

  const filled = seats.filter((s) => s.holderUserId).length;
  const online = presence.filter((p) => p.online);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-1">
      <header className="relative overflow-hidden rounded-2xl border border-line bg-surface-1 p-6 shadow-[var(--shadow-card)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "var(--gradient-brand-soft)" }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live · D-Day {dDayHHMM}
            </div>
            <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Welcome to the war room, {meName.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              {scenarioTitle} · {exerciseTitle}
            </p>
            <p className="mt-3 max-w-xl text-sm text-muted">
              Pick a seat below to join. Every message and decision routes through whoever's
              holding the seat at the moment, so claim the role you can actually own.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface-0 px-3 py-1.5 text-xs">
              <UsersIcon size={12} className="text-soft" />
              <span className="font-medium text-ink">{online.length} online</span>
              <span className="text-soft">·</span>
              <span className="text-muted">
                {filled}/{seats.length} seats filled
              </span>
            </div>
            {online.length > 0 && (
              <div className="flex -space-x-2">
                {online.slice(0, 6).map((p) => (
                  <span
                    key={p.participantId}
                    title={`${p.name ?? p.email} · ${p.roleTitle}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-1 bg-indigo-500 text-[10px] font-semibold text-white"
                  >
                    {initials(p.name, p.email)}
                  </span>
                ))}
                {online.length > 6 && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-1 bg-surface-2 text-[10px] font-medium text-muted">
                    +{online.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {suggested && <SuggestedSeat exerciseId={exerciseId} seat={suggested} meName={meName} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FAMILY_FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-[var(--shadow-card)] dark:bg-indigo-500"
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {f.label}
                {f.id !== "all" && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {seats.filter((s) => visualFor(s.roleAbbreviation).family === f.id).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">{visibleSeats.length} seats shown</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleSeats.map((seat) => (
          <SeatTile key={seat.id} exerciseId={exerciseId} seat={seat} meId={meId} />
        ))}
      </ul>
    </div>
  );
}

function SuggestedSeat({
  exerciseId,
  seat,
  meName,
}: {
  exerciseId: string;
  seat: SeatView;
  meName: string;
}) {
  const v = visualFor(seat.roleAbbreviation);
  const tone = FAMILY_TONE[v.family];
  const Icon = v.icon;
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-indigo-400 bg-gradient-brand-soft p-6 shadow-[var(--shadow-card-glow)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tone.iconBg}`}>
            <Icon size={26} className={tone.iconColor} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500 dark:text-indigo-300" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                Suggested for {meName.split(" ")[0]}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              {seat.roleTitle}{" "}
              <span className="font-mono text-base text-muted">({seat.roleAbbreviation})</span>
            </h2>
            {seat.responsibility && (
              <p className="mt-1 max-w-xl text-sm text-muted">{seat.responsibility}</p>
            )}
          </div>
        </div>
        <form action={claimSeatAction}>
          <input type="hidden" name="exerciseId" value={seat.id ? exerciseId : exerciseId} />
          <input type="hidden" name="seatId" value={seat.id} />
          <Button variant="gradient" size="lg" icon={Crown} type="submit">
            Take this seat
          </Button>
        </form>
      </div>
    </div>
  );
}

function SeatTile({
  exerciseId,
  seat,
  meId,
}: {
  exerciseId: string;
  seat: SeatView;
  meId: string;
}) {
  const v = visualFor(seat.roleAbbreviation);
  const tone = FAMILY_TONE[v.family];
  const Icon = v.icon;
  const isFilled = !!seat.holderUserId;
  const isUnreachable = seat.status === "UNREACHABLE";
  const suggestedForMe = seat.defaultHolderUserId === meId && !isFilled;

  return (
    <li
      className={`group relative flex flex-col rounded-xl border bg-surface-1 p-4 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        suggestedForMe
          ? "border-indigo-400 ring-2 ring-indigo-400/30"
          : isUnreachable
            ? "border-rose-300 dark:border-rose-700"
            : tone.ring
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.iconBg}`}>
          <Icon size={20} className={tone.iconColor} strokeWidth={2} />
        </div>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tone.chip}`}
        >
          {tone.label}
        </span>
      </div>

      <div className="mt-3 min-h-[60px]">
        <h3 className="font-mono text-sm font-semibold text-ink">{seat.roleAbbreviation}</h3>
        <p className="text-xs text-muted">{seat.roleTitle}</p>
        {seat.isSMF && (
          <span className="mt-1 inline-block rounded bg-slate-900/10 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-300">
            SMF
          </span>
        )}
      </div>

      {seat.responsibility && (
        <p className="mt-2 line-clamp-2 text-[11px] text-muted opacity-80 group-hover:opacity-100 group-hover:line-clamp-none">
          {seat.responsibility}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <SeatStatus seat={seat} />
        {!isFilled && (
          <form action={claimSeatAction}>
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input type="hidden" name="seatId" value={seat.id} />
            {isUnreachable && <input type="hidden" name="asDeputy" value="on" />}
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={11} strokeWidth={2.4} />
              {isUnreachable ? "Step up" : "Take seat"}
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

function SeatStatus({ seat }: { seat: SeatView }) {
  if (seat.status === "UNREACHABLE") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400">
        <AlertCircle size={11} />
        Unreachable
      </span>
    );
  }
  if (seat.holderUserId) {
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-muted">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-semibold text-white">
          {initials(seat.holderName, seat.holderEmail ?? "?")}
        </span>
        <span className="flex items-center gap-0.5 truncate">
          <CheckCircle2 size={9} className="text-emerald-600 dark:text-emerald-400" />
          {seat.holderName}
        </span>
      </span>
    );
  }
  if (seat.defaultHolderName) {
    return (
      <span className="text-[10px] text-soft">
        Normally <span className="text-muted">{seat.defaultHolderName}</span>
      </span>
    );
  }
  return <span className="text-[10px] text-soft">Empty</span>;
}

function initials(name: string | null, email: string): string {
  const base = (name ?? email).trim();
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (base[0] ?? "?").toUpperCase();
}
