import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { Fact } from "@/lib/types";
import personas from "@/seed/personas.json";
import * as schema from "./schema";

type Persona = { id: string; name: string; summary: string; facts: Fact[] };

export const DEMO_CENTRE = "Eastview Community Centre";

/** Load the three demo personas as clients with their facts. */
export async function seedPersonas(db: PgliteDatabase<typeof schema>) {
  for (const persona of personas as Persona[]) {
    await db.insert(schema.clients).values({
      id: persona.id,
      centre: DEMO_CENTRE,
      name: persona.name,
      summary: persona.summary,
      personaId: persona.id,
    });
    await db.insert(schema.facts).values(
      persona.facts.map((f) => ({
        clientId: persona.id,
        field: f.field,
        value: f.value,
        source: f.source,
        quote: f.quote ?? null,
        confidence: f.confidence,
        confirmed: f.confirmed,
      })),
    );
  }
  await db.insert(schema.audit).values({ actor: "system", action: "seed", detail: { personas: personas.length } });
}
