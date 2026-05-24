import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import NewsletterSignup from "@/components/marketing/NewsletterSignup";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const signedIn = !!session?.user?.orgId;

  return (
    <div className="theme-night flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[color:var(--night-base)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={26} tone="light" />
            <span className="text-base font-semibold tracking-tight text-white">SnapFix</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <Link href="/product/simulator" className="text-slate-300 hover:text-white">
              Product
            </Link>
            <Link href="/use-cases" className="text-slate-300 hover:text-white">
              Use cases
            </Link>
            <Link href="/resources" className="text-slate-300 hover:text-white">
              Resources
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/services" className="text-slate-300 hover:text-white">
              Services
            </Link>
            <Link href="/about" className="text-slate-300 hover:text-white">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-indigo-500 px-4 py-2 font-medium text-white shadow-[0_0_24px_-6px_rgba(99,102,241,0.65)] hover:bg-indigo-400"
              >
                Open app →
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-slate-300 hover:text-white">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-indigo-500 px-4 py-2 font-medium text-white shadow-[0_0_24px_-6px_rgba(99,102,241,0.65)] hover:bg-indigo-400"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/[0.06] bg-[color:var(--night-base)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-12 md:gap-6">
          <div className="space-y-3 md:col-span-4">
            <div className="flex items-center gap-2">
              <Logo size={26} tone="light" />
              <span className="font-semibold tracking-tight text-white">SnapFix</span>
            </div>
            <p className="max-w-sm text-sm text-slate-400">
              Operational resilience consulting in technology, with a growing platform of practical
              apps for banks, fintechs, and financial market infrastructures.
            </p>
            <NewsletterSignup source="footer" />
          </div>
          <FooterCol title="Platform" links={[
            { href: "/product/simulator", label: "SnapFix Simulator" },
            { href: "/pricing", label: "Pricing" },
            { href: "/use-cases", label: "Use cases" },
          ]} />
          <FooterCol title="Resources" links={[
            { href: "/resources", label: "Resources hub" },
            { href: "/resources/glossary", label: "Glossary" },
            { href: "/resources/regulators", label: "Regulator reference" },
            { href: "/resources/templates", label: "Templates" },
            { href: "/resources/changelog", label: "Changelog" },
          ]} />
          <FooterCol title="Company" links={[
            { href: "/about", label: "About" },
            { href: "/services", label: "Consulting" },
            { href: "/contact", label: "Contact" },
            { href: "/security", label: "Security" },
          ]} />
          <FooterCol title="Legal" links={[
            { href: "/legal/privacy", label: "Privacy" },
            { href: "/legal/terms", label: "Terms" },
            { href: "/legal/dpa", label: "DPA" },
          ]} />
        </div>
        <div className="border-t border-white/[0.06] py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} SnapFix. Operational resilience consulting in technology.
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="text-sm md:col-span-2">
      <div className="font-semibold text-white">{title}</div>
      <ul className="mt-2 space-y-1 text-slate-400">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
