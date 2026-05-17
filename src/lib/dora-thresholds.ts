import "server-only";

/**
 * DORA major-incident classification helpers.
 *
 * Based on the criteria framework for "major" ICT-related incident
 * classification under DORA. The thresholds here are tuned for planning-
 * time advisory (does this scenario *plausibly* trigger DORA notification),
 * not runtime classification of a real incident.
 *
 * Runtime classification — when the incident is actually live and the
 * severity is being set — uses the same primitives but with real numbers
 * captured during the exercise (actual clients affected, actual duration).
 */

export type Jurisdiction = "UK" | "EU" | "UK_AND_EU" | "US" | "GLOBAL";

/** True when DORA-style thresholds apply for this jurisdiction. */
export function doraApplies(jurisdiction: Jurisdiction): boolean {
  return jurisdiction === "EU" || jurisdiction === "UK_AND_EU" || jurisdiction === "GLOBAL";
}

export type DoraInput = {
  /** Approx number of clients affected (>= 0). */
  clientsAffected?: number;
  /** Estimated service-interruption duration in minutes. */
  durationMin?: number;
  /** True if personal data is impacted (drives GDPR Art. 33 path). */
  hasPersonalData?: boolean;
  /** True if the incident attracts material media or social attention. */
  hasReputationalImpact?: boolean;
  /** Number of EU member states affected. */
  memberStatesAffected?: number;
  /** Economic impact as a % of group operating profit, 0..100. */
  economicImpactPct?: number;
  /** True when ≥1 affected service is on the firm's IBS / critical services list. */
  affectsCriticalService?: boolean;
};

export type DoraEvaluation = {
  isMajor: boolean;
  criteriaMet: string[];
  /** When a notification cadence is recommended, the next due milestone. */
  notificationMilestone: "24h-initial" | "72h-intermediate" | "1mo-final" | null;
  /** Plain-English summary suitable for a planning-time advisory banner. */
  summary: string;
};

/** Tunable thresholds. Conservative defaults; tweak as DORA RTS guidance settles. */
export const DORA_THRESHOLDS = {
  clientsAffectedMajor: 10000,
  durationMajorMin: 60 * 24, // 24h
  memberStatesMajor: 2,
  economicImpactMajorPct: 10,
};

export function evaluateDora(input: DoraInput): DoraEvaluation {
  const c = input.clientsAffected ?? 0;
  const d = input.durationMin ?? 0;
  const m = input.memberStatesAffected ?? 0;
  const e = input.economicImpactPct ?? 0;

  const met: string[] = [];
  if (c >= DORA_THRESHOLDS.clientsAffectedMajor) met.push(`Clients affected ≥ ${DORA_THRESHOLDS.clientsAffectedMajor.toLocaleString()}`);
  if (d >= DORA_THRESHOLDS.durationMajorMin) met.push("Duration ≥ 24h");
  if (m >= DORA_THRESHOLDS.memberStatesMajor) met.push(`Geographical spread ≥ ${DORA_THRESHOLDS.memberStatesMajor} member states`);
  if (e >= DORA_THRESHOLDS.economicImpactMajorPct) met.push(`Economic impact ≥ ${DORA_THRESHOLDS.economicImpactMajorPct}% of group profit`);
  if (input.hasPersonalData) met.push("Personal data impacted (UK GDPR Art. 33 also triggered)");
  if (input.hasReputationalImpact) met.push("Material reputational impact");
  if (input.affectsCriticalService) met.push("Critical / Important Business Service affected");

  const isMajor = met.length >= 2 || (input.affectsCriticalService === true && d >= 60);

  return {
    isMajor,
    criteriaMet: met,
    notificationMilestone: isMajor ? "24h-initial" : null,
    summary: isMajor
      ? "Likely classifiable as a major ICT incident — ESA notification clocks would start at severity classification (24h initial / 72h intermediate / 1mo final)."
      : met.length > 0
        ? "Edges close to one or more major-incident criteria but currently below the major threshold."
        : "Below the major-incident thresholds on the captured criteria.",
  };
}

/**
 * Planning-time advisory based on what a scenario *could* trigger, given
 * its risk-coverage flags + impact narrative. This is intentionally
 * conservative — we'd rather say "this might be DORA-major" than miss it.
 */
export function previewDoraForScenario(scenario: {
  coversTechnology?: boolean;
  coversDataAvailability?: boolean;
  coversDataIntegrity?: boolean;
  coversThirdParty?: boolean;
  durationMin?: number;
}): DoraEvaluation {
  const couldHitDuration = (scenario.durationMin ?? 0) >= 60 * 4;
  const dataAffected = !!(scenario.coversDataAvailability || scenario.coversDataIntegrity);
  return evaluateDora({
    durationMin: couldHitDuration ? DORA_THRESHOLDS.durationMajorMin : (scenario.durationMin ?? 0),
    hasPersonalData: dataAffected,
    affectsCriticalService: !!(scenario.coversTechnology || scenario.coversThirdParty),
  });
}
