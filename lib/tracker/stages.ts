import type { ProgramId } from "@/lib/types";

export const STAGES = [
  "identified",
  "preparing",
  "ready_to_sign",
  "signed",
  "submitted",
  "in_review",
  "more_info",
  "approved",
  "denied",
  "paid",
  "closed",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  identified: "Identified",
  preparing: "Preparing",
  ready_to_sign: "Ready to sign",
  signed: "Signed",
  submitted: "Submitted",
  in_review: "In review",
  more_info: "More info requested",
  approved: "Approved",
  denied: "Denied",
  paid: "Paid",
  closed: "Closed",
};

/** Moves staff can make by hand. Government outcomes (approved/denied/more_info/paid) come from letters or the client. */
const NEXT: Record<Stage, Stage[]> = {
  identified: ["preparing", "closed"],
  preparing: ["ready_to_sign", "closed"],
  ready_to_sign: ["signed", "closed"],
  signed: ["submitted"],
  submitted: ["in_review", "more_info", "approved", "denied"],
  in_review: ["more_info", "approved", "denied"],
  more_info: ["in_review", "approved", "denied"],
  approved: ["paid"],
  denied: ["closed"],
  paid: ["closed"],
  closed: [],
};

export function canMove(from: Stage, to: Stage): boolean {
  return NEXT[from].includes(to);
}

export function nextStages(from: Stage): Stage[] {
  return NEXT[from];
}

/** Days from submission to a decision that the program's published standard (or our assumption) expects. */
export const DECISION_DAYS: Partial<Record<ProgramId, { days: number; note: string; sourceUrl?: string }>> = {
  dtc: {
    days: 56,
    note: "CRA's service standard is 8 weeks; the Taxpayers' Ombudsperson reported up to 15 weeks in 2025.",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit.html",
  },
  canada_disability_benefit: {
    days: 28,
    note: "Service Canada aims to decide within 28 days once the DTC is approved.",
    sourceUrl: "https://www.canada.ca/en/services/benefits/disability/canada-disability-benefit.html",
  },
  ccb: { days: 56, note: "Assumed 8 weeks for an online application; paper takes longer." },
  gis: { days: 42, note: "Assumed about 6 weeks; check the client's letter for the actual timeline." },
  oas: { days: 84, note: "Assumed about 12 weeks." },
  child_disability_benefit: { days: 14, note: "Paid with the next CCB payment after the DTC is approved (assumed)." },
};

export const DEFAULT_DECISION_DAYS = 56;
