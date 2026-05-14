"use client";

import { useState } from "react";

type Answer = "YES" | "NO" | null;

const QUESTIONS: { id: string; text: string; hint: string }[] = [
  {
    id: "customer-impact",
    text: "Is customer-facing impact happening now, or imminent (next 30 min)?",
    hint: "Any IBS at risk, payments delayed, customers unable to access funds, calls being dropped.",
  },
  {
    id: "ibs-tolerance",
    text: "Is an Important Business Service at risk of breaching its impact tolerance?",
    hint: "Tolerance breach is a regulator-visible event. Don't wait until it's actually breached.",
  },
  {
    id: "consumer-duty",
    text: "Could this affect customers' ability to access funds, complete transactions or exercise rights?",
    hint: "If yes, Consumer Duty (FCA PS22/3) promotes this to High regardless of financial threshold.",
  },
  {
    id: "cyber",
    text: "Is there any indication this is a cyber, ransomware or data exfiltration event?",
    hint: "Default-to-High rule kicks in. You almost never have enough information in the first hour.",
  },
  {
    id: "media",
    text: "Is the event already public, or visible enough that media coverage is plausible today?",
    hint: "Once it's in social media or a journalist's DM, internal control of the story is gone.",
  },
];

export default function InvocationWalker() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const yesCount = Object.values(answers).filter((a) => a === "YES").length;
  const answered = Object.values(answers).filter(Boolean).length;
  const done = answered === QUESTIONS.length;

  const set = (id: string, value: Answer) =>
    setAnswers((prev) => ({ ...prev, [id]: prev[id] === value ? null : value }));

  const reset = () => setAnswers({});

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-white">Decision walker</h3>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Reset
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Answer the five questions. Any single Yes recommends standing up the IMT.
      </p>

      <ol className="space-y-3">
        {QUESTIONS.map((q, i) => {
          const a = answers[q.id];
          return (
            <li key={q.id} className="rounded-md border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-200">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{q.text}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{q.hint}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => set(q.id, "YES")}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${
                        a === "YES"
                          ? "bg-rose-500 text-white"
                          : "bg-white/[0.04] text-slate-300 hover:bg-rose-500/20 hover:text-rose-100"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => set(q.id, "NO")}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${
                        a === "NO"
                          ? "bg-emerald-600 text-white"
                          : "bg-white/[0.04] text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-100"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {done && (
        <Recommendation yesCount={yesCount} answers={answers} />
      )}
    </div>
  );
}

function Recommendation({
  yesCount,
  answers,
}: {
  yesCount: number;
  answers: Record<string, Answer>;
}) {
  const cyberYes = answers["cyber"] === "YES";
  const consumerDutyYes = answers["consumer-duty"] === "YES";

  if (yesCount === 0) {
    return (
      <div className="rounded-md border border-emerald-400/30 bg-emerald-500/[0.08] p-4 text-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
          Recommendation
        </div>
        <div className="mt-1 text-lg font-bold text-emerald-50">Continue monitoring — don't invoke yet</div>
        <p className="mt-2 text-xs text-emerald-100/90">
          No trigger conditions are met. Keep eyes on the situation, log observations to the
          incident log, and reassess every 15–30 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-rose-400/40 bg-rose-500/[0.1] p-4 text-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-rose-200">
        Recommendation
      </div>
      <div className="text-lg font-bold text-rose-50">🚨 Stand up the IMT now</div>
      <p className="text-xs text-rose-100/90">
        {yesCount} trigger condition{yesCount === 1 ? "" : "s"} met. Per best practice,{" "}
        <em>"it is better to stand it up and back down than to fail to stand it up."</em>
      </p>
      {cyberYes && (
        <p className="rounded bg-white/10 p-2 text-[11px]">
          ⚠️ <strong>Cyber default rule</strong>: assess as High severity unless you have
          immediate, defensible reason to assess down.
        </p>
      )}
      {consumerDutyYes && (
        <p className="rounded bg-white/10 p-2 text-[11px]">
          ⚠️ <strong>Consumer Duty trigger</strong>: severity is High regardless of financial
          threshold. FCA + PRA 4-hour notification clocks will start on invocation.
        </p>
      )}
    </div>
  );
}
