import { asc, eq } from "drizzle-orm";
import type { EligibilityResult, ProgramId } from "@/lib/types";
import { canMove, type Stage } from "@/lib/tracker/stages";
import type { TrackedApplication } from "@/lib/tracker/timeline";
import { getDb, schema } from "./index";

export type TimelineEntry = { at: string; to: Stage; note: string };
export type ApplicationRow = TrackedApplication & { clientId: string; clientName: string; timeline: TimelineEntry[] };

const expectedValue = (r: EligibilityResult) => Math.round((r.backPayEstimate ?? 0) + (r.annualEstimate ?? 0));

/** Open an application for every likely/possible result that doesn't have one yet. */
export async function openApplications(clientId: string, results: EligibilityResult[], today: Date) {
  const db = await getDb();
  const existing = new Set(
    (await db.select().from(schema.applications).where(eq(schema.applications.clientId, clientId))).map((a) => a.program),
  );
  const fresh = results.filter((r) => r.status !== "not_eligible" && !existing.has(r.program));
  for (const r of fresh) {
    await db.insert(schema.applications).values({
      id: `${clientId}-${r.program}`,
      clientId,
      program: r.program,
      stage: "identified",
      estimate: { backPay: r.backPayEstimate ?? 0, annual: r.annualEstimate ?? 0, expected: expectedValue(r), status: r.status },
      timeline: [{ at: today.toISOString(), to: "identified", note: "Found at intake" }],
      createdAt: today,
      updatedAt: today,
    });
  }
  if (fresh.length) {
    await db.insert(schema.audit).values({ actor: "staff", action: "applications.opened", detail: { clientId, programs: fresh.map((r) => r.program) } });
  }
  return fresh.length;
}

export async function listApplications(clientId?: string): Promise<ApplicationRow[]> {
  const db = await getDb();
  const rows = await db
    .select({ app: schema.applications, clientName: schema.clients.name })
    .from(schema.applications)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.applications.clientId))
    .where(clientId ? eq(schema.applications.clientId, clientId) : undefined)
    .orderBy(asc(schema.applications.createdAt));
  const apps = rows.map(({ app, clientName }) => {
    const timeline = app.timeline as TimelineEntry[];
    const submitted = timeline.find((t) => t.to === "submitted");
    return {
      id: app.id,
      clientId: app.clientId,
      clientName,
      program: app.program as ProgramId,
      stage: app.stage as Stage,
      submittedAt: submitted?.at,
      updatedAt: app.updatedAt.toISOString(),
      expected: (app.estimate as { expected: number }).expected,
      received: app.amountReceived ?? undefined,
      timeline,
    };
  });
  // Biggest money first within the same client and moment, so the board doesn't reshuffle.
  return apps.sort((a, b) => a.clientName.localeCompare(b.clientName) || b.expected - a.expected);
}

/** Move an application to a new stage, if that's a real move. Returns false otherwise. */
export async function moveApplication(id: string, to: Stage, note: string, at: Date, amountReceived?: number): Promise<boolean> {
  const db = await getDb();
  const [app] = await db.select().from(schema.applications).where(eq(schema.applications.id, id));
  if (!app || !canMove(app.stage as Stage, to)) return false;
  await db
    .update(schema.applications)
    .set({
      stage: to,
      updatedAt: at,
      timeline: [...(app.timeline as TimelineEntry[]), { at: at.toISOString(), to, note }],
      ...(to === "paid" && amountReceived !== undefined ? { amountReceived } : {}),
    })
    .where(eq(schema.applications.id, id));
  await db.insert(schema.audit).values({ actor: "staff", action: "application.moved", detail: { id, from: app.stage, to, note } });
  return true;
}

/** Add a note to an application's history without changing its stage. */
export async function addNote(id: string, note: string, at: Date) {
  const db = await getDb();
  const [app] = await db.select().from(schema.applications).where(eq(schema.applications.id, id));
  if (!app) return;
  await db
    .update(schema.applications)
    .set({ updatedAt: at, timeline: [...(app.timeline as TimelineEntry[]), { at: at.toISOString(), to: app.stage as Stage, note }] })
    .where(eq(schema.applications.id, id));
  await db.insert(schema.audit).values({ actor: "staff", action: "application.note", detail: { id, note } });
}
