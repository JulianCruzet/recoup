import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { Fact } from "@/lib/types";

/** Save facts from a session: each field is replaced by the newest value, and the change is audited. */
export async function POST(request: Request, ctx: RouteContext<"/api/clients/[id]/facts">) {
  const { id } = await ctx.params;
  const { facts } = (await request.json()) as { facts?: Fact[] };
  if (!Array.isArray(facts)) return Response.json({ error: "facts required" }, { status: 400 });

  const db = await getDb();
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
  if (!client) return Response.json({ error: "client not found" }, { status: 404 });

  for (const f of facts) {
    await db.delete(schema.facts).where(and(eq(schema.facts.clientId, id), eq(schema.facts.field, f.field)));
    await db.insert(schema.facts).values({
      clientId: id,
      field: f.field,
      value: f.value,
      source: f.source,
      quote: f.quote ?? null,
      confidence: f.confidence,
      confirmed: f.confirmed,
    });
  }
  await db.insert(schema.audit).values({ actor: "staff", action: "facts.saved", detail: { clientId: id, fields: facts.map((f) => f.field) } });
  return Response.json({ saved: facts.length });
}
