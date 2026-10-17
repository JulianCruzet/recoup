"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { addNote, listApplications, moveApplication, openApplications } from "@/lib/db/applications";
import { addDays, demoOffsetDays, demoToday, setDemoOffset } from "@/lib/db/demo-clock";
import { getFacts } from "@/lib/db/queries";
import { seedDemoApplications } from "@/lib/db/seed";
import { evaluate } from "@/lib/rules";
import { DEMO_LEG_DAYS, DEMO_LEGS, nextLeg } from "@/lib/tracker/demo";
import { STAGE_LABEL, STAGES, type Stage } from "@/lib/tracker/stages";

export async function startApplications(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;
  const { results } = evaluate(await getFacts(clientId));
  await openApplications(clientId, results, await demoToday());
  revalidatePath("/tracker");
  revalidatePath(`/clients/${clientId}`);
  redirect("/tracker");
}

export async function advanceApplication(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "") as Stage;
  if (!id || !STAGES.includes(to)) return;
  const expected = Number(formData.get("expected") ?? 0);
  await moveApplication(id, to, `Marked ${STAGE_LABEL[to].toLowerCase()} by staff`, await demoToday(), to === "paid" ? expected : undefined);
  revalidatePath("/tracker");
  revalidatePath("/dashboard");
}

/**
 * SIMULATED: jump the demo clock 8 weeks and play the next leg of every application's scripted path
 * (lib/tracker/demo.ts). Two clicks play the whole story; after that this does nothing.
 */
export async function fastForward() {
  const offset = await demoOffsetDays();
  if (offset >= DEMO_LEG_DAYS * DEMO_LEGS) return;
  // Hold for a moment so the board's time-lapse loader reads as weeks passing.
  const timeLapse = new Promise((resolve) => setTimeout(resolve, 1600));
  const today = await demoToday();
  for (const app of await listApplications()) {
    for (const [day, to, note] of nextLeg(app.program, app.stage)) {
      await moveApplication(app.id, to, `${note} (simulated)`, addDays(today, day), to === "paid" ? app.expected : undefined);
    }
  }
  await setDemoOffset(offset + DEMO_LEG_DAYS);
  await timeLapse;
  revalidatePath("/tracker");
  revalidatePath("/dashboard");
}

/** Put the demo back to the start: the demo applications in To prepare, the clock at today. */
export async function resetDemo() {
  const db = await getDb();
  await db.delete(schema.applications);
  await seedDemoApplications(db);
  await setDemoOffset(0);
  await db.insert(schema.audit).values({ actor: "staff", action: "demo.reset", detail: {} });
  revalidatePath("/tracker");
  revalidatePath("/dashboard");
}

export async function recordFollowUp(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await addNote(id, "Status inquiry sent after staff approved the draft (simulated send)", await demoToday());
  revalidatePath("/tracker");
}

export async function confirmPayment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const expected = Number(formData.get("expected") ?? 0);
  if (!id) return;
  await moveApplication(id, "paid", "Client replied YES to the payment check-in (simulated text)", await demoToday(), expected);
  revalidatePath("/tracker");
  revalidatePath("/dashboard");
}
