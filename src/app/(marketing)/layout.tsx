import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const signedIn = !!session?.user?.orgId;

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold tracking-tight text-slate-900">SnapFix</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <Link href="/product/simulator" className="text-slate-600 hover:text-slate-900">
              Product
            </Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900">
              About
            </Link>
            <Link href="/contact" className="text-slate-600 hover:text-slate-900">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
              >
                Open app →
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-slate-600 hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4 md:gap-4">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="font-semibold tracking-tight">SnapFix</span>
            </div>
            <p className="max-w-sm text-sm text-slate-600">
              Operational resilience consulting in technology, with a growing platform of practical
              apps for banks, fintechs, and financial market infrastructures.
            </p>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-slate-900">Platform</div>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>
                <Link href="/product/simulator" className="hover:underline">
                  SnapFix Simulator
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:underline">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-slate-900">Company</div>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>
                <Link href="/about" className="hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} SnapFix. Operational resilience consulting in technology.
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2L3 7l9 5 9-5-9-5z"
        fill="#4f46e5"
      />
      <path
        d="M3 12l9 5 9-5"
        stroke="#4f46e5"
        strokeWidth="1.5"
        opacity="0.55"
      />
      <path
        d="M3 17l9 5 9-5"
        stroke="#4f46e5"
        strokeWidth="1.5"
        opacity="0.25"
      />
    </svg>
  );
}
