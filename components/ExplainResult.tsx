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
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, program, language }),
    });
    if (!res.ok) return setState("error");
    setAnswer(await res.json());
    setState("done");
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          onClick={explain}
          disabled={state === "loading"}
          className="rounded-full border border-ink/20 bg-white/70 px-3.5 py-1.5 font-semibold hover:bg-white disabled:opacity-60"
        >
          {state === "loading" ? "Explaining…" : state === "error" ? "Couldn't explain. Try again" : "Explain to the client"}
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
      {state === "done" && answer && (
        <div className="mt-2 rounded-2xl bg-white/80 px-4 py-3 text-[15px]">
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
