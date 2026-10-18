import { onlyRuleNumbers } from "@/lib/ai/guard";
import { speak } from "@/lib/ai/speech";
import { getFacts } from "@/lib/db/queries";
import { badRequest, readJson, signInFirst } from "@/lib/http";
import { evaluate } from "@/lib/rules";
import { isStaff } from "@/lib/supabase/server";

const MAX_CHARS = 1500;

/**
 * Read an explanation aloud. Only text that passes the same number check as the explanation is spoken,
 * so the voice can't say an amount the rules didn't produce.
 */
export async function POST(request: Request) {
  if (!(await isStaff())) return signInFirst();
  const body = await readJson<{ clientId: string; program: string; text: string }>(request);
  if (!body) return badRequest("JSON body required");
  const { clientId, program, text } = body;
  if (!clientId || !program || typeof text !== "string" || !text.trim()) return badRequest("clientId, program and text required");
  if (text.length > MAX_CHARS) return badRequest(`Keep the text under ${MAX_CHARS} characters`);

  const result = evaluate(await getFacts(clientId)).results.find((r) => r.program === program);
  if (!result) return Response.json({ error: "no result for that program" }, { status: 404 });
  if (!onlyRuleNumbers(text, result)) return Response.json({ error: "text has a number the rules didn't produce" }, { status: 422 });

  try {
    const wav = await speak(text);
    return new Response(new Blob([wav as BlobPart], { type: "audio/wav" }), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "could not read it aloud" }, { status: 502 });
  }
}
