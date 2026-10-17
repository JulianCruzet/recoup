"use client";

import { useState } from "react";
import { confirmPayment } from "@/app/(app)/tracker/actions";
import { greetingName } from "@/lib/format";

/** SIMULATED text check-in: "Did your payment arrive?" and the client's reply. */
export function PaymentCheckIn({ applicationId, expected, clientName }: { applicationId: string; expected: number; clientName: string }) {
  const [sent, setSent] = useState(false);
  const name = greetingName(clientName);
  if (!sent) {
    return (
      <button
        onClick={() => setSent(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:bg-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-3.5">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
        Ask {name} if it arrived
      </button>
    );
  }
  return (
    <div className="mt-3 space-y-1.5 text-xs">
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-night px-3 py-2 text-white">
        Hi {name}, it&rsquo;s the centre. Did your payment arrive? Reply YES or NO.
      </p>
      <form action={confirmPayment} className="flex items-center gap-2">
        <input type="hidden" name="id" value={applicationId} />
        <input type="hidden" name="expected" value={expected} />
        <button className="rounded-2xl rounded-bl-md bg-white px-3 py-2 font-semibold shadow-sm transition hover:bg-approved-soft">YES</button>
        <span className="text-[11px] text-ink-soft">Tap when {name} replies (simulated text)</span>
      </form>
    </div>
  );
}
