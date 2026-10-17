import "server-only";
import type { EligibilityResult, ProgramId } from "@/lib/types";
import { PROGRAMS } from "@/lib/programs";
import { STAGE_LABEL, type Stage } from "@/lib/tracker/stages";
import { generateJson } from "./gemini";
import { onlyRuleNumbers } from "./guard";
import type { ExplainLanguage } from "@/lib/languages";

export type FollowUpDraft = { toAgency: string; toClient: string };

const SYSTEM = `You draft follow-ups for a community-centre caseworker in Ontario helping a client with a government benefit application.
Write two short drafts:
1. toAgency: a polite, specific status inquiry the caseworker can send or read on the phone to the government office. Mention the program, when it was submitted, how long it has been, and ask what is outstanding. Do not invent reference numbers, phone numbers, addresses or policy; use [brackets] for anything the caseworker must fill in. Never include a SIN.
2. toClient: a warm, plain-language text message (under 320 characters) to the client explaining where things stand and the one thing they should do next, if any.
These are drafts a human will review and edit before anything is sent.`;

const SCHEMA = {
  type: "OBJECT",
  properties: { toAgency: { type: "STRING" }, toClient: { type: "STRING" } },
  required: ["toAgency", "toClient"],
};

export async function draftFollowUp(input: {
  program: ProgramId;
  stage: Stage;
  submittedAt?: string;
  daysWaiting: number;
  expectedDays: number;
  clientFirstName: string;
}): Promise<FollowUpDraft> {
  const program = PROGRAMS[input.program];
  return generateJson<FollowUpDraft>({
    system: SYSTEM,
    schema: SCHEMA,
    temperature: 0.4,
    parts: [
      {
        text: [
          `Program: ${program.name} (${program.howToApply})`,
          `Current stage: ${STAGE_LABEL[input.stage]}`,
          `Submitted: ${input.submittedAt ?? "unknown"}; waiting ${input.daysWaiting} days; usually decided within ${input.expectedDays} days.`,
          `Client first name: ${input.clientFirstName}`,
        ].join("\n"),
      },
    ],
  });
}

const EXPLAIN_SYSTEM = `Rewrite the reasons behind a benefit estimate as two or three warm, plain-language sentences a client with no tax knowledge understands, in the language requested.
Use ONLY the facts given. Do not add, change or round any number; if you mention an amount or a year, copy it exactly, written with Western digits. Say "likely" or "may", never "will" or "you are eligible". Keep the program's name in English in brackets after its translated name, so the client can find it on government letters.`;

/**
 * Plain-language "why" for one result, in the client's language, written only from the rules engine's own output.
 * If the text uses any number the rules didn't produce, the rules' own wording is returned instead.
 */
export async function explainResult(result: EligibilityResult, language: ExplainLanguage = "English"): Promise<{ text: string; checked: boolean }> {
  const { text } = await generateJson<{ text: string }>({
    system: EXPLAIN_SYSTEM,
    schema: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] },
    temperature: 0.3,
    parts: [
      { text: `Write the explanation ONLY in ${language}${language === "English" ? "" : `, not English`}. Write amounts as dollars with Western digits, like $2,292.` },
      {
        text: JSON.stringify({
          program: PROGRAMS[result.program].name,
          status: result.status,
          backPay: result.backPayEstimate,
          yearly: result.annualEstimate,
          reasons: result.reasons,
        }),
      },
    ],
  });
  return onlyRuleNumbers(text, result) ? { text, checked: true } : { text: result.reasons.join(" "), checked: false };
}
