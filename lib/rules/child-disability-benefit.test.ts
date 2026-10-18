import { describe, expect, it } from "vitest";
import { childDisabilityBenefit, evaluateChildDisabilityBenefit } from "./child-disability-benefit";
import { defaultContext } from "./framework";
import { facts } from "./test-helpers";

describe("Child Disability Benefit amounts", () => {
  it.each([
    [1, 82847, 3480],
    [1, 100000, 2931.11],
    [2, 100000, 5982.28],
  ])("2026-27, %d child(ren), AFNI %d → %d", (children, income, expected) => {
    expect(childDisabilityBenefit("2026-27", children, income)).toBeCloseTo(expected, 2);
  });
});

describe("evaluateChildDisabilityBenefit", () => {
  const sFamily = facts({
    "household.childCount": 1,
    "child.0.age": 12,
    "child.0.limitation.mental_functions": true,
    "money.familyNetIncome": 55000,
    "benefits.receivesCcb": true,
  });

  it("S. family: $6,733 back pay, $3,480 a year, $20,292 more by request (not counted)", () => {
    const result = evaluateChildDisabilityBenefit(sFamily, defaultContext())!;
    expect(result.status).toBe("likely");
    expect(result.backPayEstimate).toBe(6733);
    expect(result.annualEstimate).toBe(3480);
    expect(result.reasons.join(" ")).toMatch(/\$20,292 more for 2017-18 to 2023-24/);
  });

  it("skips adults and children without a limitation", () => {
    expect(evaluateChildDisabilityBenefit(facts({ "household.childCount": 1, "child.0.age": 12 }), defaultContext())).toBeNull();
    // An approved DTC means it's already paid with the Canada Child Benefit.
    expect(
      evaluateChildDisabilityBenefit(facts({ "child.0.age": 9, "child.0.limitation.walking": true, "child.0.dtcApproved": true, "money.familyNetIncome": 40000 }), defaultContext()),
    ).toBeNull();
    expect(
      evaluateChildDisabilityBenefit(facts({ "child.0.age": 19, "child.0.limitation.walking": true }), defaultContext()),
    ).toBeNull();
  });
});
