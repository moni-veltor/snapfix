"use client";

import { Printer } from "lucide-react";

export default function StatementPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
    >
      <Printer size={13} />
      Print maturity statement
    </button>
  );
}
