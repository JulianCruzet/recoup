import type { EligibilityResult } from "@/lib/types";
import {
  FactBook,
  ResultBuilder,
  benefitYearOf,
  monthsBefore,
  quarterKey,
  round2,
  sum,
  type RuleContext,
} from "./framework";
import { GIS_OAS, OAS_HISTORY } from "./params";

const OAS_AGE = 65;

/** Monthly GIS for a single pensioner, from the official Oct–Dec 2026 table formula. */
export function gisSingleMonthly(annualIncome: number, max = GIS_OAS.gisSingleMaxMonthly.value): number {
  const topUp = GIS_OAS.gisSingleTopUpMonthly.value;
  const base = Math.max(0, max - topUp - Math.floor(annualIncome / 24));
  const counted = Math.floor(Math.max(0, annualIncome - GIS_OAS.topUpExemption.value) / 12 / 4) * 4;
  return round2(base + Math.max(0, topUp - counted / 4));
}

/**
 * Monthly GIS for each partner of a couple where both receive OAS, from the official Oct–Dec 2026 table.
 * Income is the couple's combined income without OAS.
 */
export function gisCoupleMonthly(combinedIncome: number, max = GIS_OAS.gisCoupleMaxMonthly.value): number {
  const topUp = GIS_OAS.gisCoupleTopUpMonthly.value;
  const base = Math.max(0, max - topUp - Math.floor(combinedIncome / 48));
  const overExemption = Math.max(0, combinedIncome - GIS_OAS.coupleTopUpExemption.value);
  return round2(base + Math.max(0, topUp - Math.floor(overExemption / 96)));
}

/** Income GIS counts: last year's income minus OAS and part of any earnings. */
export function gisIncome(netIncome: number, workingIncome: number, oasReceived: number): number {
  const { full, halfOfNext } = GIS_OAS.earningsExemption.value;
  const exempt = Math.min(workingIncome, full) + 0.5 * Math.min(Math.max(0, workingIncome - full), halfOfNext);
  return Math.max(0, netIncome - oasReceived - exempt);
}

export function oasMonthly(age: number): number {
  return age >= 75 ? GIS_OAS.oasMonthly75plus.value : GIS_OAS.oasMonthly65to74.value;
}

export function evaluateGis(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  if (book.bool("benefits.receivesGis")) return null;
  const r = new ResultBuilder("gis", "Oct–Dec 2026 rates");
  r.citeParams("Guaranteed Income Supplement rates", GIS_OAS.gisSingleMaxMonthly, GIS_OAS.backPayMonths);

  const age = book.number("person.age");
  if (age === undefined) return r.need("person.age").done("possible");
  if (age < OAS_AGE) return null;

  const status = book.string("person.maritalStatus");
  if (status === undefined) r.need("person.maritalStatus");
  if (status === "married" || status === "common_law") return coupleGis(book, ctx, r, age);

  const net = book.number("money.netIncome");
  if (net === undefined) return r.need("money.netIncome").done("possible");
  const receivesOas = book.bool("benefits.receivesOas");
  const oasReceived = receivesOas ? (OAS_HISTORY.oasPaidAge65to74.value["2025"] ?? 0) : 0;
  const income = gisIncome(net, book.number("money.workingIncome") ?? 0, oasReceived);

  if (income >= GIS_OAS.gisSingleIncomeCutoff.value) {
    r.because(`Counted income of $${income.toLocaleString()} is above the $${GIS_OAS.gisSingleIncomeCutoff.value.toLocaleString()} limit for a single pensioner.`);
    return r.done("not_eligible");
  }

  const monthly = gisSingleMonthly(income);
  r.because(`Single, ${age}, with $${income.toLocaleString()} of counted income: about $${monthly.toFixed(2)} a month.`);
  if (!receivesOas) {
    r.because("GIS is only paid with Old Age Security, so apply for both together (form ISP-3550).");
  }

  // Back pay: up to 11 months, each at that quarter's maximum, minus the same income reduction.
  const reduction = GIS_OAS.gisSingleMaxMonthly.value - monthly;
  const months = monthsBefore(ctx.asOf, GIS_OAS.backPayMonths.value);
  const backPay = sum(
    months.map((m) => Math.max(0, (GIS_OAS.pastQuarterMax.value[quarterKey(m)] ?? GIS_OAS.gisSingleMaxMonthly.value) - reduction)),
  );
  r.citeParams("Past quarterly GIS maximums", GIS_OAS.pastQuarterMax);

  const lastFiled = book.number("tax.lastYearFiled");
  const lastTaxYear = ctx.asOf.getFullYear() - 1;
  if (lastFiled === undefined) r.need("tax.lastYearFiled");
  else if (lastFiled < lastTaxYear) {
    r.because(`GIS is based on last year's income, so the ${lastTaxYear - 1} and ${lastTaxYear} tax returns need to be filed first.`);
  }
  r.assume("Single-pensioner rates; back pay counts the 11 months before this month at each quarter's rate.");

  return r.done("likely", { annual: round2(monthly * 12), backPay: round2(backPay) });
}

/** GIS for one partner of a couple. Assumes the spouse also gets OAS, the lower of the two couple rates. */
function coupleGis(book: FactBook, ctx: RuleContext, r: ResultBuilder, age: number): EligibilityResult {
  const family = book.number("money.familyNetIncome");
  if (family === undefined) return r.need("money.familyNetIncome").done("possible");
  const oasPaid = OAS_HISTORY.oasPaidAge65to74.value["2025"] ?? 0;
  const ownOas = book.bool("benefits.receivesOas") ? oasPaid : 0;
  const income = gisIncome(family, book.number("money.workingIncome") ?? 0, ownOas + oasPaid);
  r.citeParams("GIS rates for couples", GIS_OAS.gisCoupleMaxMonthly, GIS_OAS.gisCoupleIncomeCutoff);

  if (income >= GIS_OAS.gisCoupleIncomeCutoff.value) {
    r.because(`Combined income of $${income.toLocaleString()} is above the $${GIS_OAS.gisCoupleIncomeCutoff.value.toLocaleString()} limit for a couple.`);
    return r.done("not_eligible");
  }

  const monthly = gisCoupleMonthly(income);
  r.because(`${age}, in a couple with $${income.toLocaleString()} of combined income besides OAS: about $${monthly.toFixed(2)} a month.`);
  r.because("Their spouse can apply for their own GIS too.");
  if (!book.bool("benefits.receivesOas")) r.because("GIS is only paid with Old Age Security, so apply for both together (form ISP-3550).");

  const reduction = GIS_OAS.gisCoupleMaxMonthly.value - monthly;
  const months = monthsBefore(ctx.asOf, GIS_OAS.backPayMonths.value);
  const backPay = sum(
    months.map((m) => Math.max(0, (GIS_OAS.pastQuarterMaxCouple.value[quarterKey(m)] ?? GIS_OAS.gisCoupleMaxMonthly.value) - reduction)),
  );

  const lastFiled = book.number("tax.lastYearFiled");
  const lastTaxYear = ctx.asOf.getFullYear() - 1;
  if (lastFiled === undefined) r.need("tax.lastYearFiled");
  else if (lastFiled < lastTaxYear) r.because(`GIS is based on last year's income, so both partners need to file their ${lastTaxYear} returns first.`);
  r.assume("Assumes the spouse also receives OAS. If they don't, the couple rate is higher, so this is the cautious figure.");

  return r.done("likely", { annual: round2(monthly * 12), backPay: round2(backPay) });
}

export function evaluateOas(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  if (book.bool("benefits.receivesOas")) return null;
  const age = book.number("person.age");
  if (age === undefined || age < OAS_AGE) return null;

  const r = new ResultBuilder("oas", benefitYearOf(ctx.asOf));
  r.citeParams("Old Age Security payments", GIS_OAS.oasMonthly65to74, OAS_HISTORY.fullResidenceYears);

  const years = book.number("person.yearsInCanadaSince18");
  const full = OAS_HISTORY.fullResidenceYears.value;
  if (years === undefined) {
    r.need("person.yearsInCanadaSince18").assume("Assumes a full pension (40+ years in Canada after age 18).");
  } else if (years < OAS_HISTORY.minimumResidenceYears.value) {
    r.because(`OAS needs at least ${OAS_HISTORY.minimumResidenceYears.value} years in Canada after 18; ${years} reported.`);
    return r.done("not_eligible");
  }
  const share = years === undefined ? 1 : Math.min(1, years / full);
  const monthly = oasMonthly(age) * share;
  r.because(`${age} and not receiving Old Age Security: about $${monthly.toFixed(2)} a month${share < 1 ? ` (partial: ${years} of ${full} years)` : ""}.`);
  r.assume("Back pay estimated at the current rate for up to 11 months.");

  return r.done("likely", {
    annual: round2(monthly * 12),
    backPay: round2(monthly * GIS_OAS.backPayMonths.value),
  });
}
