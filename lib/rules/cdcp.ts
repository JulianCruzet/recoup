import type { EligibilityResult } from "@/lib/types";
import { FactBook, ResultBuilder, type RuleContext } from "./framework";
import { CDCP } from "./params";

/** Co-pay share for the Canadian Dental Care Plan, or null when income is too high. */
export function dentalCoPay(familyNetIncome: number): number | null {
  if (familyNetIncome >= CDCP.incomeLimit.value) return null;
  return CDCP.coPayBrackets.value.find((b) => familyNetIncome < b.below)?.rate ?? null;
}

export function evaluateCdcp(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  const r = new ResultBuilder("cdcp", "2026-27");
  r.citeParams("Canadian Dental Care Plan eligibility", CDCP.incomeLimit, CDCP.coPayBrackets);

  const hasDental = book.bool("money.hasPrivateDental");
  if (hasDental === true) {
    r.because("Already has dental coverage through a job or pension plan, which rules out the federal plan.");
    return r.done("not_eligible");
  }
  if (hasDental === undefined) r.need("money.hasPrivateDental");

  const income = book.number("money.familyNetIncome") ?? book.number("money.netIncome");
  if (income === undefined) return r.need("money.netIncome").done("possible");
  const coPay = dentalCoPay(income);
  if (coPay === null) {
    r.because(`Family net income of $${income.toLocaleString()} is above the $${CDCP.incomeLimit.value.toLocaleString()} limit.`);
    return r.done("not_eligible");
  }

  r.because(`Covers dental care with ${coPay === 0 ? "no co-pay" : `a ${coPay * 100}% co-pay`} at this income. It's a service, not a cash payment.`);
  const lastTaxYear = ctx.asOf.getFullYear() - 1;
  const lastFiled = book.number("tax.lastYearFiled");
  if (lastFiled === undefined) r.need("tax.lastYearFiled");
  else if (lastFiled < lastTaxYear) r.because(`The ${lastTaxYear} tax return has to be filed first.`);
  return r.done("likely");
}
