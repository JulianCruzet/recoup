"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addClientRecord } from "@/lib/db/queries";
import { isStaff } from "@/lib/supabase/server";

export type AddClientState = { error?: string };

// Nine digits in a row (with optional spaces or dashes) looks like a SIN, which Recoup never stores.
const LOOKS_LIKE_SIN = /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/;

/** Add a client typed in by staff, then go straight to their intake. */
export async function addClient(_previous: AddClientState, formData: FormData): Promise<AddClientState> {
  if (!(await isStaff())) return { error: "Sign in to add clients." };
  const tidy = (key: string) => String(formData.get(key) ?? "").trim().replace(/\s+/g, " ");
  const name = tidy("name");
  const summary = tidy("summary");
  if (!name) return { error: "Add the client's name." };
  if (name.length > 60) return { error: "Keep the name under 60 characters." };
  if (summary.length > 200) return { error: "Keep the note to one line (under 200 characters)." };
  if (LOOKS_LIKE_SIN.test(`${name} ${summary}`)) return { error: "That looks like a SIN. Recoup never stores one; leave it out." };
  const id = await addClientRecord(name, summary);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect(`/clients/${id}/intake`);
}
