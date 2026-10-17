import { describe, expect, it } from "vitest";
import { defaultContext } from "./framework";
import { claimableYears, dtcAmount, dtcCredit, evaluateDtc } from "./dtc";
import { facts } from "./test-helpers";

describe("DTC amounts (5000-D1)", () => {
  it("2025 adult: 10,138 at 14.5%", () => {
    expect(dtcAmount(2025, false)).toBe(10138);
    expect(dtcCredit(2025, false)).toBe(1470.01);
  });

  it("2025 child: 16,052 at 14.5%", () => {
    expect(dtcAmount(2025, true)).toBe(16052);
    expect(dtcCredit(2025, true)).toBe(2327.54);
  });

  it("2026 child: 16,373 at 14%", () => {
    expect(dtcCredit(2026, true)).toBe(2292.22);
  });

  it("caps the credit at the tax owed", () => {
    expect(dtcCredit(2025, false, 1000)).toBe(1000);
  });

  it("only allows the last 10 tax years", () => {
    expect(claimableYears(2026, 2010)[0]).toBe(2016);
    expect(claimableYears(2027, 2010)[0]).toBe(2017);
    expect(claimableYears(2026, 2020)).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
  });
});

describe("evaluateDtc personas", () => {
  it("S. family: $20,893.64 for 2016–2025, $2,292.22 a year, with the Dec 31 deadline", () => {
    const result = evaluateDtc(
      facts({
        "household.childCount": 1,
        "child.0.age": 12,
        "child.0.limitation.mental_functions": true,
        "child.0.limitation.sinceYear": 2014,
        "money.familyNetIncome": 55000,
      }),
      defaultContext(),
    )!;
    expect(result.status).toBe("likely");
    expect(result.backPayEstimate).toBe(20894);
    expect(result.annualEstimate).toBe(2292);
    expect(result.deadline?.date).toBe("2026-12-31");
  });

  it("Mr. R: $10,245.15 for 2016–2023 only, and possible", () => {
    const result = evaluateDtc(
      facts({
        "person.age": 52,
        "limitation.walking": true,
        "limitation.sinceYear": 2016,
        "money.netIncome": 0,
        "money.pastAnnualIncome": 45000,
        "work.stoppedYear": 2023,
      }),
      defaultContext(),
    )!;
    expect(result.status).toBe("possible");
    expect(result.backPayEstimate).toBe(10245);
    expect(result.annualEstimate).toBe(0);
  });

  it("returns nothing when no one reports a limitation or the DTC is already approved", () => {
    expect(evaluateDtc(facts({ "person.age": 40 }), defaultContext())).toBeNull();
    expect(evaluateDtc(facts({ "limitation.walking": true, "benefits.dtcApproved": true }), defaultContext())).toBeNull();
  });
});
