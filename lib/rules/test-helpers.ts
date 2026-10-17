import type { Fact, FactField, FactValue } from "@/lib/types";
import { FactBook } from "./framework";

/** Build a FactBook from plain field/value pairs, all confirmed. */
export function facts(values: Partial<Record<FactField, FactValue>>): FactBook {
  const list: Fact[] = Object.entries(values).map(([field, value]) => ({
    field: field as FactField,
    value: value as FactValue,
    source: "staff",
    confidence: 1,
    confirmed: true,
  }));
  return new FactBook(list);
}
