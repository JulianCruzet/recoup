import type { DtcCategory, Fact } from "@/lib/types";
import { FactBook } from "@/lib/rules/framework";

// What form T2201 Part B asks the practitioner to assess for each category (CRA wording, condensed).
const CRITERIA: Record<DtcCategory, { title: string; test: string }> = {
  vision: { title: "Vision", test: "Visual acuity in both eyes is 20/200 or less with corrective lenses, or the greatest diameter of the field of vision in both eyes is 20 degrees or less." },
  speaking: { title: "Speaking", test: "Unable, or takes an inordinate amount of time, to speak so as to be understood by another person familiar with them in a quiet setting." },
  hearing: { title: "Hearing", test: "Unable, or takes an inordinate amount of time, to hear so as to understand a familiar person in a quiet setting, even with devices." },
  walking: { title: "Walking", test: "Unable, or takes an inordinate amount of time (three times the average), to walk, even with devices or medication." },
  eliminating: { title: "Eliminating (bowel or bladder)", test: "Unable, or takes an inordinate amount of time, to personally manage bowel or bladder functions." },
  feeding: { title: "Feeding", test: "Unable, or takes an inordinate amount of time, to feed themselves, including preparing food." },
  dressing: { title: "Dressing", test: "Unable, or takes an inordinate amount of time, to dress themselves." },
  mental_functions: { title: "Mental functions necessary for everyday life", test: "Limited in adaptive functioning, memory, or problem-solving, goal-setting and judgement, all or substantially all of the time, even with therapy and medication." },
  life_sustaining_therapy: { title: "Life-sustaining therapy", test: "Needs therapy at least 2 times a week, averaging at least 14 hours a week, to support a vital function." },
  cumulative: { title: "Cumulative effect", test: "Significantly restricted in two or more categories that together equal a marked restriction, all or substantially all of the time." },
};
const CATEGORIES = Object.keys(CRITERIA) as DtcCategory[];

export type BriefSection = { category: DtcCategory; title: string; test: string; observations: string[] };
export type DoctorBrief = {
  patient: string;
  forChild: boolean;
  since?: number;
  sections: BriefSection[];
  otherNotes: string[];
};

/** Organize what the client said about daily limitations by T2201 category, quotes verbatim. */
export function doctorBrief(facts: Fact[], patientName: string): DoctorBrief | null {
  const book = new FactBook(facts);
  const confirmed = facts.filter((f) => f.confirmed);
  const childIndex = book.childIndexes().find((i) => CATEGORIES.some((c) => book.bool(`child.${i}.limitation.${c}`) === true));
  const prefix = childIndex !== undefined ? `child.${childIndex}.limitation` : "limitation";
  const sections = CATEGORIES.filter((c) => book.bool(`${prefix}.${c}` as Fact["field"]) === true).map((c) => ({
    category: c,
    ...CRITERIA[c],
    observations: confirmed
      .filter((f) => f.field === `${prefix}.${c}` && f.quote)
      .map((f) => `“${f.quote}”`),
  }));
  if (sections.length === 0) return null;

  const since = book.number(`${prefix}.sinceYear` as Fact["field"]);
  return {
    patient: childIndex !== undefined ? book.string(`child.${childIndex}.name`) ?? `Child of ${patientName}` : patientName,
    forChild: childIndex !== undefined,
    since,
    sections,
    otherNotes: [
      since ? `The family reports this began in ${since}. Part B asks the year the impairment began; that year decides how far back the credit can be claimed.` : "",
      "Recoup is not a medical record. These are the family's own words, collected at a benefits intake, to save time at the appointment.",
    ].filter(Boolean),
  };
}
