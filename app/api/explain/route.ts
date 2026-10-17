import { explainResult } from "@/lib/ai/followup";
import { getFacts } from "@/lib/db/queries";
import { EXPLAIN_LANGUAGES, type ExplainLanguage } from "@/lib/languages";
import { evaluate } from "@/lib/rules";
import { isStaff } from "@/lib/supabase/server";
import { badRequest, readJson, signInFirst } from "@/lib/http";

/** Explain one result in plain words, in the client's language. The numbers come from the rules, never the AI. */
export async function POST(request: Request) {
  if (!(await isStaff())) return signInFirst();
  const body = await readJson<{ clientId: string; program: string; language: string }>(request);
  if (!body) return badRequest("JSON body required");
  const { clientId, program, language } = body;
  if (!clientId || !program) return Response.json({ error: "clientId and program required" }, { status: 400 });
  const lang = (EXPLAIN_LANGUAGES as readonly string[]).includes(language ?? "") ? (language as ExplainLanguage) : "English";

  const result = evaluate(await getFacts(clientId)).results.find((r) => r.program === program);
  if (!result) return Response.json({ error: "no result for that program" }, { status: 404 });
  try {
    return Response.json(await explainResult(result, lang));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "could not explain" }, { status: 502 });
  }
}
