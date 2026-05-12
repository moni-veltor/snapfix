import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

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
            <Link href="/pricing" className="text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/about" className="text-slate-300 hover:text-white">
              About
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-white">
              Contact
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
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4 md:gap-4">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Logo size={26} tone="light" />
              <span className="font-semibold tracking-tight text-white">SnapFix</span>
            </div>
            <p className="max-w-sm text-sm text-slate-400">
              Operational resilience consulting in technology, with a growing platform of practical
              apps for banks, fintechs, and financial market infrastructures.
            </p>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-white">Platform</div>
            <ul className="mt-2 space-y-1 text-slate-400">
              <li>
                <Link href="/product/simulator" className="hover:text-white">
                  SnapFix Simulator
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-white">Company</div>
            <ul className="mt-2 space-y-1 text-slate-400">
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.06] py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} SnapFix. Operational resilience consulting in technology.
        </div>
      </footer>
    </div>
  );
}
