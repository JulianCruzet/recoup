import { extractFacts } from "@/lib/ai/extract";
import { isStaff } from "@/lib/supabase/server";
import { badRequest, readJson, signInFirst } from "@/lib/http";

// About 300 lines of conversation; the live session sends a few lines at a time.
const MAX_CHARS = 20000;

export async function POST(request: Request) {
  if (!(await isStaff())) return signInFirst();
  const body = await readJson<{ transcript: string }>(request);
  if (!body) return badRequest("JSON body required");
  const { transcript } = body;
  if (typeof transcript !== "string" || !transcript.trim()) return Response.json({ facts: [] });
  if (transcript.length > MAX_CHARS) return badRequest("Transcript too long; send it in parts.");
  try {
    return Response.json(await extractFacts(transcript));
  } catch (error) {
    return Response.json({ facts: [], error: error instanceof Error ? error.message : "extraction failed" }, { status: 502 });
  }
}
