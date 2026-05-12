import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignUpForm from "./SignUpForm";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <div className="bg-night-hero">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-16 text-slate-200">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Create your SnapFix account
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Free for up to 5 members. No card required.
            </p>
          </div>
          <SignUpForm />
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-indigo-300 hover:text-indigo-200">
              Sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
