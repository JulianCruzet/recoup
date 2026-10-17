import type { Fact } from "@/lib/types";
import { FactBook } from "@/lib/rules/framework";

// Same shape as components/forms/T2201PartA's T2201Data.
export type T2201Fill = {
  person: { firstName: string; lastName: string; dateOfBirth: string; address: string; city: string; province: string; postalCode: string };
  claimant?: { firstName: string; lastName: string; relationship: string; livesWithPerson: boolean };
  adjustPreviousYears: boolean;
  impairmentSinceYear?: number;
};

const LIMITS = ["vision", "speaking", "hearing", "walking", "eliminating", "feeding", "dressing", "mental_functions", "life_sustaining_therapy", "cumulative"];

export function splitName(full: string | undefined): { firstName: string; lastName: string } {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.slice(0, -1).join(" ") || parts[0] || "", lastName: parts.length > 1 ? parts[parts.length - 1] : "" };
}

/** "41 Brimley Rd, Unit 6, Scarborough, ON M1M 3W1" → street, city, province, postal code. */
export function splitAddress(full: string | undefined): { address: string; city: string; province: string; postalCode: string } {
  const empty = { address: "", city: "", province: "", postalCode: "" };
  if (!full) return empty;
  const match = /^(.*),\s*([^,]+),\s*([A-Z]{2})\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d)$/i.exec(full.trim());
  if (!match) return { ...empty, address: full };
  return { address: match[1], city: match[2], province: match[3].toUpperCase(), postalCode: match[4].toUpperCase() };
}

/**
 * Fill T2201 Part A from confirmed facts. For a child, the child is the person with the disability and
 * the parent (the client) is the claimant. SIN and signature are never filled.
 */
export function fillT2201(facts: Fact[]): T2201Fill | null {
  const book = new FactBook(facts);
  const address = splitAddress(book.string("person.address"));
  const child = book.childIndexes().find((i) => LIMITS.some((c) => book.bool(`child.${i}.limitation.${c}` as Fact["field"]) === true));

  if (child !== undefined) {
    const parent = splitName(book.string("person.name"));
    return {
      person: { ...splitName(book.string(`child.${child}.name`)), dateOfBirth: book.string(`child.${child}.dateOfBirth`) ?? "", ...address },
      claimant: { ...parent, relationship: "Parent", livesWithPerson: true },
      adjustPreviousYears: true,
      impairmentSinceYear: book.number(`child.${child}.limitation.sinceYear`),
    };
  }
  if (LIMITS.some((c) => book.bool(`limitation.${c}` as Fact["field"]) === true)) {
    return {
      person: { ...splitName(book.string("person.name")), dateOfBirth: book.string("person.dateOfBirth") ?? "", ...address },
      adjustPreviousYears: true,
      impairmentSinceYear: book.number("limitation.sinceYear"),
    };
  }
  return null;
}
