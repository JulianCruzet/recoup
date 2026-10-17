import { boolean, jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  centre: text("centre").notNull(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  personaId: text("persona_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const facts = pgTable("facts", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull(),
  field: text("field").notNull(),
  value: jsonb("value").notNull(),
  source: text("source").notNull(),
  quote: text("quote"),
  confidence: real("confidence").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  mode: text("mode").notNull().default("record"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  transcript: jsonb("transcript").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  program: text("program").notNull(),
  stage: text("stage").notNull(),
  estimate: jsonb("estimate").notNull(),
  timeline: jsonb("timeline").notNull().default([]),
  amountReceived: real("amount_received"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  applicationId: text("application_id"),
  text: text("text").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  done: boolean("done").notNull().default(false),
});

export const audit = pgTable("audit", {
  id: serial("id").primaryKey(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  detail: jsonb("detail").notNull().default({}),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
