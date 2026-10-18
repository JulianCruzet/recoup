"use client";

import { useEffect, useRef, useState } from "react";
import { EXPLAIN_LANGUAGES, type ExplainLanguage } from "@/lib/languages";

const Spinner = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 animate-spin">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
    <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** "Explain to the client": the AI rewrites the rule's reasons in plain words, in the client's language. */
export function ExplainResult({ clientId, program }: { clientId: string; program: string }) {
  const [language, setLanguage] = useState<ExplainLanguage>("English");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [answer, setAnswer] = useState<{ text: string; checked: boolean; language: ExplainLanguage } | null>(null);
  const [voice, setVoice] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);

  /** Stop any reading and free its audio. */
  const stop = () => {
    if (audio.current) {
      audio.current.pause();
      URL.revokeObjectURL(audio.current.src);
      audio.current = null;
    }
    setVoice("idle");
  };
  useEffect(() => () => audio.current?.pause(), []);

  const explain = async () => {
    stop();
    setState("loading");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, program, language }),
      });
      if (!res.ok) return setState("error");
      setAnswer({ ...(await res.json()), language });
      setState("done");
    } catch {
      setState("error");
    }
  };

  /** Read the explanation aloud with Gemini's voice, in the language it was written in. */
  const listen = async () => {
    if (!answer) return;
    if (voice === "playing") return stop();
    setVoice("loading");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, program, language: answer.language, text: answer.text }),
      });
      if (!res.ok) return setVoice("error");
      const player = new Audio(URL.createObjectURL(await res.blob()));
      player.onended = stop;
      audio.current = player;
      await player.play();
      setVoice("playing");
    } catch {
      setVoice("error");
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
          {state === "loading" && <Spinner />}
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
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-soft">
              {answer.checked
                ? "Checked: every number above comes from the rules, not the AI."
                : "The AI's wording used a number the rules didn't produce, so this is the rule's own explanation."}
            </p>
            <button
              onClick={listen}
              disabled={voice === "loading"}
              aria-label={voice === "playing" ? "Stop reading aloud" : `Read aloud in ${answer.language}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-night px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {voice === "loading" ? (
                <Spinner />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-3.5">
                  {voice === "playing" ? (
                    <rect x="6" y="6" width="12" height="12" rx="1.5" />
                  ) : (
                    <>
                      <path d="M11 5 6 9H3v6h3l5 4V5z" />
                      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                    </>
                  )}
                </svg>
              )}
              {voice === "loading" ? "Getting the voice…" : voice === "playing" ? "Stop" : voice === "error" ? "Couldn't read it. Try again" : "Listen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
