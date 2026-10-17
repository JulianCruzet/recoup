import { describe, expect, it } from "vitest";
import personas from "@/seed/personas.json";
import type { Fact } from "@/lib/types";
import { fillT2201, splitAddress } from "./t2201";

const factsOf = (id: string) => (personas as { id: string; facts: Fact[] }[]).find((p) => p.id === id)!.facts;

describe("fillT2201", () => {
  it("S. family: Adam is the person, Sana claims as parent, adjust previous years", () => {
    const form = fillT2201(factsOf("s-family"))!;
    expect(form.person).toEqual({
      firstName: "Adam",
      lastName: "Saeed",
      dateOfBirth: "2014-05-09",
      address: "41 Brimley Rd, Unit 6",
      city: "Scarborough",
      province: "ON",
      postalCode: "M1M 3W1",
    });
    expect(form.claimant).toEqual({ firstName: "Sana", lastName: "Saeed", relationship: "Parent", livesWithPerson: true });
    expect(form.adjustPreviousYears).toBe(true);
    expect(form.impairmentSinceYear).toBe(2014);
  });

  it("Mr. R claims for himself", () => {
    const form = fillT2201(factsOf("mr-r"))!;
    expect(form.person.firstName).toBe("Rohan");
    expect(form.claimant).toBeUndefined();
    expect(form.impairmentSinceYear).toBe(2016);
  });

  it("Mrs. K has no disability facts, so no form", () => {
    expect(fillT2201(factsOf("mrs-k"))).toBeNull();
  });

  it("keeps an unparseable address whole", () => {
    expect(splitAddress("somewhere odd")).toEqual({ address: "somewhere odd", city: "", province: "", postalCode: "" });
  });
});
