import type { DtcCategory, EligibilityResult, FactField } from "@/lib/types";
import { FactBook, ResultBuilder, benefitYearLabel, benefitYearOf, round2, sum, type RuleContext } from "./framework";
import { CANADA_DISABILITY_BENEFIT as CDB } from "./params";

const CATEGORIES: DtcCategory[] = [
  "vision", "speaking", "hearing", "walking", "eliminating", "feeding", "dressing",
  "mental_functions", "life_sustaining_therapy", "cumulative",
];

type Limits = { maxAnnual: number; exemption: number; threshold: number; rate: number };

/** Yearly Canada Disability Benefit for one beneficiary. */
export function canadaDisabilityBenefit(familyNetIncome: number, workingIncome: number, p: Limits): number {
  const exempt = Math.min(workingIncome, p.exemption);
  return Math.max(0, round2(p.maxAnnual - p.rate * Math.max(0, familyNetIncome - exempt - p.threshold)));
}

function limitsFor(benefitYear: string, couple: boolean, bothBeneficiaries: boolean): Limits | undefined {
  const maxAnnual = CDB.maxAnnual.value[benefitYear];
  if (maxAnnual === undefined) return undefined;
  return {
    maxAnnual,
    exemption: couple ? CDB.workingIncomeExemption.value.couple : CDB.workingIncomeExemption.value.single,
    threshold: couple ? CDB.incomeThreshold.value.couple : CDB.incomeThreshold.value.single,
    rate: bothBeneficiaries ? CDB.reductionRate.value.bothBeneficiaries : CDB.reductionRate.value.single,
  };
}

export function evaluateCanadaDisabilityBenefit(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  if (book.bool("benefits.receivesCdb")) return null;
  const hasLimitation = CATEGORIES.some((c) => book.bool(`limitation.${c}` as FactField) === true);
  const dtcApproved = book.bool("benefits.dtcApproved") === true;
  if (!hasLimitation && !dtcApproved) return null;

  const age = book.number("person.age");
  const r = new ResultBuilder("canada_disability_benefit", benefitYearOf(ctx.asOf));
  r.citeParams("Canada Disability Benefit amounts", CDB.maxAnnual, CDB.incomeThreshold, CDB.supplementalOneTime);
  if (age === undefined) return r.need("person.age").done("possible");
  if (age < 18 || age > 64) return null;

  const status = book.string("person.maritalStatus");
  const couple = status === "married" || status === "common_law";
  const income = book.number("money.familyNetIncome") ?? book.number("money.netIncome");
  if (income === undefined) return r.need("money.netIncome").done("possible");
  const working = book.number("money.workingIncome") ?? 0;

  const current = benefitYearOf(ctx.asOf);
  const limits = limitsFor(current, couple, false)!;
  const annual = canadaDisabilityBenefit(income, working, limits);
  if (annual <= 0) {
    r.because(`Income of $${income.toLocaleString()} reduces the benefit to $0.`);
    return r.done("not_eligible");
  }

  // Back pay: each month from the later of July 2025 or 24 months ago, through this month, at that period's rate.
  const [firstYear, firstMonth] = CDB.firstPaidMonth.value.split("-").map(Number);
  const months: { year: number; month: number }[] = [];
  for (let back = CDB.backPayMaxMonths.value - 1; back >= 0; back--) {
    const d = new Date(ctx.asOf.getFullYear(), ctx.asOf.getMonth() - back, 1);
    if (d.getFullYear() * 12 + d.getMonth() >= firstYear * 12 + (firstMonth - 1)) months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  const monthly = (m: { year: number; month: number }) => {
    const by = benefitYearLabel(m.month >= 6 ? m.year : m.year - 1);
    const p = limitsFor(by, couple, false);
    return p ? canadaDisabilityBenefit(income, working, p) / 12 : 0;
  };
  const backPay = sum(months.map(monthly)) + CDB.supplementalOneTime.value;

  if (dtcApproved) {
    r.because("Disability Tax Credit already approved, so the client can apply now.");
  } else {
    r.because("Depends on the Disability Tax Credit being approved first; apply for both.");
  }
  r.because(`Includes the one-time $${CDB.supplementalOneTime.value} supplemental amount.`);
  r.assume("Applicant (and spouse) filed last year's tax return. 2026-27 income thresholds aren't published yet; 2025-26 values used.");
  return r.done(dtcApproved ? "likely" : "possible", { annual, backPay: round2(backPay) });
}
