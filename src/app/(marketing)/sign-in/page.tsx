import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignInForm from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string; signedOut?: string }>;
}) {
  const sp = await searchParams;
  // Skip the auto-redirect if we just signed out. The cookies are cleared in
  // the signOutAction but a stale auth() result during the redirect cycle can
  // otherwise bounce the user straight back to /dashboard, making it
  // impossible to switch users.
  if (!sp.signedOut) {
    const session = await auth();
    if (session?.user) redirect("/dashboard");
  }
  return (
    <div className="bg-night-hero">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-sm flex-col justify-center px-6 py-16 text-slate-200">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in</h1>
            {sp.registered && (
              <p className="mt-2 rounded-md border border-emerald-400/30 bg-emerald-500/[0.08] p-2 text-sm text-emerald-300">
                Account created — sign in to continue.
              </p>
            )}
            {sp.signedOut && (
              <p className="mt-2 rounded-md border border-indigo-400/30 bg-indigo-500/[0.08] p-2 text-sm text-indigo-300">
                Signed out. Sign in with a different account if you want to switch users.
              </p>
            )}
          </div>
          <SignInForm />
          <p className="text-sm text-slate-400">
            New here?{" "}
            <Link href="/sign-up" className="text-indigo-300 hover:text-indigo-200">
              Create an account
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
