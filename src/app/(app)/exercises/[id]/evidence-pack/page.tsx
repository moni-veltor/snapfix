import Link from "next/link";
import { notFound } from "next/navigation";
import { FileCheck2, Printer, ShieldCheck, ShieldOff } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyAuditChain } from "@/lib/audit-hash-chain";
import { formatMoney } from "@/lib/exercise-cost";
import { scoreIncident } from "@/lib/scoring";

export const metadata = { title: "Evidence pack — SnapFix" };

export default async function EvidencePackPage({
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
      scenario: { select: { title: true, background: true } },
      chainedScenarios: { include: { scenario: { select: { title: true } } } },
      ibsLinks: { include: { ibs: { select: { name: true, criticality: true } } } },
      participants: {
        include: { user: { select: { name: true, email: true } } },
      },
      vendorParticipants: { include: { vendor: { select: { name: true } } } },
      approvals: {
        include: { approverUser: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      incidents: {
        orderBy: { invokedAt: "asc" },
        include: {
          decisions: {
            orderBy: { createdAt: "asc" },
            include: {
              authorUser: { select: { name: true, email: true } },
              approverUser: { select: { name: true, email: true } },
            },
          },
          sitreps: { orderBy: { createdAt: "asc" } },
          regulatorNotifications: { orderBy: { dueAt: "asc" } },
          imtMeetings: { orderBy: { meetingNumber: "asc" } },
          bcpActivations: true,
          postIncidentReport: true,
        },
      },
      retrospective: true,
      aar: true,
      hotWash: true,
    },
  });
  if (!exercise) notFound();

  const chainVerification = exercise.regulatorMode
    ? await verifyAuditChain(exercise.id)
    : null;

  const liveIncident = exercise.incidents[0];
  const score = liveIncident ? await scoreIncident(liveIncident.id) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-2 print:px-0">
      {/* Print toolbar — hidden when printing */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-1 p-3 print:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            Evidence pack
          </p>
          <p className="text-sm text-muted">
            Use your browser&apos;s &quot;Print &rarr; Save as PDF&quot; to export. Assembled from
            the canonical record of the exercise — every section is reproducible from the DB.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/exercises/${exercise.id}`}
            className="rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
          >
            Back to exercise
          </Link>
          <a
            href={`/api/exercises/${exercise.id}/ics`}
            className="rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
          >
            Calendar invite (.ics)
          </a>
        </div>
      </div>

      {/* Cover */}
      <header className="space-y-2 border-b border-line pb-4 print:border-b-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
          {exercise.regulatorMode && exercise.regulatorAudience
            ? `Regulator evidence · ${exercise.regulatorAudience}`
            : "Exercise evidence pack"}
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink">{exercise.title}</h1>
        <p className="text-sm text-muted">
          Classification: <strong>{exercise.classification}</strong>
          {exercise.classificationCaveat ? ` · ${exercise.classificationCaveat}` : ""} · Jurisdiction:{" "}
          {exercise.jurisdiction} · Mode: {exercise.mode}
        </p>
        <div className="grid gap-2 sm:grid-cols-3 text-xs">
          <Cell label="Status" value={exercise.status} />
          <Cell label="Planned" value={exercise.plannedDate?.toISOString().slice(0, 16).replace("T", " ") ?? "—"} />
          <Cell label="Duration" value={`${exercise.durationMin ?? "—"} min`} />
          <Cell label="Speed" value={`×${exercise.speedMultiplier}`} />
          <Cell label="Location" value={exercise.location ?? "—"} />
          <Cell label="Time zone" value={exercise.timeZone ?? "Europe/London"} />
        </div>
      </header>

      {/* Chain-of-custody / hash-chain verification */}
      {chainVerification && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Chain of custody</h2>
          <div
            className={`rounded-md border p-3 text-sm ${
              chainVerification.ok
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
                : "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40"
            }`}
          >
            <p className="flex items-center gap-1.5 font-semibold">
              {chainVerification.ok ? (
                <>
                  <ShieldCheck size={14} className="text-emerald-700 dark:text-emerald-300" />
                  Audit hash chain verified
                </>
              ) : (
                <>
                  <ShieldOff size={14} className="text-rose-700 dark:text-rose-300" />
                  Audit hash chain BROKEN at sequence {chainVerification.brokenAtSequence}
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted">
              {chainVerification.totalEntries} chained audit entries. Each entry includes the
              SHA-256 of the previous entry; any retroactive edit, deletion, or insertion
              breaks the chain.
            </p>
          </div>
        </section>
      )}

      {/* Facilitation */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Facilitation</h2>
        <ul className="space-y-1 text-sm">
          <li>
            Facilitator: <strong>{exercise.facilitator?.name ?? exercise.facilitator?.email ?? "—"}</strong>
          </li>
          {exercise.coFacilitator && (
            <li>
              Co-facilitator: <strong>{exercise.coFacilitator.name ?? exercise.coFacilitator.email}</strong>
            </li>
          )}
        </ul>
      </section>

      {/* Approvals */}
      {exercise.approvals.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Approvals</h2>
          <ul className="space-y-1 text-sm">
            {exercise.approvals.map((a) => (
              <li key={a.id} className="rounded-md border border-line bg-surface-0 p-2">
                <p>
                  <strong>{a.approverNameSnapshot}</strong>
                  {a.approverRoleSnapshot && ` (${a.approverRoleSnapshot})`} —{" "}
                  <span className="font-semibold">{a.status}</span>
                  {a.signedAt && ` · signed ${a.signedAt.toISOString().slice(0, 10)}`}
                </p>
                {a.comment && <p className="mt-0.5 text-xs text-muted">&ldquo;{a.comment}&rdquo;</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Objectives */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Objectives</h2>
        {exercise.objectives.length === 0 ? (
          <p className="text-sm text-muted">No objectives declared.</p>
        ) : (
          <ol className="ml-5 list-decimal space-y-1 text-sm">
            {exercise.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ol>
        )}
      </section>

      {/* Scenarios */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Scenarios in the chain</h2>
        <ul className="space-y-2 text-sm">
          {[exercise.scenario, ...exercise.chainedScenarios.map((c) => c.scenario)].map((s, i) => (
            <li key={i} className="rounded-md border border-line bg-surface-0 p-3">
              <p className="font-medium">{s.title}</p>
            </li>
          ))}
        </ul>
        {exercise.scenario.background && (
          <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{exercise.scenario.background}</p>
        )}
      </section>

      {/* IBSs */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Important Business Services tested</h2>
        {exercise.ibsLinks.length === 0 ? (
          <p className="text-sm text-muted">No IBS register entries explicitly linked.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {exercise.ibsLinks.map((l) => (
              <li key={l.ibsId}>
                <strong>{l.ibs.name}</strong> · {l.ibs.criticality}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Roster */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. Roster ({exercise.participants.length})</h2>
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Role</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">Attended</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {exercise.participants.map((p) => (
              <tr key={p.id}>
                <td className="px-2 py-1">{p.user.name ?? p.user.email}</td>
                <td className="px-2 py-1 font-mono">{p.roleTitle}</td>
                <td className="px-2 py-1">{p.exerciseRole}</td>
                <td className="px-2 py-1 text-xs text-muted">
                  {p.attendedFromAt
                    ? `${p.attendedFromAt.toISOString().slice(11, 16)} – ${p.attendedUntilAt?.toISOString().slice(11, 16) ?? "?"}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Vendors */}
      {exercise.vendorParticipants.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Third-party / vendor participants</h2>
          <ul className="space-y-1 text-sm">
            {exercise.vendorParticipants.map((vp) => (
              <li key={vp.id}>
                <strong>{vp.vendor.name}</strong> — {vp.contactName} · {vp.contactEmail} ·{" "}
                <span className="text-xs text-muted">scope: {vp.scope} · reads: {vp.readCount}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Incidents */}
      {exercise.incidents.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Incidents invoked</h2>
          {exercise.incidents.map((inc) => (
            <div key={inc.id} className="space-y-2 rounded-md border border-line bg-surface-0 p-3 text-sm">
              <p className="font-semibold">
                {inc.shortCode}: {inc.title} — {inc.status} · {inc.severity}
              </p>
              {inc.invokedAt && <p className="text-xs text-muted">Invoked {inc.invokedAt.toISOString().slice(0, 16)}</p>}

              {inc.decisions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Decisions ({inc.decisions.length})
                  </p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {inc.decisions.map((d) => (
                      <li key={d.id} className="rounded bg-surface-1 p-2">
                        <p>
                          <span className="font-mono">D-Day {d.dDayTime}</span> ·{" "}
                          <strong>{d.title}</strong> ({d.decisionType})
                        </p>
                        {d.rationale && <p className="mt-0.5 italic text-muted">&ldquo;{d.rationale}&rdquo;</p>}
                        <p className="mt-0.5 text-[10px] text-soft">
                          Author: {d.authorUser?.name ?? d.authorUser?.email ?? "—"}
                          {d.approverUser && ` · Approver: ${d.approverUser.name ?? d.approverUser.email}`}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inc.sitreps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Sitreps ({inc.sitreps.length})
                  </p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {inc.sitreps.map((s) => (
                      <li key={s.id}>
                        <span className="font-mono">D-Day {s.dDayTime}</span> · {s.businessUnit} · {s.status} —{" "}
                        {s.summary}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inc.regulatorNotifications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Regulator notifications
                  </p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {inc.regulatorNotifications.map((rn) => (
                      <li key={rn.id}>
                        {rn.regulator} · {rn.status} · due {rn.dueAt.toISOString().slice(0, 10)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inc.bcpActivations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    BCP activations
                  </p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {inc.bcpActivations.map((b) => (
                      <li key={b.id}>
                        Activated {b.activatedAt.toISOString().slice(0, 16)}
                        {b.deactivatedAt && ` · deactivated ${b.deactivatedAt.toISOString().slice(0, 16)}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inc.postIncidentReport && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Post-Incident Report
                  </p>
                  <p className="text-xs text-muted">
                    {inc.postIncidentReport.submittedAt
                      ? `Submitted ${inc.postIncidentReport.submittedAt.toISOString().slice(0, 10)}`
                      : `Due ${inc.postIncidentReport.dueAt.toISOString().slice(0, 10)} — not yet submitted`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Score */}
      {score && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">10. Performance score</h2>
          <p className="text-sm">
            Overall: <strong>{score.overall}/100</strong>. Captured at the time this evidence pack
            was generated; refreshes if the exercise continues.
          </p>
          {score.coaching.length > 0 && (
            <ul className="space-y-1 text-xs">
              {score.coaching.map((c) => (
                <li key={c.id} className="rounded bg-surface-1 p-2">
                  <p className="font-medium">{c.finding}</p>
                  <p className="text-[10px] text-muted">
                    {c.level.toUpperCase()}
                    {c.recommendation && ` — ${c.recommendation}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Cost */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">11. Cost</h2>
        <ul className="space-y-1 text-sm">
          <li>
            Estimated (at planning):{" "}
            <strong>
              {exercise.estimatedCostMinor
                ? formatMoney(Math.round(exercise.estimatedCostMinor / 100), "GBP")
                : "—"}
            </strong>
          </li>
          <li>
            Actual (at closure):{" "}
            <strong>
              {exercise.actualCostMinor
                ? formatMoney(Math.round(exercise.actualCostMinor / 100), "GBP")
                : "—"}
            </strong>
          </li>
        </ul>
      </section>

      {/* Retrospective / hot-wash / AAR */}
      {(exercise.retrospective || exercise.hotWash || exercise.aar) && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">12. Lessons-learned</h2>
          {exercise.aar && (
            <div className="rounded-md border border-line bg-surface-0 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">After-Action Report</p>
              <p className="mt-1 whitespace-pre-wrap text-xs">{exercise.aar.summary}</p>
            </div>
          )}
          {exercise.hotWash && (
            <div className="rounded-md border border-line bg-surface-0 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Hot-wash (immediate)</p>
              <p className="mt-1 whitespace-pre-wrap text-xs">{exercise.hotWash.summary ?? "(no summary)"}</p>
            </div>
          )}
          {exercise.retrospective && (
            <div className="rounded-md border border-line bg-surface-0 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Retrospective</p>
              {exercise.retrospective.wentWell && (
                <p className="mt-1 whitespace-pre-wrap text-xs">
                  <strong>Went well:</strong> {exercise.retrospective.wentWell}
                </p>
              )}
              {exercise.retrospective.didntGoWell && (
                <p className="mt-1 whitespace-pre-wrap text-xs">
                  <strong>Didn&apos;t:</strong> {exercise.retrospective.didntGoWell}
                </p>
              )}
              {exercise.retrospective.improvements && (
                <p className="mt-1 whitespace-pre-wrap text-xs">
                  <strong>Improvements:</strong> {exercise.retrospective.improvements}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-line pt-4 text-xs text-soft">
        <p className="flex items-center gap-1.5">
          <FileCheck2 size={11} />
          Generated by SnapFix for {me.email} · exercise id <span className="font-mono">{exercise.id}</span>
        </p>
        <p className="mt-1 print:hidden">
          <Printer size={11} className="mr-1 inline" />
          Use your browser&apos;s Print to save this pack as a PDF for archival.
        </p>
      </footer>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface-0 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
