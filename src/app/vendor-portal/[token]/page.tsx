import { notFound } from "next/navigation";
import { Building2, Clock, Inbox, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { loadAggregatedInjects } from "@/lib/exercise-injects";

export const metadata = { title: "Vendor portal — SnapFix" };

/**
 * Public route — no auth. Validates a one-time-use access token (signed
 * URL pattern, 7-day expiry) and renders a scoped view of the exercise:
 * only the injects addressed to the vendor's role + the exercise metadata.
 *
 * Every page view increments ExerciseVendorParticipant.readCount for
 * audit. Internal chat, decisions, comms cascade and other roster views
 * are NOT exposed.
 */
export default async function VendorPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const vp = await prisma.exerciseVendorParticipant.findUnique({
    where: { accessToken: token },
    include: {
      exercise: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          plannedDate: true,
          location: true,
          timeZone: true,
          classification: true,
          classificationCaveat: true,
          scenario: { select: { title: true } },
        },
      },
      vendor: { select: { name: true } },
    },
  });

  if (!vp) notFound();
  if (vp.tokenExpiresAt < new Date()) {
    return <ExpiredView />;
  }

  // Audit read + first-join timestamp
  await prisma.exerciseVendorParticipant.update({
    where: { id: vp.id },
    data: {
      readCount: { increment: 1 },
      joinedAt: vp.joinedAt ?? new Date(),
    },
  });

  // Pull injects addressed to the vendor — we match by the vendor's name in
  // the inject's toRoleTitles or by the FULL_PARTICIPANT scope.
  const injects = vp.scope === "OBSERVER_ONLY"
    ? []
    : (await loadAggregatedInjects(vp.exerciseId)).filter((i) => {
        if (i.hidden) return false;
        if (vp.scope === "FULL_PARTICIPANT") return true;
        return i.toRoleTitles.some((r) => r.toLowerCase() === vp.vendor.name.toLowerCase());
      });

  const isClassified =
    vp.exercise.classification === "CONFIDENTIAL" || vp.exercise.classification === "SECRET";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {isClassified && <Watermark caveat={vp.exercise.classificationCaveat} />}
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
          Vendor portal · scoped access
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
          {vp.exercise.title}
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          You&apos;re joining as <strong>{vp.contactName}</strong> from <strong>{vp.vendor.name}</strong>{" "}
          · scope:{" "}
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {vp.scope.replace("_", " ")}
          </span>
        </p>
        {isClassified && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
            <ShieldCheck size={11} />
            CLASSIFIED · {vp.exercise.classification}
            {vp.exercise.classificationCaveat ? ` · ${vp.exercise.classificationCaveat}` : ""}
          </p>
        )}
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Building2 size={14} className="text-indigo-600 dark:text-indigo-300" />
            Exercise vitals
          </h2>
          <dl className="grid gap-1.5 text-sm">
            <Row label="Scenario" value={vp.exercise.scenario.title} />
            <Row label="Status" value={vp.exercise.status} />
            <Row
              label="Planned"
              value={
                vp.exercise.plannedDate
                  ? vp.exercise.plannedDate.toLocaleString("en-GB", {
                      timeZone: vp.exercise.timeZone ?? "Europe/London",
                    })
                  : "TBC"
              }
            />
            <Row label="Location" value={vp.exercise.location ?? "—"} />
          </dl>
          {vp.exercise.description && (
            <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400">
              {vp.exercise.description}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Inbox size={14} className="text-indigo-600 dark:text-indigo-300" />
            Your injects ({injects.length})
          </h2>
          {vp.scope === "OBSERVER_ONLY" ? (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Observer scope — injects are not surfaced. Your role is to attend the war-room
              session and provide feedback to the facilitator after.
            </p>
          ) : injects.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              No injects addressed to <strong>{vp.vendor.name}</strong> in this exercise.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {injects.map((i) => (
                <li
                  key={i.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <p className="flex items-baseline justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono">
                      <Clock size={9} className="mr-0.5 inline" />
                      D-Day {String(Math.floor(i.effectiveDDayMin / 60)).padStart(2, "0")}:
                      {String(i.effectiveDDayMin % 60).padStart(2, "0")}
                    </span>
                    {i.kind && (
                      <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {i.kind}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{i.summary}</p>
                  {i.description && (
                    <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                      {i.description}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {i.senderRoleTitle && <>From {i.senderRoleTitle} → </>}
                    {i.toRoleTitles.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="text-center text-[10px] text-slate-400">
          Token expires {vp.tokenExpiresAt.toISOString().slice(0, 16).replace("T", " ")} UTC ·
          read count: {vp.readCount + 1}
        </footer>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1 last:border-b-0 dark:border-slate-800">
      <dt className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function ExpiredView() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
          Access expired
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
          Token expired
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your scoped access to this exercise has expired. Contact the facilitating organisation
          to request a fresh link.
        </p>
      </div>
    </div>
  );
}

function Watermark({ caveat }: { caveat: string | null }) {
  const text = `CLASSIFIED${caveat ? ` · ${caveat}` : ""}`;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 flex flex-wrap items-center justify-center overflow-hidden opacity-[0.04]"
    >
      {Array.from({ length: 30 }).map((_, i) => (
        <span
          key={i}
          className="-rotate-12 select-none whitespace-nowrap p-12 font-mono text-3xl font-bold text-slate-900 dark:text-slate-100"
        >
          {text}
        </span>
      ))}
    </div>
  );
}
