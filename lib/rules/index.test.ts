import { describe, expect, it } from "vitest";
import personas from "@/seed/personas.json";
import type { Fact } from "@/lib/types";
import { evaluate } from "./index";

const factsOf = (id: string) => (personas as { id: string; facts: Fact[] }[]).find((p) => p.id === id)!.facts;

describe("evaluate: demo personas end to end", () => {
  it("S. family: $27,627 back pay + $5,772 a year, dental not eligible, Dec 31 deadline", () => {
    const { results, totals } = evaluate(factsOf("s-family"));
    expect(totals.backPay).toBe(27627);
    expect(totals.annual).toBe(5772);
    expect(results.map((r) => [r.program, r.status])).toEqual([
      ["dtc", "likely"],
      ["child_disability_benefit", "likely"],
      ["cdcp", "not_eligible"],
    ]);
    expect(results[0].deadline?.date).toBe("2026-12-31");
  });

  it("Mrs. K: GIS back pay $12,236; unconfirmed rent stays out of the facts", () => {
    const { results, totals } = evaluate(factsOf("mrs-k"));
    expect(totals.backPay).toBe(12236);
    expect(results.find((r) => r.program === "gis")?.status).toBe("likely");
    expect(results.find((r) => r.program === "cgeb")?.annualEstimate).toBe(445);
    expect(results.find((r) => r.program === "ontario_gains")?.annualEstimate).toBe(1104);
    const trillium = results.find((r) => r.program === "ontario_trillium")!;
    expect(trillium.status).toBe("possible");
    expect(trillium.missing).toContain("money.rentPaid");
  });

  it("Mr. R: DTC $10,245 + CDB $3,367 (incl. $150), both possible until the DTC is approved", () => {
    const { results, totals, referrals } = evaluate(factsOf("mr-r"));
    expect(results.find((r) => r.program === "dtc")).toMatchObject({ status: "possible", backPayEstimate: 10245 });
    expect(results.find((r) => r.program === "canada_disability_benefit")).toMatchObject({ status: "possible", backPayEstimate: 3367 });
    expect(totals.backPay).toBe(13612);
    expect(referrals.map((f) => f.program)).toEqual(expect.arrayContaining(["odsp", "cpp_disability"]));
  });

  it("ranks missing facts by the money they could settle", () => {
    const { askNext } = evaluate([
      { field: "person.age", value: 70, source: "staff", confidence: 1, confirmed: true },
      { field: "person.maritalStatus", value: "single", source: "staff", confidence: 1, confirmed: true },
    ]);
    expect(askNext[0].field).toBe("money.netIncome");
  });
});
