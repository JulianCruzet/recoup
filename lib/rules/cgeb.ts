import type { EligibilityResult } from "@/lib/types";
import { FactBook, ResultBuilder, benefitYearOf, round2, type RuleContext } from "./framework";
import { CGEB } from "./params";

/** Yearly Canada Groceries and Essentials Benefit (July 2026 – June 2027). */
export function groceriesBenefit(familyNetIncome: number, married: boolean, children: number): number {
  const adult = CGEB.perAdult.value;
  const child = CGEB.perChild.value;
  let amount = adult + (married ? adult : 0);
  if (!married && children > 0) {
    // A single parent's first child counts like a spouse, plus the single supplement.
    amount += adult + CGEB.singleSupplementMax.value + child * (children - 1);
  } else {
    amount += child * children;
  }
  if (!married && children === 0) {
    amount += Math.min(
      CGEB.singleSupplementMax.value,
      CGEB.singleSupplementRate.value * Math.max(0, familyNetIncome - CGEB.singleSupplementStart.value),
    );
  }
  return Math.max(0, round2(amount - CGEB.reductionRate.value * Math.max(0, familyNetIncome - CGEB.reductionThreshold.value)));
}

export function evaluateCgeb(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  const lastTaxYear = ctx.asOf.getFullYear() - 1;
  const lastFiled = book.number("tax.lastYearFiled");
  // People who filed last year already get it automatically.
  if (lastFiled !== undefined && lastFiled >= lastTaxYear) return null;

  const r = new ResultBuilder("cgeb", benefitYearOf(ctx.asOf));
  r.citeParams("Canada Groceries and Essentials Benefit amounts", CGEB.perAdult, CGEB.reductionThreshold);
  if (lastFiled === undefined) r.need("tax.lastYearFiled");

  const income = book.number("money.familyNetIncome") ?? book.number("money.netIncome");
  if (income === undefined) return r.need("money.netIncome").done("possible");
  const status = book.string("person.maritalStatus");
  if (status === undefined) r.need("person.maritalStatus");
  const married = status === "married" || status === "common_law";
  const children = book.childIndexes().filter((i) => (book.number(`child.${i}.age`) ?? 0) < 19).length;

  const annual = groceriesBenefit(income, married, children);
  if (annual <= 0) {
    r.because(`Family net income of $${income.toLocaleString()} reduces it to $0.`);
    return r.done("not_eligible");
  }
  r.because(`Paid automatically once the ${lastTaxYear} tax return is filed; no separate application.`);
  r.assume("Filing missed years may also release past GST/HST credit payments, subject to CRA assessment (not counted).");
  return r.done("likely", { annual });
}
