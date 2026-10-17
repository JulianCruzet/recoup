"use client";

import { useState } from "react";
import { EXPLAIN_LANGUAGES, type ExplainLanguage } from "@/lib/languages";

/** "Explain to the client": the AI rewrites the rule's reasons in plain words, in the client's language. */
export function ExplainResult({ clientId, program }: { clientId: string; program: string }) {
  const [language, setLanguage] = useState<ExplainLanguage>("English");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [answer, setAnswer] = useState<{ text: string; checked: boolean } | null>(null);

  const explain = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, program, language }),
      });
      if (!res.ok) return setState("error");
      setAnswer(await res.json());
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          onClick={explain}
          disabled={state === "loading"}
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-white/70 px-3.5 py-1.5 font-semibold hover:bg-white disabled:opacity-60"
        >
          {state === "loading" && (
            <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 animate-spin">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
              <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {state === "loading" ? `Explaining in ${language}…` : state === "error" ? "Couldn't explain. Try again" : "Explain to the client"}
        </button>
        <label className="text-ink-soft">
          <span className="sr-only">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as ExplainLanguage)}
            className="rounded-full border border-ink/15 bg-white/70 px-2.5 py-1.5 text-ink"
          >
            {EXPLAIN_LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>
      {state === "loading" && (
        <div role="status" className="mt-2 space-y-2 rounded-2xl bg-white/80 px-4 py-4">
          <span className="sr-only">Writing the explanation…</span>
          <div className="h-3 w-11/12 animate-pulse rounded-full bg-ink/10" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-ink/10" />
          <div className="h-3 w-2/5 animate-pulse rounded-full bg-ink/10" />
        </div>
      )}
      {state === "done" && answer && (
        <div aria-live="polite" className="mt-2 rounded-2xl bg-white/80 px-4 py-3 text-[15px]">
          <p dir="auto">{answer.text}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {answer.checked
              ? "Checked: every number above comes from the rules, not the AI."
              : "The AI's wording used a number the rules didn't produce, so this is the rule's own explanation."}
          </p>
        </div>
      )}
    </div>
  );
}
