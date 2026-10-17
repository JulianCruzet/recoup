import type { FactField, FactValue } from "@/lib/types";

type FieldInfo = { label: string; ask: string };

const CHILD_FIELDS: Record<string, FieldInfo> = {
  age: { label: "age", ask: "How old is your child?" },
  isPrimaryCaregiver: { label: "main caregiver", ask: "Who looks after them day to day?" },
  dtcApproved: { label: "DTC approved", ask: "Has anyone applied for the Disability Tax Credit for them?" },
  "limitation.sinceYear": { label: "condition since", ask: "When did their condition start, or when did you first notice it?" },
  name: { label: "name", ask: "What's your child's name?" },
  dateOfBirth: { label: "date of birth", ask: "What's their date of birth?" },
};

const FIELDS: Partial<Record<FactField, FieldInfo>> = {
  "person.name": { label: "Name", ask: "What's your full name?" },
  "person.dateOfBirth": { label: "Date of birth", ask: "What's your date of birth?" },
  "person.address": { label: "Address", ask: "What's your current address?" },
  "person.age": { label: "Age", ask: "How old are you?" },
  "person.province": { label: "Province", ask: "Which province do you live in?" },
  "person.maritalStatus": { label: "Marital status", ask: "Are you single, married, living with a partner, separated or widowed?" },
  "person.yearsInCanadaSince18": { label: "Years in Canada since 18", ask: "How many years have you lived in Canada since you turned 18?" },
  "person.residencyStatus": { label: "Residency", ask: "Are you a citizen, permanent resident, or something else?" },
  "spouse.name": { label: "Spouse's name", ask: "What's your spouse's name?" },
  "spouse.dateOfBirth": { label: "Spouse's date of birth", ask: "What's your spouse's date of birth?" },
  "money.netIncome": { label: "Your income", ask: "Roughly what did you bring in last year, from all sources? A range is fine." },
  "money.familyNetIncome": { label: "Household income", ask: "Roughly what did the household bring in last year? A range is fine." },
  "money.workingIncome": { label: "Income from work", ask: "How much of that came from a job or self-employment?" },
  "money.rentPaid": { label: "Rent", ask: "Do you rent or own? How much is the rent or property tax?" },
  "money.propertyTaxPaid": { label: "Property tax", ask: "How much property tax do you pay a year?" },
  "money.hasPrivateDental": { label: "Dental coverage", ask: "Do you have dental coverage through a job or pension?" },
  "money.pastAnnualIncome": { label: "Income while working", ask: "When you were working, roughly what did you earn a year?" },
  "tax.lastYearFiled": { label: "Last tax return", ask: "When did you last file a tax return?" },
  "tax.yearsMissed": { label: "Years not filed", ask: "How many years haven't been filed?" },
  "work.stoppedYear": { label: "Stopped working", ask: "When did you stop working?" },
  "benefits.receivesOas": { label: "Gets OAS", ask: "Do you get Old Age Security?" },
  "benefits.receivesGis": { label: "Gets GIS", ask: "Do you get the Guaranteed Income Supplement?" },
  "benefits.receivesCcb": { label: "Gets Canada Child Benefit", ask: "Do you get the Canada Child Benefit?" },
  "benefits.dtcApproved": { label: "DTC approved", ask: "Have you ever been approved for the Disability Tax Credit?" },
  "benefits.receivesCdb": { label: "Gets Canada Disability Benefit", ask: "Do you get the Canada Disability Benefit?" },
  "household.childCount": { label: "Children", ask: "Do you have children under 18 living with you?" },
  "limitation.sinceYear": { label: "Condition since", ask: "When did the condition start?" },
};

const CATEGORY_LABEL: Record<string, string> = {
  vision: "seeing",
  speaking: "speaking",
  hearing: "hearing",
  walking: "walking",
  eliminating: "bladder or bowel",
  feeding: "eating",
  dressing: "dressing",
  mental_functions: "thinking, memory or behaviour",
  life_sustaining_therapy: "life-sustaining therapy",
  cumulative: "several smaller limits together",
};

/** Plain-language label and interview question for any fact field. */
export function describeField(field: FactField): FieldInfo {
  const known = FIELDS[field];
  if (known) return known;
  const child = /^child\.(\d+)\.(.+)$/.exec(field);
  if (child && CHILD_FIELDS[child[2]]) {
    const info = CHILD_FIELDS[child[2]];
    return { label: `Child ${Number(child[1]) + 1}: ${info.label}`, ask: info.ask };
  }
  const limitation = /^(?:child\.(\d+)\.)?limitation\.(\w+)$/.exec(field);
  if (limitation) {
    const who = limitation[1] !== undefined ? `Child ${Number(limitation[1]) + 1}: ` : "";
    const what = CATEGORY_LABEL[limitation[2]] ?? limitation[2];
    return {
      label: `${who}limits in ${what}`,
      ask: `Does ${who ? "your child" : "anyone"} have a condition that makes ${what} much harder or slower?`,
    };
  }
  return { label: field, ask: field };
}

export function formatFactValue(value: FactValue): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && value >= 1000 && !(value >= 1900 && value <= 2100)) return `$${value.toLocaleString("en-CA")}`;
  return String(value);
}
