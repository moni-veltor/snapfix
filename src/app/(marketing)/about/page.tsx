import Link from "next/link";

export const metadata = {
  title: "About — SnapFix",
  description:
    "SnapFix is operational-resilience consulting in technology, building practical apps for banks.",
};

export default function AboutPage() {
  return (
    <div className="text-slate-200">
      <section className="bg-night-hero">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <span className="text-sm uppercase tracking-wider text-indigo-300">About</span>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
            Operational resilience, built by people who run it.
          </h1>
        </div>
      </section>

      <section className="bg-night-dots">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-slate-300">
          <p>
            SnapFix is a consultancy and a software platform. We help banks, fintechs and financial
            market infrastructures plan, run and learn from operational-resilience exercises — the
            kind that regulators expect, and the kind that genuinely improve a firm's ability to
            survive a real disruption.
          </p>
          <p>
            We started SnapFix because we kept seeing the same gap: firms had policies, IBS
            documents, and the right governance frameworks on paper — but their actual exercises
            were run on PowerPoint, Word docs and email threads. The post-exercise reports lived in
            shared drives, action items got lost, and nobody could answer the simple question:
            <em> what have we actually tested?</em>
          </p>
          <p>
            The SnapFix platform turns the CMORG Dynamic Scenario Library into a working product,
            wraps it with the IBS register, action-item tracker and coverage analytics that real
            programmes need, and gives you the auditable evidence regulators are starting to ask
            for.
          </p>

          <h2 className="pt-8 text-2xl font-semibold tracking-tight text-white">What we do</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card-night p-5">
              <h3 className="font-semibold text-white">Consulting</h3>
              <p className="mt-2 text-sm text-slate-400">
                Annual operational-resilience programme review, bespoke scenario design, exercise
                facilitation, regulatory-narrative drafting, and IBS-methodology coaching.
              </p>
            </div>
            <div className="card-night p-5">
              <h3 className="font-semibold text-white">Platform</h3>
              <p className="mt-2 text-sm text-slate-400">
                Practical apps you can use day-to-day. SnapFix Simulator is the first — more
                purpose-built apps for operational-resilience teams are on the roadmap.
              </p>
            </div>
          </div>

          <h2 className="pt-8 text-2xl font-semibold tracking-tight text-white">Mission</h2>
          <p>
            Make operational-resilience exercises easier to run, easier to learn from, and easier to
            defend to regulators. We measure success by how many real customer-harm-events the
            firms we work with avoid — and by how much less paperwork they have to do to prove it.
          </p>

          <div className="mt-12 rounded-xl border border-indigo-400/30 bg-indigo-500/[0.08] p-6">
            <h2 className="text-xl font-semibold tracking-tight text-white">Want to talk?</h2>
            <p className="mt-2 text-slate-300">
              Whether you're looking for consulting support or to try the platform, we'd love to
              hear from you.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Book a conversation
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                Try the platform free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
