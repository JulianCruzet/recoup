"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CountUp, PopItem, Stagger, StaggerItem } from "@/components/motion";
import { ChatLine, fadeEdges, runEdges, ScrollCues, useFollowNewest, type Speaker } from "@/components/Chat";
import { ConsentPanel } from "@/components/ConsentPanel";
import { describeField, formatFactValue } from "@/lib/fields";
import { formatMoney } from "@/lib/format";
import { evaluate } from "@/lib/rules";
import type { Fact } from "@/lib/types";

type Mode = "consent" | "listening" | "typing";
type Line = { text: string; at: number; speaker: Speaker };

const other = (s: Speaker): Speaker => (s === "staff" ? "client" : "staff");
/** The browser can't tell voices apart, so spoken lines alternate (staff first); staff can switch any line. */
const nextSpeaker = (lines: Line[]): Speaker => (lines.length ? other(lines[lines.length - 1].speaker) : "staff");

// Chrome exposes the Web Speech API under a prefix; it isn't in the TS DOM types.
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void;
  onend: () => void;
  onerror: (e: { error: string }) => void;
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
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const recognition = useRef<Recognition | null>(null);
  const [micOn, setMicOn] = useState(false);
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
    const chunk = lines.slice(from).map((l) => `${l.speaker === "staff" ? "Staff" : "Client"}: ${l.text}`).join("\n");
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
        if (r.isFinal) setLines((l) => [...l, { text: r[0].transcript.trim(), at: Date.now(), speaker: nextSpeaker(l) }]);
        else partial += r[0].transcript;
      }
      setInterim(partial);
    };
    rec.onend = () => recognition.current && rec.start();
    // A denied or missing mic would otherwise restart forever while the screen says "Listening".
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") {
        stop();
        setMode("typing");
      }
    };
    recognition.current = rec;
    rec.start();
    setMicOn(true);
  };

  const stop = () => {
    const rec = recognition.current;
    recognition.current = null;
    rec?.stop();
    setInterim("");
    setMicOn(false);
  };

  useEffect(() => () => stop(), []);

  // Switching who said a line re-sends it (with the line before it) to the extractor.
  const swapSpeaker = (i: number) => {
    sentUpTo.current = Math.max(0, Math.min(sentUpTo.current, i - 1));
    setLines((l) => l.map((line, j) => (j === i ? { ...line, speaker: other(line.speaker) } : line)));
  };

  const [conversationRef, onConversationScroll, conversationMore, jumpConversation] = useFollowNewest<HTMLOListElement>(lines.length + (interim ? 1 : 0));
  const [factsRef, onFactsScroll, factsMore, jumpFacts] = useFollowNewest<HTMLUListElement>(heard.length);
  const client = { id: clientId, name: clientName };

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
    try {
      const res = await fetch(`/api/clients/${clientId}/facts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ facts: heard }) });
      setSaved(res.ok ? "saved" : "error");
    } catch {
      setSaved("error");
    }
  };

  if (mode === "consent") {
    // Start right away: the mic has to open inside the click. The consent row is written alongside it.
    const recordConsent = (kind: "recording" | "notes") =>
      void fetch(`/api/clients/${clientId}/consent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind }) });
    return (
      <StaggerItem>
        <ConsentPanel
          clientName={clientName}
          onRecord={() => {
            recordConsent("recording");
            startListening();
          }}
          onNotes={() => {
            recordConsent("notes");
            setMode("typing");
          }}
        />
      </StaggerItem>
    );
  }

  return (
    <Stagger nested className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <StaggerItem as="section" className="glass glass-solid flex h-[calc(100dvh-13rem)] min-h-[640px] flex-col rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">
            {mode === "listening" ? (
              <span className="inline-flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${micOn ? "animate-pulse bg-accent" : "bg-ink/30"}`} aria-hidden /> {micOn ? "Listening" : "Paused"}
              </span>
            ) : (
              "Notes"
            )}
          </h2>
          <div className="flex flex-wrap justify-end gap-2 whitespace-nowrap">
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
              <>
                <button onClick={() => { stop(); setMode("typing"); }} className="rounded-full border border-ink/20 bg-white/60 px-4 py-2 text-sm font-semibold">
                  Type instead
                </button>
                <button
                  onClick={micOn ? stop : startListening}
                  className="inline-flex items-center gap-2 rounded-full bg-night px-4 py-2 text-sm font-semibold text-white"
                >
                  <span className={`size-2.5 ${micOn ? "rounded-[2px] bg-white" : "rounded-full bg-accent"}`} aria-hidden />
                  {micOn ? "Stop listening" : "Resume listening"}
                </button>
              </>
            )}
          </div>
        </div>
        {mode === "listening" && <p className="mt-1 text-xs text-ink-soft">Lines alternate between staff and the client. Click a picture to switch who said it.</p>}
        <div className="relative mt-2 min-h-0 flex-1">
          <ol ref={conversationRef} onScroll={onConversationScroll} style={fadeEdges(conversationMore)} className="-mr-3 h-full space-y-3 overflow-y-auto py-3 pr-3" aria-live="polite">
            {lines.map((l, i) => (
              <ChatLine key={`${l.at}-${i}`} speaker={l.speaker} text={l.text} client={client} {...runEdges(lines.map((x) => x.speaker), i)} onSwap={() => swapSpeaker(i)} />
            ))}
            {interim && (
              <ChatLine speaker={nextSpeaker(lines)} text={interim} client={client} firstOfRun={!lines.length || lines[lines.length - 1].speaker !== nextSpeaker(lines)} lastOfRun interim />
            )}
            {lines.length === 0 && !interim && (
              <li className="text-ink-soft">{mode === "listening" ? "Start talking; the conversation shows up here." : "Type what the client says, one point per line."}</li>
            )}
          </ol>
          <ScrollCues more={conversationMore} jump={jumpConversation} newest="Latest" />
        </div>
        {mode === "typing" && (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setLines((l) => [...l, { text: draft.trim(), at: Date.now(), speaker: "client" }]);
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
      </StaggerItem>

      <Stagger as="aside" nested className="flex min-h-0 flex-col gap-5 lg:h-[calc(100dvh-13rem)] lg:min-h-[640px]">
        <StaggerItem className="glass glass-frost rounded-3xl p-6 backdrop-blur-xl">
          <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">Likely owed so far {busy && <span className="normal-case">· listening for facts…</span>}</p>
          <p className="font-display text-5xl font-extrabold text-accent-ink tabular-nums">
            <CountUp value={totals.backPay} delay={0} />
          </p>
          <p className="text-ink-soft">plus {formatMoney(totals.annual, "year")}</p>
        </StaggerItem>

        {next && (
          <StaggerItem className="glass glass-solid rounded-3xl p-5 backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-wide text-accent-ink uppercase">Ask next</p>
            <p className="mt-1 text-lg font-semibold">{describeField(next.field).ask}</p>
            {next.atStake > 0 && <p className="mt-1 text-sm text-ink-soft">Could settle up to {formatMoney(next.atStake)}</p>}
          </StaggerItem>
        )}

        <StaggerItem className="glass glass-solid flex min-h-0 flex-1 flex-col rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Facts heard ({heard.length})</p>
            <button
              onClick={save}
              disabled={!heard.length || saved === "saving"}
              className="rounded-full bg-night px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              {saved === "saved" ? "Saved" : saved === "saving" ? "Saving…" : saved === "error" ? "Couldn't save. Try again" : "Save to client"}
            </button>
          </div>
          <div className="relative mt-1 min-h-0 flex-1">
            <ul ref={factsRef} onScroll={onFactsScroll} style={fadeEdges(factsMore)} className="-mr-2 h-full max-h-96 space-y-2.5 overflow-y-auto py-2 pr-2 lg:max-h-none">
              {heard.map((f) => (
                <PopItem key={f.field} className="text-sm">
                  <span className="font-semibold">{describeField(f.field).label}:</span> {formatFactValue(f.value)}
                  {!f.confirmed && (
                    <span className="ml-2 inline-flex gap-1 align-middle">
                      <button onClick={() => confirm(f.field, true)} className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-ink">Confirm</button>
                      <button onClick={() => confirm(f.field, false)} className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] font-semibold">Remove</button>
                    </span>
                  )}
                  {f.quote && <span className="block text-xs text-ink-soft italic">&ldquo;{f.quote}&rdquo;</span>}
                </PopItem>
              ))}
            </ul>
            <ScrollCues more={factsMore} jump={jumpFacts} newest="More" />
          </div>
        </StaggerItem>
      </Stagger>
    </Stagger>
  );
}
