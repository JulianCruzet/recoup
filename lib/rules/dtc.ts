import type { DtcCategory, EligibilityResult, FactField } from "@/lib/types";
import { FactBook, ResultBuilder, round2, sum, type RuleContext } from "./framework";
import { DTC } from "./params";

const CATEGORY_NAMES: Record<DtcCategory, string> = {
  vision: "seeing",
  speaking: "speaking",
  hearing: "hearing",
  walking: "walking",
  eliminating: "bladder or bowel functions",
  feeding: "feeding",
  dressing: "dressing",
  mental_functions: "mental functions for everyday life",
  life_sustaining_therapy: "life-sustaining therapy",
  cumulative: "the combined effect of several limitations",
};
const CATEGORIES = Object.keys(CATEGORY_NAMES) as DtcCategory[];

const rate = (year: number): number => DTC.creditRate.value[String(year)] ?? 0;
const base = (year: number): number => DTC.baseAmount.value[String(year)] ?? 0;
const supplement = (year: number): number => DTC.childSupplement.value[String(year)] ?? 0;

/** The disability amount for one year (no child care or attendant care claimed). */
export function dtcAmount(year: number, under18: boolean): number {
  return base(year) + (under18 ? supplement(year) : 0);
}

/** Non-refundable credit for one year, capped at the federal tax the claimant owed (when known). */
export function dtcCredit(year: number, under18: boolean, taxBeforeDtc = Infinity): number {
  return Math.min(round2(rate(year) * dtcAmount(year, under18)), taxBeforeDtc);
}

/** Tax years still claimable when CRA receives the request in `requestYear`. */
export function claimableYears(requestYear: number, sinceYear: number): number[] {
  const first = Math.max(requestYear - DTC.lookbackYears.value, sinceYear, 2016);
  const years: number[] = [];
  for (let y = first; y <= requestYear - 1; y++) years.push(y);
  return years;
}

function limitations(book: FactBook, prefix: "limitation" | `child.${number}.limitation`): DtcCategory[] {
  return CATEGORIES.filter((c) => book.bool(`${prefix}.${c}` as FactField) === true);
}

export function evaluateDtc(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  const requestYear = ctx.asOf.getFullYear();
  const r = new ResultBuilder("dtc", `tax years ${requestYear - DTC.lookbackYears.value}–${requestYear}`);
  r.citeParams("Disability tax credit amounts", DTC.baseAmount, DTC.creditRate, DTC.lookbackYears);

  let backPay = 0;
  let annual = 0;
  let status: "likely" | "possible" | null = null;
  let earliest = Infinity;

  // The client themselves.
  const own = limitations(book, "limitation");
  if (own.length > 0 && !book.bool("benefits.dtcApproved")) {
    const since = book.number("limitation.sinceYear");
    if (since === undefined) r.need("limitation.sinceYear");
    const years = claimableYears(requestYear, since ?? requestYear - DTC.lookbackYears.value);
    earliest = Math.min(earliest, years[0] ?? Infinity);

    const pastIncome = book.number("money.pastAnnualIncome");
    const stopped = book.number("work.stoppedYear");
    const net = book.number("money.netIncome") ?? 0;
    const hadTax = (year: number) => (stopped !== undefined && year > stopped ? net > 0 : (pastIncome ?? net) > 0);

    backPay += sum(years.filter(hadTax).map((y) => dtcCredit(y, false)));
    annual += net > 0 ? dtcCredit(requestYear, false) : 0;

    r.because(`Reports a lasting limitation in ${own.map((c) => CATEGORY_NAMES[c]).join(", ")}${since ? ` since ${since}` : ""}.`);
    if (net <= 0) {
      r.because("Worth $0 a year while there's no tax to reduce, but approval unlocks the Canada Disability Benefit.");
    }
    if (pastIncome !== undefined) {
      r.assume("Back years assume the client owed at least the credit in federal tax each working year; confirm with notices of assessment.");
      status = "possible";
    } else {
      status = status ?? "likely";
    }
  }

  // Each child, claimed by the supporting parent.
  for (const i of book.childIndexes()) {
    const childLimits = limitations(book, `child.${i}.limitation`);
    if (childLimits.length === 0 || book.bool(`child.${i}.dtcApproved`)) continue;
    const age = book.number(`child.${i}.age`);
    if (age === undefined) r.need(`child.${i}.age`);
    const since = book.number(`child.${i}.limitation.sinceYear`);
    const years = claimableYears(requestYear, since ?? requestYear - DTC.lookbackYears.value);
    earliest = Math.min(earliest, years[0] ?? Infinity);
    const under18 = (year: number) => age === undefined || age - (requestYear - year) < 18;

    backPay += sum(years.map((y) => dtcCredit(y, under18(y))));
    annual += dtcCredit(requestYear, under18(requestYear));
    const who = book.string(`child.${i}.name`)?.trim().split(/\s+/)[0] || `Child ${i + 1}`;
    r.because(`${who} has a lasting limitation in ${childLimits.map((c) => CATEGORY_NAMES[c]).join(", ")}; a parent can claim the credit for them.`);
    r.assume("The supporting parent owed at least the credit in federal tax each year (the credit is non-refundable) and claimed no child-care or attendant-care costs.");
    status = status ?? "likely";
  }

  if (status === null) return null;

  r.because("A medical practitioner has to certify Part B of form T2201; Recoup prepares a brief for that visit.");
  r.assume("Estimate, subject to CRA assessment. The Ontario disability amount is extra and not counted here.");
  if (earliest === requestYear - DTC.lookbackYears.value) {
    r.deadline(`${requestYear}-12-31`, `Requests CRA receives after Dec 31, ${requestYear} lose the ${earliest} tax year.`);
  }
  return r.done(status, { annual: round2(annual), backPay: round2(backPay) });
}
