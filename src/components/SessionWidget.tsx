import Link from "next/link";
import type { Session } from "next-auth";
import { signOutAction } from "@/app/actions/auth";

export default function SessionWidget({ session }: { session: Session | null }) {
  if (!session?.user) {
    return (
      <Link
        href="/sign-in"
        className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
      >
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-600">
        {session.user.name ?? session.user.email}
        {session.user.orgRole && (
          <span className="ml-1 text-xs text-soft">({session.user.orgRole})</span>
        )}
      </span>
      <form action={signOutAction}>
        <button className="text-muted hover:text-slate-900" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
