import { asc, eq } from "drizzle-orm";
import type { Fact, FactField, FactSource, FactValue } from "@/lib/types";
import { getDb, schema } from "./index";

export async function listClients() {
  const db = await getDb();
  return db.select().from(schema.clients).orderBy(asc(schema.clients.createdAt));
}

export async function getClient(id: string) {
  const db = await getDb();
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
  return client ?? null;
}

export async function getFacts(clientId: string): Promise<Fact[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.facts).where(eq(schema.facts.clientId, clientId)).orderBy(asc(schema.facts.id));
  return rows.map((r) => ({
    field: r.field as FactField,
    value: r.value as FactValue,
    source: r.source as FactSource,
    quote: r.quote ?? undefined,
    confidence: r.confidence,
    confirmed: r.confirmed,
  }));
}
