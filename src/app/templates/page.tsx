import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloneTemplateAction } from "@/app/actions/templates";

export const metadata = { title: "Scenario Library — SnapFix" };

export default async function TemplatesPage() {
  const me = await requireOrgUser();
  const [templates, myClones] = await Promise.all([
    prisma.scenario.findMany({
      where: { isTemplate: true, orgId: null },
      orderBy: [{ category: "asc" }, { title: "asc" }],
      include: { _count: { select: { events: true, injects: true, ibsList: true } } },
    }),
    prisma.scenario.findMany({
      where: { orgId: me.orgId, templateOriginId: { not: null } },
      select: { id: true, title: true, templateOriginId: true, createdAt: true },
    }),
  ]);

  const cloneByOriginId = new Map<string, { id: string; title: string }[]>();
  for (const c of myClones) {
    if (!c.templateOriginId) continue;
    const list = cloneByOriginId.get(c.templateOriginId) ?? [];
    list.push({ id: c.id, title: c.title });
    cloneByOriginId.set(c.templateOriginId, list);
  }

  const byCategory = new Map<string, typeof templates>();
  for (const t of templates) {
    const cat = t.category ?? "Other";
    const list = byCategory.get(cat) ?? [];
    list.push(t);
    byCategory.set(cat, list);
  }
  const sortedCategories = Array.from(byCategory.keys()).sort();
  const canClone = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">CMORG Scenario Library</h1>
        <p className="mt-1 text-sm text-slate-600">
          {templates.length} scenario templates from the UK Financial Services Dynamic Scenario
          Library. {canClone ? "Clone any template into your organisation to customise it." : "Ask an admin to clone a template into your organisation."}
        </p>
      </header>

      <div className="space-y-8">
        {sortedCategories.map((cat) => (
          <section key={cat} className="space-y-3">
            <h2 className="text-lg font-semibold">{cat}</h2>
            <ul className="space-y-2">
              {(byCategory.get(cat) ?? []).map((t) => {
                const existing = cloneByOriginId.get(t.id);
                return (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/templates/${t.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.title}
                        </Link>
                        {t.srrRef && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs">
                            SRR {t.srrRef}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-slate-600">{t.background}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{t._count.ibsList} IBS</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{t._count.events} events</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{t._count.injects} injects</span>
                        <RiskCoverageBadges scenario={t} />
                      </div>
                      {existing && existing.length > 0 && (
                        <p className="mt-2 text-xs text-emerald-700">
                          Already cloned:{" "}
                          {existing.map((c, i) => (
                            <span key={c.id}>
                              {i > 0 && ", "}
                              <Link href={`/scenarios/${c.id}`} className="underline">
                                {c.title}
                              </Link>
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    {canClone && (
                      <form action={cloneTemplateAction}>
                        <input type="hidden" name="templateId" value={t.id} />
                        <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-700">
                          Clone into my org
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function RiskCoverageBadges({
  scenario,
}: {
  scenario: {
    coversPeople: boolean;
    coversProperty: boolean;
    coversTechnology: boolean;
    coversDataAvailability: boolean;
    coversDataIntegrity: boolean;
    coversThirdParty: boolean;
  };
}) {
  const items: { label: string; on: boolean }[] = [
    { label: "People", on: scenario.coversPeople },
    { label: "Property", on: scenario.coversProperty },
    { label: "Tech", on: scenario.coversTechnology },
    { label: "Data Avail.", on: scenario.coversDataAvailability },
    { label: "Data Integ.", on: scenario.coversDataIntegrity },
    { label: "3rd Party", on: scenario.coversThirdParty },
  ];
  return (
    <>
      {items
        .filter((i) => i.on)
        .map((i) => (
          <span
            key={i.label}
            className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white"
          >
            {i.label}
          </span>
        ))}
    </>
  );
}
