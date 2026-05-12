import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignUpForm from "./SignUpForm";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <SignUpForm />
      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
