"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConsentPanel } from "@/components/ConsentPanel";
import { describeField, formatFactValue } from "@/lib/fields";
import { formatMoney } from "@/lib/format";
import { evaluate } from "@/lib/rules";
import type { Fact } from "@/lib/types";

type Mode = "consent" | "listening" | "typing";
type Line = { text: string; at: number };

// Chrome exposes the Web Speech API under a prefix; it isn't in the TS DOM types.
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void;
  onend: () => void;
};
const getRecognition = (): Recognition | null => {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
};

/**
 * A live intake: the conversation (spoken or typed) is sent to the extractor a few lines at a time, new
 * facts appear with their quotes, and the rules re-run after every change. Unconfirmed facts don't count
 * until staff confirm them with the client.
 */
export function LiveSession({ clientId, clientName, initialFacts }: { clientId: string; clientName: string; initialFacts: Fact[] }) {
  const [mode, setMode] = useState<Mode>("consent");
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState("");
  const [heard, setHeard] = useState<Fact[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const recognition = useRef<Recognition | null>(null);
  const sentUpTo = useRef(0);

  const staffFacts = useMemo(() => initialFacts.filter((f) => f.source === "staff"), [initialFacts]);
  const allFacts = useMemo(() => {
    const byField = new Map(staffFacts.map((f) => [f.field, f]));
    for (const f of heard) byField.set(f.field, f);
    return [...byField.values()];
  }, [staffFacts, heard]);
  const { totals, askNext } = useMemo(() => evaluate(allFacts), [allFacts]);
  const next = askNext[0];

  // Send new lines (with a little context) to the extractor once a couple have arrived.
  useEffect(() => {
    if (lines.length - sentUpTo.current < 2 && !(lines.length > sentUpTo.current && mode === "typing")) return;
    const from = Math.max(0, sentUpTo.current - 2);
    const chunk = lines.slice(from).map((l) => l.text).join("\n");
    sentUpTo.current = lines.length;
    setBusy(true);
    fetch("/api/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ transcript: chunk }) })
      .then((r) => r.json())
      .then(({ facts }: { facts?: Fact[] }) => {
        if (!facts?.length) return;
        setHeard((prev) => {
          const byField = new Map(prev.map((f) => [f.field, f]));
          // Staff-confirmed values win over anything heard later.
          for (const f of facts) if (!byField.get(f.field)?.confirmed || f.confirmed) byField.set(f.field, f);
          return [...byField.values()];
        });
        setSaved("idle");
      })
      .finally(() => setBusy(false));
  }, [lines, mode]);

  const startListening = () => {
    setMode("listening");
    const rec = getRecognition();
    if (!rec) {
      setMode("typing");
      return;
    }
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-CA";
    rec.onresult = (e) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) setLines((l) => [...l, { text: r[0].transcript.trim(), at: Date.now() }]);
        else partial += r[0].transcript;
      }
      setInterim(partial);
    };
    rec.onend = () => recognition.current && rec.start();
    recognition.current = rec;
    rec.start();
  };

  const stop = () => {
    const rec = recognition.current;
    recognition.current = null;
    rec?.stop();
    setInterim("");
  };

  useEffect(() => () => stop(), []);

  const confirm = (field: Fact["field"], ok: boolean) =>
    setHeard((prev) => (ok ? prev.map((f) => (f.field === field ? { ...f, confirmed: true, confidence: 1 } : f)) : prev.filter((f) => f.field !== field)));

  const [reading, setReading] = useState(false);
  const addDocument = async (file: File) => {
    setReading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const { facts } = (await (await fetch("/api/documents", { method: "POST", body })).json()) as { facts?: Fact[] };
      if (facts?.length) {
        setHeard((prev) => {
          const byField = new Map(prev.map((f) => [f.field, f]));
          for (const f of facts) byField.set(f.field, f);
          return [...byField.values()];
        });
        setSaved("idle");
      }
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    setSaved("saving");
    await fetch(`/api/clients/${clientId}/facts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ facts: heard }) });
    setSaved("saved");
  };

  if (mode === "consent") {
    return <ConsentPanel clientName={clientName} onRecord={startListening} onNotes={() => setMode("typing")} />;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <section className="glass glass-solid flex min-h-[60vh] flex-col rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">
            {mode === "listening" ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 animate-pulse rounded-full bg-accent" aria-hidden /> Listening
              </span>
            ) : (
              "Notes"
            )}
          </h2>
          <div className="flex gap-2">
            <label className="cursor-pointer rounded-full border border-ink/20 bg-white/60 px-4 py-2 text-sm font-semibold">
              {reading ? "Reading…" : "Add a document"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && addDocument(e.target.files[0])}
              />
            </label>
            {mode === "listening" && (
              <button onClick={() => { stop(); setMode("typing"); }} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold">
                Stop and type
              </button>
            )}
          </div>
        </div>
        <ol className="mt-5 flex-1 space-y-2" aria-live="polite">
          {lines.map((l) => (
            <li key={l.at} className="rounded-2xl bg-white/70 px-4 py-2.5">{l.text}</li>
          ))}
          {interim && <li className="rounded-2xl px-4 py-2.5 text-ink-soft italic">{interim}…</li>}
          {lines.length === 0 && !interim && (
            <li className="text-ink-soft">{mode === "listening" ? "Start talking; what the client says shows up here." : "Type what the client says, one point per line."}</li>
          )}
        </ol>
        {mode === "typing" && (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setLines((l) => [...l, { text: `Client: ${draft.trim()}`, at: Date.now() }]);
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. We rent, it's eighteen hundred a month"
              aria-label="What the client said"
              className="min-w-0 flex-1 rounded-full border border-ink/15 bg-white/80 px-4 py-2.5"
            />
            <button className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white">Add</button>
          </form>
        )}
      </section>

      <aside className="space-y-5">
        <div className="glass glass-frost rounded-3xl p-6 backdrop-blur-xl">
          <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">Likely owed so far {busy && <span className="normal-case">· listening for facts…</span>}</p>
          <p className="font-display text-5xl font-extrabold text-accent tabular-nums">{formatMoney(totals.backPay)}</p>
          <p className="text-ink-soft">plus {formatMoney(totals.annual, "year")}</p>
        </div>

        {next && (
          <div className="glass glass-solid rounded-3xl p-5 backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">Ask next</p>
            <p className="mt-1 text-lg font-semibold">{describeField(next.field).ask}</p>
            {next.atStake > 0 && <p className="mt-1 text-sm text-ink-soft">Could settle up to {formatMoney(next.atStake)}</p>}
          </div>
        )}

        <div className="glass glass-solid rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Facts heard ({heard.length})</p>
            <button
              onClick={save}
              disabled={!heard.length || saved === "saving"}
              className="rounded-full bg-night px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              {saved === "saved" ? "Saved" : saved === "saving" ? "Saving…" : "Save to client"}
            </button>
          </div>
          <ul className="mt-3 space-y-2.5">
            {heard.map((f) => (
              <li key={f.field} className="text-sm">
                <span className="font-semibold">{describeField(f.field).label}:</span> {formatFactValue(f.value)}
                {!f.confirmed && (
                  <span className="ml-2 inline-flex gap-1 align-middle">
                    <button onClick={() => confirm(f.field, true)} className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Confirm</button>
                    <button onClick={() => confirm(f.field, false)} className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] font-semibold">Remove</button>
                  </span>
                )}
                {f.quote && <span className="block text-xs text-ink-soft italic">&ldquo;{f.quote}&rdquo;</span>}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
