import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { isStaff } from "@/lib/supabase/server";
import { readJson, signInFirst } from "@/lib/http";

/** Record that the client agreed, before anything is heard or typed. The audit row carries the time. */
export async function POST(request: Request, ctx: RouteContext<"/api/clients/[id]/consent">) {
  const { id } = await ctx.params;
  if (!(await isStaff())) return signInFirst();
  const body = await readJson<{ kind: string }>(request);
  const kind = body?.kind;
  if (kind !== "recording" && kind !== "notes") return Response.json({ error: "kind must be recording or notes" }, { status: 400 });

  const db = await getDb();
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
  if (!client) return Response.json({ error: "client not found" }, { status: 404 });

  await db.insert(schema.audit).values({ actor: "staff", action: "consent.recorded", detail: { clientId: id, kind } });
  return Response.json({ recorded: true });
}
