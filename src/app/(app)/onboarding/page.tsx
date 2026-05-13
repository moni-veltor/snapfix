import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";

export default async function OnboardingPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">No organisation yet</h1>
      <p className="text-sm text-slate-600">
        You're signed in as <span className="font-mono">{user.email}</span>, but you don't belong to an
        organisation. To get started, ask an admin to invite you — or sign out and create a new
        organisation.
      </p>
      <div className="flex gap-3">
        <form action={signOutAction}>
          <button className="rounded-md border border-line-strong px-4 py-2 text-sm">Sign out</button>
        </form>
        <Link
          href="/sign-up"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Create a new organisation
        </Link>
      </div>
    </div>
  );
}
