"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded-xl border border-white/[0.08] bg-[color:var(--night-surface)] p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const res = await signIn("credentials", {
            email: String(fd.get("email") ?? ""),
            password: String(fd.get("password") ?? ""),
            redirect: false,
          });
          if (!res || res.error) {
            setError("Invalid email or password.");
            return;
          }
          router.push("/dashboard");
          router.refresh();
        });
      }}
    >
      <Field label="Email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
      />
    </label>
  );
}
