import type { DtcCategory, EligibilityResult, FactField } from "@/lib/types";
import {
  FactBook,
  ResultBuilder,
  benefitYearLabel,
  benefitYearOf,
  benefitYearStart,
  floorCents,
  round2,
  sum,
  type RuleContext,
} from "./framework";
import { CHILD_DISABILITY_BENEFIT as CDB, DTC } from "./params";

const CATEGORIES: DtcCategory[] = [
  "vision", "speaking", "hearing", "walking", "eliminating", "feeding", "dressing",
  "mental_functions", "life_sustaining_therapy", "cumulative",
];

/** Yearly amount for `children` eligible children in one benefit year, after the income reduction. */
export function childDisabilityBenefit(benefitYear: string, children: number, familyNetIncome: number): number | undefined {
  const amount = CDB.annualAmount.value[benefitYear];
  if (amount === undefined || children <= 0) return undefined;
  const threshold = CDB.reductionThreshold.value[benefitYear];
  const rate = children === 1 ? CDB.reductionRate.value.oneChild : CDB.reductionRate.value.twoOrMore;
  // Older years have no published threshold here; they're only used when income is below every known one.
  const lowestKnown = Math.min(...Object.values(CDB.reductionThreshold.value));
  if (threshold === undefined) return familyNetIncome <= lowestKnown ? amount * children : undefined;
  return Math.max(0, amount * children - floorCents(rate * Math.max(0, familyNetIncome - threshold)));
}

export function evaluateChildDisabilityBenefit(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  const kids = book.childIndexes().filter((i) => {
    const age = book.number(`child.${i}.age`);
    const limited = CATEGORIES.some((c) => book.bool(`child.${i}.limitation.${c}` as FactField) === true);
    // An approved DTC means CRA already pays this with the Canada Child Benefit.
    const alreadyApproved = book.bool(`child.${i}.dtcApproved` as FactField) === true;
    return limited && !alreadyApproved && (age === undefined || age < 18);
  });
  if (kids.length === 0) return null;

  const current = benefitYearOf(ctx.asOf);
  const r = new ResultBuilder("child_disability_benefit", current);
  r.citeParams("Child Disability Benefit amounts", CDB.annualAmount, CDB.reductionThreshold, CDB.automaticYears);

  const income = book.number("money.familyNetIncome") ?? book.number("money.netIncome");
  if (income === undefined) return r.need("money.familyNetIncome").done("possible");
  if (book.bool("benefits.receivesCcb") === false) {
    r.because("Paid with the Canada Child Benefit, so the family needs to apply for that too (form RC66).");
  } else if (book.bool("benefits.receivesCcb") === undefined) {
    r.need("benefits.receivesCcb");
  }

  const currentStart = benefitYearStart(current);
  const automatic = Array.from({ length: CDB.automaticYears.value }, (_, k) => benefitYearLabel(currentStart - k));
  const autoAmounts = automatic.map((by) => childDisabilityBenefit(by, kids.length, income) ?? 0);

  // Older benefit years can be requested in writing back to base year (request year - 10); CRA may refuse.
  const requestYear = ctx.asOf.getFullYear();
  const earliestStart = requestYear - DTC.lookbackYears.value + 1;
  const requestable: string[] = [];
  for (let s = currentStart - CDB.automaticYears.value; s >= earliestStart; s--) requestable.push(benefitYearLabel(s));
  const requestAmount = sum(requestable.map((by) => childDisabilityBenefit(by, kids.length, income) ?? 0));

  r.because(
    `Once the Disability Tax Credit is approved, CRA pays this for ${kids.length === 1 ? "the child" : `${kids.length} children`} automatically: back pay for ${automatic.slice(1).join(" and ")}, then ${automatic[0]} onward as it comes.`,
  );
  if (requestAmount > 0) {
    r.because(
      `Up to $${Math.round(requestAmount).toLocaleString()} more for ${requestable[requestable.length - 1]} to ${requestable[0]} by written request, which CRA may refuse (not counted).`,
    );
  }
  r.assume("Family net income stayed about the same in every base year.");

  // The current benefit year is the yearly amount, so back pay is only the years before it.
  return r.done("likely", {
    annual: round2(autoAmounts[0]),
    backPay: round2(sum(autoAmounts.slice(1))),
  });
}
