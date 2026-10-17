import type { EligibilityResult } from "@/lib/types";
import { FactBook, ResultBuilder, benefitYearOf, floorCents, round2, type RuleContext } from "./framework";
import { CCB } from "./params";

/** Yearly Canada Child Benefit for children of the given ages (2026-27 parameters). */
export function canadaChildBenefit(ages: number[], familyNetIncome: number): number {
  const kids = ages.filter((a) => a < 18);
  if (kids.length === 0) return 0;
  const k = Math.min(kids.length, 4) - 1;
  const max = kids.reduce((total, a) => total + (a < 6 ? CCB.maxUnder6.value : CCB.max6to17.value), 0);
  const t1 = CCB.threshold1.value;
  const t2 = CCB.threshold2.value;
  const reduction =
    familyNetIncome <= t1
      ? 0
      : familyNetIncome <= t2
        ? floorCents(CCB.ratesBetween.value[k] * (familyNetIncome - t1))
        : CCB.baseAbove.value[k] + floorCents(CCB.ratesAbove.value[k] * (familyNetIncome - t2));
  return Math.max(0, round2(max - reduction));
}

export function evaluateCcb(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  if (book.bool("benefits.receivesCcb")) return null;
  const indexes = book.childIndexes();
  if (indexes.length === 0) return null;

  const r = new ResultBuilder("ccb", benefitYearOf(ctx.asOf));
  r.citeParams("Canada Child Benefit amounts", CCB.max6to17, CCB.threshold1, CCB.threshold2);

  const ages = indexes.map((i) => book.number(`child.${i}.age`));
  indexes.forEach((i, n) => ages[n] === undefined && r.need(`child.${i}.age`));
  const known = ages.filter((a): a is number => a !== undefined);
  if (known.every((a) => a >= 18) && known.length === ages.length) return null;

  const income = book.number("money.familyNetIncome") ?? book.number("money.netIncome");
  if (income === undefined) return r.need("money.familyNetIncome").done("possible");

  const annual = canadaChildBenefit(known, income);
  if (annual <= 0) {
    r.because(`Family net income of $${income.toLocaleString()} reduces the benefit to $0.`);
    return r.done("not_eligible");
  }
  r.because(`${known.length} child${known.length === 1 ? "" : "ren"} under 18 with family net income of $${income.toLocaleString()}.`);
  r.because("Apply with form RC66; both parents must file a tax return every year to keep receiving it.");
  return r.done("likely", { annual });
}
