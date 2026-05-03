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
      className="space-y-3"
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
          router.push("/scenarios");
          router.refresh();
        });
      }}
    >
      <Field label="Email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required />
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  );
}
