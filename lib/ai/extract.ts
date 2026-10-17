import "server-only";
import type { Fact, FactField, FactValue } from "@/lib/types";
import { generateJson, mapLimit } from "./gemini";
import { numberInQuote, wordsToNumber } from "./numbers";

// Fields the model may fill from conversation. Identity details (names, birth dates, address) are typed
// by staff, never pulled from audio.
const CATEGORIES = ["vision", "speaking", "hearing", "walking", "eliminating", "feeding", "dressing", "mental_functions", "life_sustaining_therapy", "cumulative"];
const PERSON_FIELDS = [
  "person.age", "person.maritalStatus", "person.yearsInCanadaSince18", "person.residencyStatus",
  "money.netIncome", "money.familyNetIncome", "money.workingIncome", "money.rentPaid", "money.propertyTaxPaid",
  "money.hasPrivateDental", "money.pastAnnualIncome", "tax.lastYearFiled", "tax.yearsMissed", "work.stoppedYear",
  "benefits.receivesOas", "benefits.receivesGis", "benefits.receivesCcb", "benefits.dtcApproved", "benefits.receivesCdb",
  "household.childCount", "limitation.sinceYear", ...CATEGORIES.map((c) => `limitation.${c}`),
];
const CHILD_FIELDS = (i: number) => [
  `child.${i}.age`, `child.${i}.isPrimaryCaregiver`, `child.${i}.dtcApproved`, `child.${i}.limitation.sinceYear`,
  ...CATEGORIES.map((c) => `child.${i}.limitation.${c}`),
];
export const EXTRACTABLE_FIELDS = [...PERSON_FIELDS, ...[0, 1, 2, 3].flatMap(CHILD_FIELDS)];

const SYSTEM = `You extract facts from part of a benefits intake conversation between a community-centre staff member and a client in Ontario, Canada.
Return ONLY facts the CLIENT stated or clearly confirmed. For each fact give:
- field: one of the allowed field names
- value: number for amounts/ages/years/counts, written as digits (58, 14000, 2022), in yearly dollars (convert "eighteen hundred a month" rent to 21600), true/false for yes/no fields, otherwise a short lowercase word (maritalStatus: single|married|common_law|separated|divorced|widowed; residencyStatus: citizen|permanent_resident|other)
- quote: the shortest EXACT, verbatim span of the transcript that supports it (copy characters exactly, no paraphrase)
- confidence: 0..1, lower when the client hedged ("I think", "maybe", "around")
Rules: never guess or infer beyond what was said; never output a SIN, names, addresses or dates of birth; limitation.* fields are true only when the client describes a lasting condition that makes that activity much harder or slower; child.N is the Nth child mentioned (0-based).
Field notes: money.netIncome is the client's OWN yearly income and money.familyNetIncome is the whole household's; fill both when both are stated. benefits.dtcApproved is about the client themselves; child.N.dtcApproved is about that child. Communication or social difficulties from autism, ADHD, intellectual disability or similar belong to limitation.mental_functions, not speaking.
Corrections: if the client corrects an earlier answer ("sorry, it's actually..."), give only the corrected value and quote the correction.
Be exhaustive: output EVERY allowed field the text supports, even when several fields share the same quote. Never skip a stated income.
If nothing new is stated, return an empty list.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    facts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          field: { type: "STRING", enum: EXTRACTABLE_FIELDS },
          value: { type: "STRING", description: "the value as text; numbers and true/false written plainly" },
          quote: { type: "STRING" },
          confidence: { type: "NUMBER" },
        },
        required: ["field", "value", "quote", "confidence"],
        // Quote first: the value is then read from it, and models stop echoing placeholders.
        propertyOrdering: ["field", "quote", "value", "confidence"],
      },
    },
  },
  required: ["facts"],
};

type Raw = { field: string; value: string; quote: string; confidence: number; window?: number };

const ENUMS: Record<string, string[]> = {
  "person.maritalStatus": ["single", "married", "common_law", "separated", "divorced", "widowed"],
  "person.residencyStatus": ["citizen", "permanent_resident", "other"],
};
const isBooleanField = (f: string) =>
  /^(money\.hasPrivateDental|benefits\.|child\.\d+\.(isPrimaryCaregiver|dtcApproved)$)/.test(f) ||
  (/limitation\.\w+$/.test(f) && !f.endsWith("sinceYear"));

const isYearField = (f: string) => /(lastYearFiled|sinceYear|stoppedYear)$/.test(f);

/** The value has the right type and a plausible size for its field. */
export function validValue(field: string, value: FactValue): boolean {
  if (ENUMS[field]) return typeof value === "string" && ENUMS[field].includes(value);
  if (isBooleanField(field)) return typeof value === "boolean";
  if (typeof value !== "number" || value < 0) return false;
  if (isYearField(field)) return value >= 1940 && value <= new Date().getFullYear();
  if (field === "person.age") return value >= 16 && value <= 115;
  if (/^child\.\d+\.age$/.test(field)) return value <= 25;
  return true;
}

/** The model's value, or for number fields the number in the quote when the model's value is unusable. */
function valueOf(f: Raw): FactValue {
  const raw = coerce(f.value);
  // "common law" and "common-law" both mean common_law.
  const value = ENUMS[f.field] && typeof raw === "string" ? raw.replace(/[\s-]+/g, "_") : raw;
  if (validValue(f.field, value) || isBooleanField(f.field) || ENUMS[f.field]) return value;
  return numberInQuote(f.quote, f.field.startsWith("money.")) ?? value;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

function coerce(value: string): FactValue {
  const v = value.trim();
  if (/^(true|yes)$/i.test(v)) return true;
  if (/^(false|no)$/i.test(v)) return false;
  const n = Number(v.replace(/[$,\s]/g, ""));
  if (v !== "" && Number.isFinite(n)) return n;
  return wordsToNumber(v) ?? v.toLowerCase();
}

async function extractChunk(text: string): Promise<Raw[]> {
  const { facts } = await generateJson<{ facts: Raw[] }>({
    system: SYSTEM,
    parts: [{ text: `Transcript:\n${text}` }],
    schema: SCHEMA,
  });
  return facts;
}

/** Split into overlapping windows of a few lines, the same size the live session sends. */
function windows(lines: string[], size = 4, step = 3): string[] {
  if (lines.length <= size) return [lines.join("\n")];
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += step) out.push(lines.slice(i, i + size).join("\n"));
  return out;
}

/**
 * Extract facts from transcript text. "No quote, no fact": anything whose quote isn't actually in the
 * transcript is dropped. Facts below 0.75 confidence come back unconfirmed so staff check them.
 */
// Anything shaped like a SIN (3-3-3 digits) is removed before the text leaves the server or lands in a quote.
const SIN_LIKE = /\b\d{3}[ -]?\d{3}[ -]?\d{3}\b/g;

export async function extractFacts(rawTranscript: string): Promise<{ facts: Fact[]; dropped: Raw[] }> {
  const transcript = rawTranscript.replace(SIN_LIKE, "[number removed]");
  const lines = transcript.split("\n").filter((l) => l.trim());
  const perWindow = await mapLimit(windows(lines), 2, extractChunk);
  const found = perWindow.flatMap((facts, window) => facts.map((f) => ({ ...f, window })));

  // Whole-word match, so a quote of "4" can't hide inside "14,000" and an empty or punctuation-only quote never counts.
  const haystack = ` ${normalize(transcript)} `;
  const quoted = (q: string) => q.length >= 2 && haystack.includes(` ${q} `);
  const grounded = (f: Raw) =>
    EXTRACTABLE_FIELDS.includes(f.field) &&
    typeof f.quote === "string" &&
    quoted(normalize(f.quote)) &&
    validValue(f.field, valueOf(f));
  const dropped = found.filter((f) => !grounded(f));

  // A different value later in the conversation is a correction, so it wins. The same value keeps the
  // most confident quote.
  const best = new Map<string, Raw>();
  for (const f of found.filter(grounded)) {
    const prev = best.get(f.field);
    const changed = prev && valueOf(prev) !== valueOf(f);
    if (!prev || changed || f.confidence > prev.confidence) best.set(f.field, f);
  }
  const facts = [...best.values()].map((f) => ({
    field: f.field as FactField,
    value: valueOf(f),
    source: "transcript" as const,
    quote: f.quote,
    confidence: Math.max(0, Math.min(1, f.confidence)),
    confirmed: f.confidence >= 0.75,
  }));
  return { facts, dropped };
}
