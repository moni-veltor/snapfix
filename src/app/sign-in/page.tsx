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
  if (session?.user) redirect("/scenarios");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        {sp.registered && (
          <p className="mt-1 text-sm text-emerald-700">
            Account created — sign in to continue.
          </p>
        )}
      </div>
      <SignInForm />
      <p className="text-sm text-slate-600">
        New here?{" "}
        <Link href="/sign-up" className="underline">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
