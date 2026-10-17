import { describe, expect, it } from "vitest";
import { evaluateCwb, workersBenefit } from "./cwb";
import { defaultContext } from "./framework";
import { energyPropertyCredit, evaluateGains, evaluateTrillium, gainsSingleMonthly, salesTaxCredit } from "./ontario";
import { facts } from "./test-helpers";

describe("Ontario GAINS (official table rows)", () => {
  it.each([
    [0, 92],
    [2000, 50.5],
    [4000, 9],
    [4392, 0.5],
    [4416, 0],
  ])("private income %d → %d a month", (income, monthly) => {
    expect(gainsSingleMonthly(income)).toBe(monthly);
  });

  it("Mrs. K gets $1,104 a year", () => {
    const result = evaluateGains(
      facts({ "person.age": 71, "person.province": "ON", "person.maritalStatus": "widowed", "money.netIncome": 8791, "benefits.receivesOas": true }),
      defaultContext(),
    )!;
    expect(result.annualEstimate).toBe(1104);
  });
});

describe("Ontario Trillium Benefit, 2026 benefit year (CRA calculation sheets)", () => {
  it.each([
    [18000, 8791, true, true, 1267],
    [29052, 8791, true, true, 1488],
    [30000, 46309, true, true, 1288],
    [7200, 8791, true, true, 1051],
    [18000, 20000, false, true, 723],
    [18000, 35000, false, true, 603.94],
  ])("rent %d, AFNI %d, senior %s → OEPTC %d", (rent, income, senior, single, expected) => {
    expect(energyPropertyCredit(rent, 0, income, senior, single)).toBeCloseTo(expected, 2);
  });

  it.each([
    [30000, 339.88],
    [40000, 0],
  ])("OSTC single, AFNI %d → %d", (income, expected) => {
    expect(salesTaxCredit(income, 1, true)).toBeCloseTo(expected, 2);
  });

  it("Mrs. K: $1,645 once her rent is confirmed; possible while it isn't", () => {
    const base = { "person.age": 71, "person.province": "ON", "person.maritalStatus": "widowed", "money.netIncome": 8791, "tax.lastYearFiled": 2019 } as const;
    expect(evaluateTrillium(facts({ ...base, "money.rentPaid": 18000 }), defaultContext())!.annualEstimate).toBe(1645);
    const unconfirmed = evaluateTrillium(facts(base), defaultContext())!;
    expect(unconfirmed.status).toBe("possible");
    expect(unconfirmed.missing).toContain("money.rentPaid");
  });
});

describe("Canada Workers Benefit 2025 (CRA zero points)", () => {
  it.each([
    [9048, 9048, false, 1632.96],
    [40000, 37742, false, 0],
    [40000, 37741, false, 0.1],
    [60000, 49393, true, 0],
  ])("working %d, net %d, family %s → %d", (working, net, family, expected) => {
    expect(workersBenefit(working, net, family)).toBeCloseTo(expected, 2);
  });
});

describe("already paid or not eligible", () => {
  it("skips GAINS for someone already on GIS (it's paid with it)", () => {
    expect(evaluateGains(facts({ "person.age": 70, "person.province": "ON", "person.maritalStatus": "single", "money.netIncome": 9000, "benefits.receivesOas": true, "benefits.receivesGis": true }), defaultContext())).toBeNull();
  });
});

describe("Canada Workers Benefit", () => {
  it("is already paid once last year's return is filed", () => {
    const worker = { "person.age": 30, "person.maritalStatus": "single", "money.workingIncome": 15000, "money.netIncome": 15000 };
    expect(evaluateCwb(facts({ ...worker, "tax.lastYearFiled": 2025 }), defaultContext())).toBeNull();
    expect(evaluateCwb(facts({ ...worker, "tax.lastYearFiled": 2023 }), defaultContext())?.status).toBe("likely");
  });
});
