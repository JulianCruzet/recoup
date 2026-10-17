import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("formats once-off amounts in whole dollars", () => {
    expect(formatMoney(31107)).toBe("$31,107");
  });

  it("adds /yr for yearly amounts", () => {
    expect(formatMoney(3480, "year")).toBe("$3,480/yr");
  });

  it("rounds to whole dollars", () => {
    expect(formatMoney(2450.4, "year")).toBe("$2,450/yr");
  });

  it("shows $0 for zero, negative and NaN amounts", () => {
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(-5)).toBe("$0");
    expect(formatMoney(NaN)).toBe("$0");
  });
});
