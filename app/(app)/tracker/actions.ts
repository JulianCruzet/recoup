"use server";

import { revalidatePath } from "next/cache";
import { moveApplication, openApplications } from "@/lib/db/applications";
import { getFacts } from "@/lib/db/queries";
import { evaluate } from "@/lib/rules";
import { STAGE_LABEL, STAGES, type Stage } from "@/lib/tracker/stages";

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
  await moveApplication(id, to, `Marked ${STAGE_LABEL[to].toLowerCase()} by staff`, new Date(), to === "paid" ? expected : undefined);
  revalidatePath("/tracker");
}
