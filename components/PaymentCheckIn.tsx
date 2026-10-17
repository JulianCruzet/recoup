"use client";

import { useState } from "react";
import { confirmPayment } from "@/app/(app)/tracker/actions";

/** SIMULATED text check-in: "Did your payment arrive?" and the client's reply. */
export function PaymentCheckIn({ applicationId, expected, clientName }: { applicationId: string; expected: number; clientName: string }) {
  const [sent, setSent] = useState(false);
  if (!sent) {
    return (
      <button onClick={() => setSent(true)} className="mt-3 w-full rounded-full border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold">
        Text {clientName.split(/[ .]/)[0]}: did it arrive?
      </button>
    );
  }
  return (
    <div className="mt-3 space-y-2 text-xs">
      <p className="ml-auto w-fit max-w-[90%] rounded-2xl bg-night px-3 py-2 text-white">
        Hi {clientName.split(/[ .]/)[0]}, it&rsquo;s the centre. Did your payment arrive? Reply YES or NO.
      </p>
      <form action={confirmPayment}>
        <input type="hidden" name="id" value={applicationId} />
        <input type="hidden" name="expected" value={expected} />
        <button className="w-fit rounded-2xl bg-accent/15 px-3 py-2 font-semibold">YES (client reply)</button>
      </form>
      <p className="text-[11px] text-ink-soft">Simulated text for the demo.</p>
    </div>
  );
}
