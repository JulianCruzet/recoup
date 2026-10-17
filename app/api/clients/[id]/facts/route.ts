import { and, eq } from "drizzle-orm";
import { EXTRACTABLE_FIELDS, validValue } from "@/lib/ai/extract";
import { getDb, schema } from "@/lib/db";
import { badRequest, readJson, signInFirst } from "@/lib/http";
import { isStaff } from "@/lib/supabase/server";
import type { Fact, FactSource } from "@/lib/types";

const SOURCES: FactSource[] = ["transcript", "document", "staff"];

/** One fact as the intake screen sends it, checked field by field; null if anything is off. */
function clean(f: unknown): Fact | null {
  if (!f || typeof f !== "object") return null;
  const { field, value, source, quote, confidence, confirmed } = f as Partial<Fact>;
  if (typeof field !== "string" || !EXTRACTABLE_FIELDS.includes(field)) return null;
  if (value === undefined || value === null || !validValue(field, value)) return null;
  if (!SOURCES.includes(source as FactSource)) return null;
  return {
    field: field as Fact["field"],
    value,
    source: source as FactSource,
    quote: typeof quote === "string" ? quote.slice(0, 500) : undefined,
    confidence: typeof confidence === "number" && Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    confirmed: confirmed === true,
  };
}

/** Save facts from a session: each field is replaced by the newest value, and the change is audited. */
export async function POST(request: Request, ctx: RouteContext<"/api/clients/[id]/facts">) {
  if (!(await isStaff())) return signInFirst();
  const { id } = await ctx.params;
  const body = await readJson<{ facts: unknown[] }>(request);
  if (!body || !Array.isArray(body.facts)) return badRequest("facts required");
  const facts = body.facts.map(clean);
  if (facts.some((f) => f === null)) return badRequest("Each fact needs a known field, a valid value and a source.");

  const db = await getDb();
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
  if (!client) return Response.json({ error: "client not found" }, { status: 404 });

  // All or nothing: a failure part-way can't leave a field deleted without its replacement.
  await db.transaction(async (tx) => {
    for (const f of facts as Fact[]) {
      await tx.delete(schema.facts).where(and(eq(schema.facts.clientId, id), eq(schema.facts.field, f.field)));
      await tx.insert(schema.facts).values({
        clientId: id,
        field: f.field,
        value: f.value,
        source: f.source,
        quote: f.quote ?? null,
        confidence: f.confidence,
        confirmed: f.confirmed,
      });
    }
    await tx.insert(schema.audit).values({ actor: "staff", action: "facts.saved", detail: { clientId: id, fields: facts.map((f) => f!.field) } });
  });
  return Response.json({ saved: facts.length });
}
