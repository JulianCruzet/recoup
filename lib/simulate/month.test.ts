import { describe, expect, it } from "vitest";
import personas from "@/seed/personas.json";
import synthetic from "@/seed/clients.json";
import { evaluate } from "@/lib/rules";
import type { Fact } from "@/lib/types";
import { runMonth, type SimClient } from "./month";

const clients = personas as unknown as SimClient[];

describe("runMonth", () => {
  it("adds up the same totals the results page shows", () => {
    const month = runMonth(clients);
    expect(month.clients).toBe(3);
    const pageTotals = clients.map((c) => evaluate(c.facts).totals);
    const all = pageTotals.reduce((t, x) => t + x.backPay + x.annual, 0);
    expect(month.likely.backPay + month.likely.annual + month.possible.backPay + month.possible.annual).toBeCloseTo(all, -1);
  });

  it("counts a T2201 and doctor brief for each family with a likely DTC", () => {
    const month = runMonth(clients);
    expect(month.doctorBriefs).toBeGreaterThanOrEqual(1);
    expect(month.formsPrepared).toBeGreaterThanOrEqual(month.doctorBriefs);
  });

  it("runs the 50 synthetic clients without errors", () => {
    const month = runMonth(synthetic as unknown as SimClient[]);
    expect(month.clients).toBe(50);
    expect(month.withLikely).toBeGreaterThan(0);
    expect(month.withLikely).toBeLessThanOrEqual(50);
  });

  it("a client with nothing owed adds nothing", () => {
    const rich: SimClient = {
      id: "x",
      name: "X",
      facts: [
        { field: "person.age", value: 40, source: "staff", confidence: 1, confirmed: true },
        { field: "money.netIncome", value: 180000, source: "staff", confidence: 1, confirmed: true },
        { field: "money.hasPrivateDental", value: true, source: "staff", confidence: 1, confirmed: true },
      ] as Fact[],
    };
    const month = runMonth([rich]);
    expect(month.withLikely).toBe(0);
    expect(month.likely.backPay + month.likely.annual).toBe(0);
  });
});
