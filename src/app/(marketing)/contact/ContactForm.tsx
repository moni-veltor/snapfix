"use client";

import { useActionState } from "react";
import { sendContactMessageAction, type ContactState } from "@/app/actions/contact";

export default function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendContactMessageAction,
    undefined,
  );
  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border border-white/[0.08] bg-[color:var(--night-surface)] p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required maxLength={120} />
        <Field label="Work email" name="email" type="email" required maxLength={200} />
        <Field label="Firm" name="firm" required maxLength={120} />
        <Select
          label="Firm tier (rough guess is fine)"
          name="tier"
          options={[
            { v: "", l: "—" },
            { v: "TIER_1", l: "Tier 1 — Global universal" },
            { v: "TIER_2", l: "Tier 2 — Digital challenger" },
            { v: "TIER_3", l: "Tier 3 — New / smaller bank" },
            { v: "OTHER", l: "Other" },
          ]}
        />
      </div>
      <Select
        label="What are you interested in?"
        name="interest"
        options={[
          { v: "demo", l: "A platform demo" },
          { v: "consulting", l: "Consulting / facilitation" },
          { v: "starter", l: "Pricing & trial — Starter plan" },
          { v: "growth", l: "Pricing & trial — Growth plan" },
          { v: "enterprise", l: "Enterprise discussion" },
          { v: "other", l: "Something else" },
        ]}
      />
      <Textarea
        label="Tell us a bit more"
        name="message"
        rows={5}
        placeholder="What's on your mind? Any specific scenarios, deadlines or regulator context we should know about."
      />
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
      {state?.ok && (
        <p className="rounded-md border border-emerald-400/30 bg-emerald-500/[0.08] p-3 text-sm text-emerald-300">
          Thanks — we've received your message and will be in touch shortly.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-500 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send message"}
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

function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <textarea
        {...props}
        className="mt-1 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
      />
    </label>
  );
}

function Select({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <select
        {...props}
        className="mt-1 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-[color:var(--night-surface)]">
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}
