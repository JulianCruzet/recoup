"use server";

import { revalidatePath } from "next/cache";
import { addNote, listApplications, moveApplication, openApplications } from "@/lib/db/applications";
import { addDays, demoOffsetDays, demoToday, setDemoOffset } from "@/lib/db/demo-clock";
import { getFacts } from "@/lib/db/queries";
import { evaluate } from "@/lib/rules";
import { STAGE_LABEL, STAGES, type Stage } from "@/lib/tracker/stages";
import { simulateForward } from "@/lib/tracker/timeline";

export async function startApplications(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;
  const { results } = evaluate(await getFacts(clientId));
  await openApplications(clientId, results, new Date());
  revalidatePath("/tracker");
  revalidatePath(`/clients/${clientId}`);
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

/** SIMULATED: jump the demo clock forward and play out plausible government responses. */
export async function fastForward(formData: FormData) {
  const days = Number(formData.get("days") ?? 56);
  const today = await demoToday();
  const apps = await listApplications();
  const waiting = apps.filter((a) => a.submittedAt && ["submitted", "in_review"].includes(a.stage));
  // The smallest one stalls, so the overdue flag and a follow-up draft can be shown.
  const slow = waiting.length > 1 ? [waiting.reduce((min, a) => (a.expected < min.expected ? a : min)).id] : [];
  for (const e of simulateForward(apps, today, days, slow)) {
    const app = apps.find((a) => a.id === e.applicationId)!;
    await moveApplication(e.applicationId, e.to, `${e.note} (simulated)`, addDays(today, e.day), e.to === "paid" ? app.expected : undefined);
  }
  await setDemoOffset((await demoOffsetDays()) + days);
  revalidatePath("/tracker");
  revalidatePath("/dashboard");
}

export async function resetDemoClock() {
  await setDemoOffset(0);
  revalidatePath("/tracker");
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
