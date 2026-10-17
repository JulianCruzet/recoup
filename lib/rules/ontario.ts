import type { EligibilityResult } from "@/lib/types";
import { FactBook, ResultBuilder, benefitYearOf, floorCents, round2, type RuleContext } from "./framework";
import { GAINS, OAS_HISTORY, TRILLIUM } from "./params";

/** Monthly GAINS for a single senior; private income excludes OAS and GIS. */
export function gainsSingleMonthly(privateIncome: number): number {
  return Math.max(0, GAINS.maxMonthlySingle.value - GAINS.reductionPer24.value * Math.floor(privateIncome / 24));
}

export function evaluateGains(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  const age = book.number("person.age");
  if (age === undefined || age < 65 || book.string("person.province") === undefined) return null;
  if (book.string("person.province") !== "ON") return null;
  const status = book.string("person.maritalStatus");
  if (status === "married" || status === "common_law") return null;
  // Paid automatically alongside GIS, so someone already on GIS already gets it.
  if (book.bool("benefits.receivesGis") === true) return null;
  const years = book.number("person.yearsInCanadaSince18");
  if (years !== undefined && years < OAS_HISTORY.minimumResidenceYears.value) return null;

  const r = new ResultBuilder("ontario_gains", benefitYearOf(ctx.asOf));
  r.citeParams("Ontario GAINS rates", GAINS.maxMonthlySingle, GAINS.reductionPer24);
  const net = book.number("money.netIncome");
  if (net === undefined) return r.need("money.netIncome").done("possible");
  // Private income is everything except OAS and GIS.
  const oasReceived = book.bool("benefits.receivesOas") ? Math.min(net, OAS_HISTORY.oasPaidAge65to74.value["2025"] ?? 0) : 0;
  const privateIncome = Math.max(0, net - oasReceived);
  const monthly = gainsSingleMonthly(privateIncome);
  if (monthly <= 0) {
    r.because(`Private income of $${privateIncome.toLocaleString()} is above the $${GAINS.incomeLimitSingle.value.toLocaleString()} limit.`);
    return r.done("not_eligible");
  }
  r.because(`Ontario tops up OAS and GIS for low-income seniors: about $${monthly.toFixed(2)} a month.`);
  r.because("Paid automatically once GIS is in place; no separate application.");
  return r.done("likely", { annual: round2(monthly * 12) });
}

/** Ontario energy and property tax credit (2026 benefit year). `rent` and `propertyTax` are yearly. */
export function energyPropertyCredit(rent: number, propertyTax: number, familyNetIncome: number, senior: boolean, singleNoKids: boolean): number {
  const occupancy = TRILLIUM.occupancyRentShare.value * rent + propertyTax;
  const energy = Math.min(occupancy, TRILLIUM.energyMax.value);
  const property = senior
    ? Math.min(occupancy, TRILLIUM.seniorPropertyBase.value + Math.min(0.1 * occupancy, TRILLIUM.seniorPropertyExtraMax.value))
    : Math.min(occupancy, TRILLIUM.propertyBase.value + Math.min(0.1 * occupancy, TRILLIUM.propertyExtraMax.value));
  const threshold = !senior && singleNoKids ? TRILLIUM.thresholdSingleNoKids.value : TRILLIUM.thresholdOther.value;
  return Math.max(0, round2(energy + property - floorCents(TRILLIUM.oeptcReductionRate.value * Math.max(0, familyNetIncome - threshold))));
}

/** Ontario sales tax credit for `persons` adults and children. */
export function salesTaxCredit(familyNetIncome: number, persons: number, singleNoKids: boolean): number {
  const threshold = singleNoKids ? TRILLIUM.thresholdSingleNoKids.value : TRILLIUM.thresholdOther.value;
  return Math.max(0, round2(TRILLIUM.salesTaxPerPerson.value * persons - floorCents(TRILLIUM.salesTaxReductionRate.value * Math.max(0, familyNetIncome - threshold))));
}

export function evaluateTrillium(book: FactBook, ctx: RuleContext): EligibilityResult | null {
  if (book.string("person.province") !== "ON") return null;
  const lastTaxYear = ctx.asOf.getFullYear() - 1;
  const lastFiled = book.number("tax.lastYearFiled");
  // Filers already get it automatically with their return.
  if (lastFiled !== undefined && lastFiled >= lastTaxYear) return null;

  const r = new ResultBuilder("ontario_trillium", benefitYearOf(ctx.asOf));
  r.citeParams("Ontario Trillium Benefit calculation", TRILLIUM.energyMax, TRILLIUM.thresholdOther, TRILLIUM.salesTaxPerPerson);
  const income = book.number("money.familyNetIncome") ?? book.number("money.netIncome");
  if (income === undefined) return r.need("money.netIncome").done("possible");

  const age = book.number("person.age");
  const senior = age !== undefined && age - 1 >= 64;
  const status = book.string("person.maritalStatus");
  const married = status === "married" || status === "common_law";
  const kids = book.childIndexes().length;
  const singleNoKids = !married && kids === 0;
  const persons = 1 + (married ? 1 : 0) + kids;

  const salesTax = salesTaxCredit(income, persons, singleNoKids);
  const rent = book.number("money.rentPaid");
  const propertyTax = book.number("money.propertyTaxPaid") ?? 0;
  let energy = 0;
  if (rent === undefined && !book.has("money.propertyTaxPaid")) {
    r.need("money.rentPaid");
    r.because("The energy and property tax part depends on rent or property tax, which isn't confirmed yet.");
  } else {
    energy = energyPropertyCredit(rent ?? 0, propertyTax, income, senior, singleNoKids);
  }
  const annual = energy + salesTax;
  if (annual <= 0) {
    r.because(`Family net income of $${income.toLocaleString()} reduces it to $0.`);
    return r.done("not_eligible");
  }
  r.because(`Claimed on the ${lastTaxYear} tax return with form ON-BEN; paid monthly, or in July if it's $500 or less.`);
  r.assume("Missed years can be requested back up to 10 years, subject to CRA assessment (not counted).");
  return r.done("likely", { annual });
}
