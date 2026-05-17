"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";

const SaveRatesInput = z.object({
  currency: z.enum(["GBP", "EUR", "USD"]),
  ratesJson: z.string().max(10_000),
});

/**
 * Persists the per-role hourly rates for the org. ratesJson is a JSON string of
 * { "<roleTitle>": <number>, ... } so the form can capture an arbitrary list
 * of roles without us needing to know them all upfront.
 */
export async function saveExerciseRatesAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = SaveRatesInput.parse(Object.fromEntries(formData));

  let rates: Record<string, number> = {};
  try {
    const candidate = JSON.parse(parsed.ratesJson) as unknown;
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      for (const [k, v] of Object.entries(candidate)) {
        if (typeof k !== "string" || k.length === 0 || k.length > 120) continue;
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100_000) continue;
        rates[k] = Math.round(v);
      }
    }
  } catch {
    rates = {};
  }

  await prisma.organization.update({
    where: { id: me.orgId },
    data: {
      defaultExerciseRates: rates,
      exerciseCostCurrency: parsed.currency,
    },
  });

  revalidatePath("/settings/exercise-rates");
  revalidatePath("/settings");
}
