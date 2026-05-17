import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import { formatMoney } from "@/lib/exercise-cost";
import { scoreIncident } from "@/lib/scoring";
import { evaluateToleranceBreaches } from "@/lib/rto-rpo-check";

export const metadata = { title: "Executive summary — SnapFix" };

/**
 * Stakeholder-scope view. Surfaces only the high-level outcome:
 * exercise name, classification, dates, headline cost, performance score,
 * closure status, PIR submission state, tolerance-breach count. No
 * inboxes, decisions, sitreps, or chat.
 *
 * Stakeholders set via ExerciseParticipant.isStakeholder are directed here.
 * Owners / admins can also visit to preview what their stakeholders see.
 */
export default async function ExecSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;

  const exercise = await prisma.exercise.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      facilitator: { select: { name: true, email: true } },
      coFacilitator: { select: { name: true, email: true } },
      scenario: { select: { title: true } },
      _count: { select: { participants: true, ibsLinks: true } },
      incidents: {
        orderBy: { invokedAt: "desc" },
        take: 1,
        select: { id: true, status: true, severity: true, closedAt: true, invokedAt: true, postIncidentReport: true },
      },
    },
  });
  if (!exercise) notFound();

  const incident = exercise.incidents[0];
  const score = incident ? await scoreIncident(incident.id) : null;
  const breaches = incident ? await evaluateToleranceBreaches(incident.id) : [];
  const breachedCount = breaches.filter((b) => b.isBreached).length;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Executive summary"
        icon={ShieldCheck}
        title={exercise.title}
        pitch="Top-line outcome. Click into the full exercise view for the operational detail."
        actions={
          <Link
            href={`/exercises/${exercise.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          >
            Operational view →
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <Tile
          icon={Activity}
          label="Status"
          value={exercise.status}
          tone={exercise.status === "COMPLETED" ? "ok" : exercise.status === "ABANDONED" ? "critical" : "neutral"}
        />
        <Tile
          icon={Target}
          label="Performance"
          value={score ? `${score.overall}/100` : "—"}
          tone={
            !score ? "neutral" : score.overall >= 80 ? "ok" : score.overall >= 60 ? "warn" : "critical"
          }
          sub={score ? "best practice average" : "no incident invoked"}
        />
        <Tile
          icon={Coins}
          label="Cost"
          value={
            exercise.actualCostMinor
              ? formatMoney(Math.round(exercise.actualCostMinor / 100), "GBP")
              : exercise.estimatedCostMinor
                ? `~${formatMoney(Math.round(exercise.estimatedCostMinor / 100), "GBP")}`
                : "—"
          }
          sub={exercise.actualCostMinor ? "actual" : "estimated"}
        />
        <Tile
          icon={CheckCircle2}
          label="PIR"
          value={
            incident?.postIncidentReport?.submittedAt
              ? "Submitted"
              : incident?.postIncidentReport
                ? "Drafting"
                : "—"
          }
          tone={
            incident?.postIncidentReport?.submittedAt
              ? "ok"
              : incident?.postIncidentReport
                ? "warn"
                : "neutral"
          }
        />
      </section>

      <section className="rounded-xl border border-line bg-surface-1 p-5">
        <h2 className="text-sm font-semibold text-ink">Headline</h2>
        <p className="mt-2 text-sm text-muted">
          {exercise.scenario.title}. {exercise._count.participants} participants tested{" "}
          {exercise._count.ibsLinks} IBS{exercise._count.ibsLinks === 1 ? "" : "s"}.
          {incident ? (
            <>
              {" "}
              Incident {incident.status} ({incident.severity}).{breachedCount > 0 ? ` ${breachedCount} tolerance breach${breachedCount === 1 ? "" : "es"}.` : " No tolerance breaches."}
            </>
          ) : (
            <> No incident was invoked.</>
          )}
        </p>
        {exercise.facilitator && (
          <p className="mt-2 text-xs text-soft">
            Facilitator: {exercise.facilitator.name ?? exercise.facilitator.email}
            {exercise.coFacilitator && (
              <> · Co-facilitator: {exercise.coFacilitator.name ?? exercise.coFacilitator.email}</>
            )}
          </p>
        )}
      </section>

      {breaches.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">IBS impact-tolerance summary</h2>
          <ul className="space-y-1 text-xs">
            {breaches.map((b) => (
              <li
                key={b.ibsName}
                className={`rounded-md border p-2 ${
                  b.isBreached
                    ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
                    : "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
                }`}
              >
                <strong>{b.ibsName}</strong> · {b.summary}
              </li>
            ))}
          </ul>
        </section>
      )}

      {score && score.coaching.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">Headline findings</h2>
          <ul className="space-y-1 text-xs">
            {score.coaching.slice(0, 5).map((c) => (
              <li key={c.id} className="rounded-md border border-line bg-surface-0 p-2">
                <p className="font-medium">{c.finding}</p>
                {c.recommendation && (
                  <p className="mt-0.5 text-[11px] text-muted">
                    <Sparkles size={9} className="mr-1 inline" />
                    {c.recommendation}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
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
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        <Icon size={11} />
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className="text-[10px] text-soft">{sub}</div>}
    </div>
  );
}
