import { asc, eq } from "drizzle-orm";
import type { Fact, FactField, FactSource, FactValue } from "@/lib/types";
import { getDb, schema } from "./index";
import { DEMO_CENTRE } from "./seed";

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

/** A new client, typed in by staff (name and an optional one-line note). Returns the new id. */
export async function addClientRecord(name: string, summary: string): Promise<string> {
  const db = await getDb();
  const id = `client-${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(schema.clients).values({ id, centre: DEMO_CENTRE, name, summary });
  // The audit log is shown publicly, so it records that a client was added, not who.
  await db.insert(schema.audit).values({ actor: "staff", action: "client.added", detail: {} });
  return id;
}
