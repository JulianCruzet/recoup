import { PGlite } from "@electric-sql/pglite";
import { count } from "drizzle-orm";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { seedPersonas } from "./seed";

export type Db = PgliteDatabase<typeof schema>;

// Tables are created on first use, so a fresh checkout runs with no setup step.
const CREATE = `
create table if not exists clients (
  id text primary key, centre text not null, name text not null, summary text not null default '',
  persona_id text, created_at timestamptz not null default now());
create table if not exists facts (
  id serial primary key, client_id text not null, field text not null, value jsonb not null,
  source text not null, quote text, confidence real not null, confirmed boolean not null default false,
  updated_at timestamptz not null default now());
create index if not exists facts_client on facts (client_id);
create table if not exists sessions (
  id text primary key, client_id text not null, mode text not null default 'record', consent_at timestamptz,
  transcript jsonb not null default '[]', created_at timestamptz not null default now());
create table if not exists applications (
  id text primary key, client_id text not null, program text not null, stage text not null,
  estimate jsonb not null, timeline jsonb not null default '[]', amount_received real,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists tasks (
  id text primary key, client_id text not null, application_id text, text text not null,
  due_at timestamptz, done boolean not null default false);
create table if not exists settings (key text primary key, value jsonb not null);
create table if not exists audit (
  id serial primary key, at timestamptz not null default now(), actor text not null, action text not null,
  detail jsonb not null default '{}');
`;

const globalForDb = globalThis as unknown as { recoupDb?: Promise<Db> };

async function open(): Promise<Db> {
  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);
  await client.exec(CREATE);
  const db = drizzle(client, { schema });
  const [{ n }] = await db.select({ n: count() }).from(schema.clients);
  if (n === 0) await seedPersonas(db);
  return db;
}

/** One database per server process (kept across hot reloads in dev). */
export function getDb(): Promise<Db> {
  globalForDb.recoupDb ??= open().catch((error) => {
    // Don't keep a failed connection around; the next request tries again.
    globalForDb.recoupDb = undefined;
    throw error;
  });
  return globalForDb.recoupDb;
}

export { schema };
