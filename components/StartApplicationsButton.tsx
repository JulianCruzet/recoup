"use client";

import { useFormStatus } from "react-dom";

/** Submit button for "Start applications": shows that it's working, then the action opens the tracker. */
export function StartApplicationsButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-night/85 active:scale-[0.98] disabled:opacity-70"
    >
      {pending && (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 animate-spin">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
          <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {pending ? "Starting…" : "Start applications"}
    </button>
  );
}
