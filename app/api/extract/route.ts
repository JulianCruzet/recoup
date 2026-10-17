import { extractFacts } from "@/lib/ai/extract";

export async function POST(request: Request) {
  const { transcript } = (await request.json()) as { transcript?: string };
  if (!transcript?.trim()) return Response.json({ facts: [] });
  try {
    return Response.json(await extractFacts(transcript));
  } catch (error) {
    return Response.json({ facts: [], error: error instanceof Error ? error.message : "extraction failed" }, { status: 502 });
  }
}
