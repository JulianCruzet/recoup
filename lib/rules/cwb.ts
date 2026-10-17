import type { EligibilityResult } from "@/lib/types";
import { FactBook, ResultBuilder, round2, type RuleContext } from "./framework";
import { CWB } from "./params";

/** Basic Canada Workers Benefit for the 2025 tax year. */
export function workersBenefit(workingIncome: number, adjustedNetIncome: number, family: boolean): number {
  const max = family ? CWB.maxFamily.value : CWB.maxSingle.value;
  const threshold = family ? CWB.thresholdFamily.value : CWB.thresholdSingle.value;
  const phasedIn = Math.min(max, CWB.phaseInRate.value * Math.max(0, workingIncome - CWB.phaseInStart.value));
  return Math.max(0, round2(phasedIn - CWB.reductionRate.value * Math.max(0, adjustedNetIncome - threshold)));
}

export function evaluateCwb(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  const working = book.number("money.workingIncome");
  const age = book.number("person.age");
  if (!working || (age !== undefined && age < 19)) return null;
  // Claimed on last year's return: if that's filed, CRA has already paid it.
  const filed = book.number("tax.lastYearFiled");
  if (filed !== undefined && filed >= ctx.asOf.getFullYear() - 1) return null;
  const income = book.number("money.familyNetIncome") ?? book.number("money.netIncome");
  if (income === undefined) return null;
  const status = book.string("person.maritalStatus");
  const family = status === "married" || status === "common_law" || book.childIndexes().length > 0;
  const annual = workersBenefit(working, income, family);
  if (annual <= 0) return null;

  const r = new ResultBuilder("cwb", `${ctx.asOf.getFullYear() - 1} tax year`);
  r.citeParams("Canada Workers Benefit amounts", CWB.maxSingle, CWB.thresholdSingle);
  r.because(`Working income of $${working.toLocaleString()} with net income of $${income.toLocaleString()}.`);
  r.because("Claimed on the tax return (Schedule 6); part can be paid in advance.");
  return r.done("likely", { annual });
}
