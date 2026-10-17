import { describe, expect, it } from "vitest";
import { canadaChildBenefit, evaluateCcb } from "./ccb";
import { canadaDisabilityBenefit, evaluateCanadaDisabilityBenefit } from "./canada-disability-benefit";
import { dentalCoPay, evaluateCdcp } from "./cdcp";
import { evaluateCgeb, groceriesBenefit } from "./cgeb";
import { defaultContext } from "./framework";
import { facts } from "./test-helpers";

describe("Canada Child Benefit, July 2026–June 2027 (CRA examples)", () => {
  it.each([
    [[3], 45000, 7683.59],
    [[3], 100000, 4485.11],
    [[2, 4], 60000, 13376],
    [[8, 10, 12], 150000, 6800.76],
    [[7, 9, 11, 13], 200000, 6142.47],
    [[12], 38237, 6883],
    [[12], 55000, 5709.59],
    [[12], 82847, 3760.3],
  ])("ages %j, AFNI %d → %d", (ages, income, expected) => {
    expect(canadaChildBenefit(ages, income)).toBeCloseTo(expected, 2);
  });

  it("is skipped for families already receiving it", () => {
    expect(evaluateCcb(facts({ "child.0.age": 4, "benefits.receivesCcb": true }), defaultContext())).toBeNull();
  });
});

describe("Canada Groceries and Essentials Benefit (CRA payments chart)", () => {
  it.each([
    [11000, false, 0, 445],
    [14000, false, 0, 493.72],
    [25000, false, 0, 679],
    [60000, false, 0, 0.6],
    [65000, false, 0, 0],
    [55000, true, 1, 695.6],
    [70000, true, 2, 179.6],
    [75000, true, 2, 0],
    [60000, false, 1, 445.6],
  ])("AFNI %d, married %s, %d kids → %d", (income, married, kids, expected) => {
    expect(groceriesBenefit(income, married, kids)).toBeCloseTo(expected, 2);
  });

  it("Mrs. K gets $445 once she files", () => {
    const result = evaluateCgeb(
      facts({ "money.netIncome": 8791, "person.maritalStatus": "widowed", "tax.lastYearFiled": 2019 }),
      defaultContext(),
    )!;
    expect(result.annualEstimate).toBe(445);
  });

  it("is skipped for people who filed last year (already paid automatically)", () => {
    expect(evaluateCgeb(facts({ "money.netIncome": 20000, "tax.lastYearFiled": 2025 }), defaultContext())).toBeNull();
  });
});

describe("Canada Disability Benefit (canada.ca examples, 2025-26 parameters)", () => {
  const y2526 = { maxAnnual: 2400, exemption: 10000, threshold: 23000, rate: 0.2 };
  it("Jane: single, AFNI 16,000, no work → $200/mo", () => {
    expect(canadaDisabilityBenefit(16000, 0, y2526) / 12).toBeCloseTo(200, 2);
  });
  it("Dan: single, AFNI 35,000 all from work → $166.67/mo", () => {
    expect(canadaDisabilityBenefit(35000, 35000, y2526) / 12).toBeCloseTo(166.67, 2);
  });
  it("Donna and Lucia: both beneficiaries, AFNI 45,000, $5,000 work → $137.50/mo each", () => {
    expect(canadaDisabilityBenefit(45000, 5000, { maxAnnual: 2400, exemption: 14000, threshold: 32500, rate: 0.1 }) / 12).toBeCloseTo(137.5, 2);
  });

  it("Mr. R: $3,216.80 back pay (Jul 2025–Oct 2026) + $150, $2,450.40 a year, possible until the DTC is approved", () => {
    const result = evaluateCanadaDisabilityBenefit(
      facts({ "person.age": 52, "person.maritalStatus": "single", "limitation.walking": true, "money.netIncome": 0, "money.workingIncome": 0 }),
      defaultContext(),
    )!;
    expect(result.status).toBe("possible");
    expect(result.annualEstimate).toBe(2450);
    expect(result.backPayEstimate).toBe(3367);
  });
});

describe("Canadian Dental Care Plan", () => {
  it.each([
    [69999, 0],
    [70000, 0.4],
    [79999, 0.4],
    [80000, 0.6],
    [89999, 0.6],
    [90000, null],
  ])("AFNI %d → co-pay %s", (income, expected) => {
    expect(dentalCoPay(income)).toBe(expected);
  });

  it("rules out anyone with private dental coverage", () => {
    const result = evaluateCdcp(facts({ "money.hasPrivateDental": true, "money.familyNetIncome": 55000 }), defaultContext())!;
    expect(result.status).toBe("not_eligible");
    expect(result.reasons[0]).toMatch(/dental coverage/);
  });
});
