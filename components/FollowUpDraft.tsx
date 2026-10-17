"use client";

import { useState } from "react";
import { recordFollowUp } from "@/app/(app)/tracker/actions";

/** Ask the AI for a follow-up; staff read, edit and approve it before anything "goes out". */
export function FollowUpDraft({ applicationId }: { applicationId: string }) {
  const [state, setState] = useState<"idle" | "drafting" | "ready" | "error">("idle");
  const [toAgency, setToAgency] = useState("");
  const [toClient, setToClient] = useState("");

  const draft = async () => {
    setState("drafting");
    const res = await fetch("/api/followup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId }) });
    const body = await res.json();
    if (!res.ok) return setState("error");
    setToAgency(body.toAgency);
    setToClient(body.toClient);
    setState("ready");
  };

  if (state === "idle" || state === "error") {
    return (
      <button onClick={draft} className="mt-3 w-full rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-ink">
        {state === "error" ? "Couldn't draft. Try again" : "Draft a follow-up"}
      </button>
    );
  }
  if (state === "drafting") return <p className="mt-3 text-xs text-ink-soft">Drafting…</p>;

  return (
    <form action={recordFollowUp} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={applicationId} />
      <label className="block text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
        To the government office
        <textarea value={toAgency} onChange={(e) => setToAgency(e.target.value)} rows={6} className="mt-1 w-full rounded-xl border border-ink/15 bg-white p-2 text-xs font-normal tracking-normal normal-case text-ink" />
      </label>
      <label className="block text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
        Text to the client
        <textarea value={toClient} onChange={(e) => setToClient(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-ink/15 bg-white p-2 text-xs font-normal tracking-normal normal-case text-ink" />
      </label>
      <button className="w-full rounded-full bg-night px-3 py-1.5 text-xs font-semibold text-white">Approve and mark sent (simulated)</button>
      <p className="text-[11px] text-ink-soft">AI draft. Nothing is sent until staff approve it.</p>
    </form>
  );
}
