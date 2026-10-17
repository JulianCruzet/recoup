import { describe, expect, it } from "vitest";
import type { Fact } from "@/lib/types";
import { FactBook, ResultBuilder, phaseIn, phaseOut } from "./framework";

const fact = (field: Fact["field"], value: Fact["value"], confirmed = true): Fact => ({
  field,
  value,
  source: "staff",
  confidence: 1,
  confirmed,
});

describe("FactBook", () => {
  it("ignores unconfirmed facts", () => {
    const book = new FactBook([fact("person.age", 71, false)]);
    expect(book.has("person.age")).toBe(false);
    expect(book.number("person.age")).toBeUndefined();
  });

  it("coerces numbers and booleans from strings", () => {
    const book = new FactBook([fact("money.netIncome", "18000"), fact("money.hasPrivateDental", "no")]);
    expect(book.number("money.netIncome")).toBe(18000);
    expect(book.bool("money.hasPrivateDental")).toBe(false);
  });

  it("finds children from the count and from indexed facts", () => {
    const book = new FactBook([fact("household.childCount", 1), fact("child.2.age", 4)]);
    expect(book.childIndexes()).toEqual([0, 2]);
  });
});

describe("ResultBuilder", () => {
  it("downgrades likely to possible while facts are missing", () => {
    const result = new ResultBuilder("gis", "2026").need("money.netIncome").done("likely", { annual: 100 });
    expect(result.status).toBe("possible");
    expect(result.missing).toEqual(["money.netIncome"]);
  });

  it("drops amounts from not-eligible results", () => {
    const result = new ResultBuilder("gis", "2026").done("not_eligible", { annual: 100 });
    expect(result.annualEstimate).toBeUndefined();
  });

  it("dedupes citations by url", () => {
    const result = new ResultBuilder("ccb", "2026").cite("a", "https://x").cite("b", "https://x").done("likely");
    expect(result.citations).toHaveLength(1);
  });
});

describe("phase helpers", () => {
  it("phases out above the threshold and never goes negative", () => {
    expect(phaseOut(1000, 20000, 15000, 0.05)).toBe(750);
    expect(phaseOut(1000, 100000, 15000, 0.5)).toBe(0);
    expect(phaseOut(1000, 10000, 15000, 0.05)).toBe(1000);
  });

  it("phases in from the start and caps at the max", () => {
    expect(phaseIn(5000, 3000, 0.27, 1633)).toBeCloseTo(540);
    expect(phaseIn(50000, 3000, 0.27, 1633)).toBe(1633);
    expect(phaseIn(1000, 3000, 0.27, 1633)).toBe(0);
  });
});
