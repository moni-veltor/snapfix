import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignInForm from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const sp = await searchParams;
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
