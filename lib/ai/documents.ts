import "server-only";
import type { Fact, FactField } from "@/lib/types";
import { generateJson } from "./gemini";

const SYSTEM = `You read a photo or scan of a Canadian tax or benefit document (for example a CRA notice of assessment, a T4, or a benefit statement).
Return the document type, the tax year it is about, and the amounts on these CRA lines if they appear: 10100 (employment income), 15000 (total income), 23600 (net income).
For each amount, "text" must be the exact characters printed on the document for that line (for example "$55,000.00").
Do not guess values that are not visible. If the image is not a tax document, return documentType "other" and no lines.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    documentType: { type: "STRING", enum: ["notice_of_assessment", "t4", "benefit_statement", "other"] },
    taxYear: { type: "NUMBER" },
    lines: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          line: { type: "STRING", enum: ["10100", "15000", "23600"] },
          amount: { type: "NUMBER" },
          text: { type: "STRING" },
        },
        required: ["line", "amount", "text"],
      },
    },
  },
  required: ["documentType", "lines"],
};

type Read = { documentType: string; taxYear?: number; lines: { line: string; amount: number; text: string }[] };

const LINE_FIELD: Record<string, FactField> = { "10100": "money.workingIncome", "23600": "money.netIncome" };

/** Turn a document image into facts. Each fact quotes the printed text it came from. */
export async function readDocument(image: { mimeType: string; base64: string }): Promise<{ documentType: string; facts: Fact[] }> {
  const read = await generateJson<Read>({
    system: SYSTEM,
    schema: SCHEMA,
    parts: [{ inlineData: { mimeType: image.mimeType, data: image.base64 } }, { text: "Read this document." }],
  });

  const facts: Fact[] = [];
  for (const l of read.lines ?? []) {
    const field = LINE_FIELD[l.line];
    // The printed text must actually contain the number we return.
    const printed = Number(l.text.replace(/[^0-9.]/g, ""));
    if (!field || !Number.isFinite(l.amount) || Math.abs(printed - l.amount) > 1) continue;
    facts.push({ field, value: Math.round(l.amount), source: "document", quote: `Line ${l.line}: ${l.text}`, confidence: 0.95, confirmed: true });
  }
  if (read.documentType === "notice_of_assessment" && read.taxYear && read.taxYear > 2000) {
    facts.push({ field: "tax.lastYearFiled", value: read.taxYear, source: "document", quote: `Notice of assessment for ${read.taxYear}`, confidence: 0.95, confirmed: true });
  }
  return { documentType: read.documentType, facts };
}
