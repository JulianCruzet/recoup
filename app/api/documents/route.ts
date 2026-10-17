import { readDocument } from "@/lib/ai/documents";
import { isStaff } from "@/lib/supabase/server";
import { badRequest, signInFirst } from "@/lib/http";

const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isStaff())) return signInFirst();
  const form = await request.formData().catch(() => null);
  if (!form) return badRequest("Upload a photo (JPG or PNG) under 6 MB.");
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "file required" }, { status: 400 });
  if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
    return Response.json({ error: "Upload a photo (JPG or PNG) under 6 MB." }, { status: 400 });
  }
  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    return Response.json(await readDocument({ mimeType: file.type, base64 }));
  } catch (error) {
    return Response.json({ facts: [], error: error instanceof Error ? error.message : "could not read document" }, { status: 502 });
  }
}
