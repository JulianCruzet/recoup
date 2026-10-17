"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/** SIMULATED: "Fast-forward 8 weeks", with a time-lapse while the board catches up. */
export function FastForwardButton({ action, fromWeek }: { action: () => Promise<void>; fromWeek: number }) {
  return (
    <form action={action}>
      <Submit fromWeek={fromWeek} />
    </form>
  );
}

function Submit({ fromWeek }: { fromWeek: number }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button disabled={pending} className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-night/85 active:scale-[0.98] disabled:opacity-70">
        Fast-forward 8 weeks
      </button>
      {pending && <TimeLapse fromWeek={fromWeek} />}
    </>
  );
}

function TimeLapse({ fromWeek }: { fromWeek: number }) {
  const [weeks, setWeeks] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setWeeks((w) => Math.min(8, w + 1)), 180);
    return () => clearInterval(t);
  }, []);
  return (
    <div role="status" className="fixed inset-0 z-40 grid place-items-center bg-white/20 px-4 backdrop-blur-[3px]">
      <div className="glass glass-solid w-full max-w-xs rounded-3xl p-6 text-center backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-wide text-accent-ink uppercase">Simulated</p>
        <p className="font-display mt-1 text-3xl font-extrabold tabular-nums">Week {fromWeek + weeks}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out" style={{ width: `${(weeks / 8) * 100}%` }} />
        </div>
        <p className="mt-3 text-sm text-ink-soft">Forms go in, letters arrive, payments land…</p>
      </div>
    </div>
  );
}
