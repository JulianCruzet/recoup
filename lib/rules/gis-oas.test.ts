import { describe, expect, it } from "vitest";
import { defaultContext } from "./framework";
import { evaluateGis, evaluateOas, gisCoupleMonthly, gisIncome, gisSingleMonthly } from "./gis-oas";
import { facts } from "./test-helpers";

describe("GIS single, Oct–Dec 2026 (official table rows)", () => {
  it.each([
    [0, 1138.9],
    [2000, 1055.9],
    [5000, 868.9],
    [10496, 525.49],
    [23088, 0.49],
    [23112, 0],
  ])("income %d pays %d a month", (income, monthly) => {
    expect(gisSingleMonthly(income)).toBeCloseTo(monthly, 2);
  });

  it("excludes OAS and part of earnings from counted income", () => {
    expect(gisIncome(8791, 0, 8791)).toBe(0);
    expect(gisIncome(20000, 12000, 0)).toBe(20000 - 5000 - 3500);
  });
});

describe("GIS couple, both on OAS, Oct–Dec 2026 (official table rows)", () => {
  it.each([
    [0, 685.56],
    [4096, 599.56],
    [8800, 452.57],
    [16800, 285.57],
    [30480, 0.57],
  ])("combined income %d pays %d a month each", (income, monthly) => {
    expect(gisCoupleMonthly(income)).toBeCloseTo(monthly, 2);
  });

  it("a married senior gets a couple estimate, not a blank", () => {
    const result = evaluateGis(
      facts({ "person.age": 71, "person.maritalStatus": "married", "money.familyNetIncome": 22410, "benefits.receivesOas": true, "benefits.receivesGis": false, "tax.lastYearFiled": 2025 }),
      defaultContext(),
    )!;
    expect(result.status).toBe("likely");
    // 22,410 minus two OAS pensions of 8,791 leaves 4,828 combined.
    expect(result.annualEstimate).toBe(Math.round(gisCoupleMonthly(4828) * 12));
    expect(result.assumptions.join(" ")).toMatch(/spouse also receives OAS/);
  });

  it("a couple above the combined limit is not eligible", () => {
    const result = evaluateGis(
      facts({ "person.age": 70, "person.maritalStatus": "married", "money.familyNetIncome": 60000, "benefits.receivesOas": true }),
      defaultContext(),
    )!;
    expect(result.status).toBe("not_eligible");
  });
});

describe("evaluateGis", () => {
  const mrsK = facts({
    "person.age": 71,
    "person.maritalStatus": "widowed",
    "money.netIncome": 8791,
    "money.workingIncome": 0,
    "benefits.receivesOas": true,
    "benefits.receivesGis": false,
    "tax.lastYearFiled": 2019,
  });

  it("matches Mrs. K's verified back pay and yearly amount", () => {
    const result = evaluateGis(mrsK, defaultContext())!;
    expect(result.status).toBe("likely");
    expect(result.backPayEstimate).toBe(12236);
    expect(result.annualEstimate).toBe(13667);
    expect(result.reasons.join(" ")).toMatch(/2024 and 2025 tax returns/);
  });

  it("needs 10 years in Canada after 18, like OAS", () => {
    const result = evaluateGis(facts({ "person.age": 70, "person.maritalStatus": "single", "person.yearsInCanadaSince18": 5, "money.netIncome": 0, "benefits.receivesGis": false }), defaultContext())!;
    expect(result.status).toBe("not_eligible");
  });

  it("asks whether they already get GIS instead of assuming not", () => {
    const result = evaluateGis(facts({ "person.age": 70, "person.maritalStatus": "single", "money.netIncome": 0, "benefits.receivesOas": true }), defaultContext())!;
    expect(result.status).toBe("possible");
    expect(result.missing).toContain("benefits.receivesGis");
  });

  it("only asks for the returns that are actually missing", () => {
    const result = evaluateGis(facts({ "person.age": 70, "person.maritalStatus": "single", "money.netIncome": 0, "benefits.receivesOas": true, "benefits.receivesGis": false, "tax.lastYearFiled": 2024 }), defaultContext())!;
    expect(result.reasons.join(" ")).toMatch(/the 2025 tax return needs/);
  });

  it("skips people already receiving GIS or under 65", () => {
    expect(evaluateGis(facts({ "person.age": 71, "benefits.receivesGis": true }), defaultContext())).toBeNull();
    expect(evaluateGis(facts({ "person.age": 52 }), defaultContext())).toBeNull();
  });

  it("is not eligible above the income cut-off", () => {
    const rich = facts({ "person.age": 70, "person.maritalStatus": "single", "money.netIncome": 40000, "benefits.receivesOas": false });
    expect(evaluateGis(rich, defaultContext())!.status).toBe("not_eligible");
  });

  it("stays possible while income is unknown", () => {
    const result = evaluateGis(facts({ "person.age": 70, "person.maritalStatus": "single" }), defaultContext())!;
    expect(result.status).toBe("possible");
    expect(result.missing).toContain("money.netIncome");
  });
});

describe("evaluateOas", () => {
  it("pays the 65–74 rate with 11 months of back pay", () => {
    const result = evaluateOas(facts({ "person.age": 66, "person.yearsInCanadaSince18": 45 }), defaultContext())!;
    expect(result.annualEstimate).toBe(Math.round(762.5 * 12));
    expect(result.backPayEstimate).toBe(Math.round(762.5 * 11));
  });

  it("pro-rates a partial pension and rejects under 10 years", () => {
    expect(evaluateOas(facts({ "person.age": 66, "person.yearsInCanadaSince18": 20 }), defaultContext())!.annualEstimate).toBe(
      Math.round(762.5 * 0.5 * 12),
    );
    expect(evaluateOas(facts({ "person.age": 66, "person.yearsInCanadaSince18": 5 }), defaultContext())!.status).toBe("not_eligible");
  });
});
