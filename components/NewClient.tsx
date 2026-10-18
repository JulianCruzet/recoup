"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState } from "react";
import { addClient, type AddClientState } from "@/app/(app)/clients/actions";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The page heading with a "New client" button beside it; the form opens underneath, and saving goes straight to the intake. */
export function NewClient({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AddClientState, FormData>(addClient, {});

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {children}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-night/85 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden className={`size-4 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          {open ? "Cancel" : "New client"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            action={action}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="glass glass-solid mt-4 grid gap-4 rounded-3xl p-6 backdrop-blur-xl sm:grid-cols-[minmax(0,16rem)_1fr_auto] sm:items-end">
              <label className="grid gap-1.5 text-sm font-semibold">
                Name
                <input
                  name="name"
                  required
                  maxLength={60}
                  autoFocus
                  autoComplete="off"
                  placeholder="First name and initial, e.g. Amina R."
                  className="rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                <span>
                  One-line note <span className="font-normal text-ink-soft">(optional)</span>
                </span>
                <input
                  name="summary"
                  maxLength={200}
                  autoComplete="off"
                  placeholder="e.g. 68, lives alone, hasn't filed since 2021"
                  className="rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal"
                />
              </label>
              <button disabled={pending} className="rounded-full bg-night px-6 py-3 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-night/85 disabled:opacity-60">
                {pending ? "Adding…" : "Add and start intake"}
              </button>
              <p className="text-xs text-ink-soft sm:col-span-3">
                Names are typed by staff. Never enter a SIN; the client adds it to their own forms.
                {state.error && (
                  <span role="alert" className="mt-1 block text-sm font-medium text-red-800">
                    {state.error}
                  </span>
                )}
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
