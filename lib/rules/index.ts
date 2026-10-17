import type { EligibilityResult, Fact, FactField, ReferralFlag, ReferralProgramId } from "@/lib/types";
import { evaluateCanadaDisabilityBenefit } from "./canada-disability-benefit";
import { evaluateCcb } from "./ccb";
import { evaluateCdcp } from "./cdcp";
import { evaluateCgeb } from "./cgeb";
import { evaluateCwb } from "./cwb";
import { evaluateChildDisabilityBenefit } from "./child-disability-benefit";
import { evaluateDtc } from "./dtc";
import { FactBook, defaultContext, type RuleContext } from "./framework";
import { evaluateGis, evaluateOas } from "./gis-oas";
import { evaluateGains, evaluateTrillium } from "./ontario";
import { maxPotential } from "./potential";

const RULES = [
  evaluateDtc,
  evaluateChildDisabilityBenefit,
  evaluateCanadaDisabilityBenefit,
  evaluateGis,
  evaluateOas,
  evaluateCcb,
  evaluateCgeb,
  evaluateCwb,
  evaluateGains,
  evaluateTrillium,
  evaluateCdcp,
];

export type Evaluation = {
  results: EligibilityResult[];
  referrals: ReferralFlag[];
  totals: { backPay: number; annual: number };
  /** Missing facts, most valuable first: answering them could settle the most money. */
  askNext: { field: FactField; programs: EligibilityResult["program"][]; atStake: number }[];
};

const value = (r: EligibilityResult) => (r.backPayEstimate ?? 0) + (r.annualEstimate ?? 0);
const STATUS_ORDER = { likely: 0, possible: 1, not_eligible: 2 } as const;

/** Run every rule over a client's facts. Pure: same facts and date, same answer. */
export function evaluate(facts: Fact[], ctx: RuleContext = defaultContext()): Evaluation {
  const book = new FactBook(facts);
  const results = RULES.map((rule) => rule(book, ctx)).filter((r): r is EligibilityResult => r !== null);
  results.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || value(b) - value(a));

  const counted = results.filter((r) => r.status !== "not_eligible");
  const totals = {
    backPay: counted.reduce((t, r) => t + (r.backPayEstimate ?? 0), 0),
    annual: counted.reduce((t, r) => t + (r.annualEstimate ?? 0), 0),
  };

  const stakes = new Map<FactField, { programs: Set<EligibilityResult["program"]>; atStake: number }>();
  for (const r of results) {
    for (const field of r.missing) {
      const entry = stakes.get(field) ?? { programs: new Set(), atStake: 0 };
      entry.programs.add(r.program);
      // Unknown amounts are scored by the most the program could be worth, so key questions rank first.
      entry.atStake += value(r) || maxPotential(r.program, ctx.asOf.getFullYear());
      stakes.set(field, entry);
    }
  }
  const askNext = [...stakes.entries()]
    .map(([field, e]) => ({ field, programs: [...e.programs], atStake: e.atStake }))
    .sort((a, b) => b.atStake - a.atStake || b.programs.length - a.programs.length);

  return { results, referrals: referrals(book, results), totals, askNext };
}

/** Programs we don't model yet, flagged so staff can refer the client. */
function referrals(book: FactBook, results: EligibilityResult[]): ReferralFlag[] {
  const flags: ReferralFlag[] = [];
  const add = (program: ReferralProgramId, reason: string) =>
    flags.push({ program, reason, referTo: { label: "", url: "" } });

  const age = book.number("person.age");
  const income = book.number("money.familyNetIncome") ?? book.number("money.netIncome");
  const ownLimitation = results.some((r) => r.program === "canada_disability_benefit") ||
    ["walking", "vision", "hearing", "mental_functions", "dressing", "feeding", "speaking", "eliminating"].some(
      (c) => book.bool(`limitation.${c}` as FactField) === true,
    );
  const dtcLikely = results.some((r) => r.program === "dtc" && r.status !== "not_eligible");
  const stoppedWork = book.number("work.stoppedYear") !== undefined;
  const kids = book.childIndexes();

  if (ownLimitation && age !== undefined && age >= 18 && age < 65) {
    add("odsp", "Adult with a disability; ODSP may help with living costs.");
    if (stoppedWork) add("cpp_disability", "Stopped working because of a disability; CPP disability may apply if they paid into CPP.");
  }
  if (dtcLikely && (age === undefined || age < 50 || kids.length > 0)) {
    add("rdsp", "Once the DTC is approved, an RDSP can unlock government grants and bonds.");
  }
  if (kids.length > 0) add("canada_learning_bond", "Children from lower-income families can get education savings with no contribution.");
  if (kids.length > 0) add("healthy_smiles_ontario", "Children 17 and under from low-income families may get free dental care.");
  if (age !== undefined && age >= 60 && age < 65) add("oas_allowance", "Aged 60–64; the Allowance may apply if their spouse gets GIS or they're widowed.");
  if (age !== undefined && age >= 65) add("ontario_seniors_dental", "Low-income seniors may get free dental care through public health.");
  if (income !== undefined && book.has("money.rentPaid")) add("oesp", "Lower-income households can get a monthly credit on electricity bills.");
  return flags;
}
