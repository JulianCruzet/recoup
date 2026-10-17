import { describe, expect, it } from "vitest";
import personas from "@/seed/personas.json";
import { evaluate } from "@/lib/rules";
import type { Fact } from "@/lib/types";
import { fillIsp3025, fillRc66, packagesFor } from "./forms";

const factsOf = (id: string) => (personas as { id: string; facts: Fact[] }[]).find((p) => p.id === id)!.facts;

describe("fillRc66", () => {
  it("S. family: Sana applies with Omar as spouse and Adam listed", () => {
    const form = fillRc66(factsOf("s-family"))!;
    expect(form.applicant).toMatchObject({ firstName: "Sana", lastName: "Saeed", city: "Scarborough", maritalStatus: "Married" });
    expect(form.spouse).toMatchObject({ firstName: "Omar", lastName: "Saeed" });
    expect(form.children).toEqual([{ firstName: "Adam", lastName: "Saeed", dateOfBirth: "2014-05-09" }]);
    expect(form.residency).toBe("Canadian citizen");
  });

  it("no children, no RC66", () => {
    expect(fillRc66(factsOf("mrs-k"))).toBeNull();
  });
});

describe("fillIsp3025", () => {
  it("Mrs. K: income without OAS/GIS, back pay requested", () => {
    const form = fillIsp3025(factsOf("mrs-k"))!;
    expect(form.applicant).toMatchObject({ maritalStatus: "Widowed" });
    expect(form.estimatedIncome).toBe(8791);
    expect(form.requestRetroactive).toBe(true);
  });

  it("not on OAS yet, so ISP-3025 doesn't apply", () => {
    expect(fillIsp3025(factsOf("mr-r"))).toBeNull();
  });
});

describe("packagesFor", () => {
  const packagesOf = (id: string) => {
    const facts = factsOf(id);
    return packagesFor(facts, evaluate(facts).results);
  };

  it("S. family: T2201 for Adam, no RC66 because they already get CCB", () => {
    const kinds = packagesOf("s-family").map((p) => p.kind);
    expect(kinds).toContain("t2201");
    expect(kinds).not.toContain("rc66");
  });

  it("Mrs. K: ISP-3025 for GIS", () => {
    const gis = packagesOf("mrs-k").find((p) => p.program === "gis")!;
    expect(gis.kind).toBe("isp3025");
  });

  it("never includes a program that came back not eligible", () => {
    const facts = factsOf("mr-r");
    const { results } = evaluate(facts);
    const closed = new Set(results.filter((r) => r.status === "not_eligible").map((r) => r.program));
    expect(packagesFor(facts, results).some((p) => closed.has(p.program))).toBe(false);
  });
});
