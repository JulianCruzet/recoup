import type { PgliteDatabase } from "drizzle-orm/pglite";
import { evaluate } from "@/lib/rules";
import type { Stage } from "@/lib/tracker/stages";
import type { Fact, ProgramId } from "@/lib/types";
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
  await seedDemoApplications(db);
  await db.insert(schema.audit).values({ actor: "system", action: "seed", detail: { personas: personas.length } });
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Demo applications for Mrs. K. and Mr. R., all still in To prepare; the tracker's two scripted
 * "Fast-forward 8 weeks" clicks (lib/tracker/demo.ts) move them across the board. Sana's family is
 * left without any, so "Start applications" can be pressed live in the demo.
 * Each step is [days ago, stage, note]; amounts come from the rules, like a real application.
 */
const DEMO_APPLICATIONS: { clientId: string; program: ProgramId; steps: [number, Stage, string][] }[] = [
  { clientId: "mrs-k", program: "gis", steps: [[4, "identified", "Found at intake"], [2, "preparing", "ISP-3025 filled in"]] },
  { clientId: "mrs-k", program: "ontario_gains", steps: [[4, "identified", "Found at intake"]] },
  { clientId: "mrs-k", program: "cgeb", steps: [[4, "identified", "Found at intake"]] },
  { clientId: "mrs-k", program: "cdcp", steps: [[4, "identified", "Found at intake"], [1, "preparing", "Online application started"]] },
  { clientId: "mrs-k", program: "ontario_trillium", steps: [[4, "identified", "Found at intake; rent amount still needed"]] },
  { clientId: "mr-r", program: "dtc", steps: [[3, "identified", "Found at intake"], [1, "preparing", "T2201 Part A filled in"]] },
  { clientId: "mr-r", program: "canada_disability_benefit", steps: [[3, "identified", "Found at intake; waits on the Disability Tax Credit"]] },
  { clientId: "mr-r", program: "cdcp", steps: [[3, "identified", "Found at intake"]] },
];

export async function seedDemoApplications(db: PgliteDatabase<typeof schema>) {
  const now = Date.now();
  for (const demo of DEMO_APPLICATIONS) {
    const persona = (personas as Persona[]).find((p) => p.id === demo.clientId);
    const result = persona && evaluate(persona.facts).results.find((r) => r.program === demo.program);
    if (!result || result.status === "not_eligible") continue;
    const at = (daysAgo: number) => new Date(now - daysAgo * DAY);
    const expected = Math.round((result.backPayEstimate ?? 0) + (result.annualEstimate ?? 0));
    const [first] = demo.steps;
    const last = demo.steps[demo.steps.length - 1];
    await db.insert(schema.applications).values({
      id: `${demo.clientId}-${demo.program}`,
      clientId: demo.clientId,
      program: demo.program,
      stage: last[1],
      estimate: { backPay: result.backPayEstimate ?? 0, annual: result.annualEstimate ?? 0, expected, status: result.status },
      timeline: demo.steps.map(([daysAgo, to, note]) => ({ at: at(daysAgo).toISOString(), to, note })),
      amountReceived: last[1] === "paid" ? expected : null,
      createdAt: at(first[0]),
      updatedAt: at(last[0]),
    });
  }
}
