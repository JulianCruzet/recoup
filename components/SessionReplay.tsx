"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatLine, fadeEdges, runEdges, ScrollCues, useFollowNewest } from "@/components/Chat";
import { describeField, formatFactValue } from "@/lib/fields";
import { evaluate } from "@/lib/rules";
import type { Fact } from "@/lib/types";

export type Turn = { speaker: "staff" | "client"; text: string };

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const money = (n: number) => `$${Math.round(n).toLocaleString("en-CA")}`;

/**
 * Plays a scripted intake line by line. A fact appears once the line containing its quote has been
 * spoken; staff-entered facts (names, address) are there from the start. Totals and the next question
 * come from the same rules engine as the results page, recomputed after every line.
 */
export function SessionReplay({ turns, facts, clientId, clientName }: { turns: Turn[]; facts: Fact[]; clientId: string; clientName: string }) {
  const [played, setPlayed] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || played >= turns.length) return;
    const t = setTimeout(() => setPlayed((n) => n + 1), played === 0 ? 400 : 2200);
    return () => clearTimeout(t);
  }, [playing, played, turns.length]);

  const heard = useMemo(() => normalize(turns.slice(0, played).map((t) => t.text).join(" ")), [turns, played]);
  const known = useMemo(
    () => facts.filter((f) => f.source === "staff" || (f.quote !== undefined && heard.includes(normalize(f.quote)))),
    [facts, heard],
  );
  const { totals, askNext } = useMemo(() => evaluate(known), [known]);
  const nextQuestion = askNext.find((q) => !q.field.startsWith("person.name"));
  // In the order they were said, so a new fact always lands at the bottom of the list.
  const saidAt = (f: Fact) => turns.findIndex((t) => f.quote !== undefined && normalize(t.text).includes(normalize(f.quote)));
  const spoken = known.filter((f) => f.source !== "staff").sort((a, b) => saidAt(a) - saidAt(b));
  const [conversationRef, onConversationScroll, conversationMore, jumpConversation] = useFollowNewest<HTMLOListElement>(played);
  const [factsRef, onFactsScroll, factsMore, jumpFacts] = useFollowNewest<HTMLUListElement>(spoken.length);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <section className="glass glass-solid flex h-[calc(100dvh-13rem)] min-h-[640px] flex-col rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Conversation with {clientName}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="rounded-full bg-night px-4 py-2 text-sm font-semibold text-white"
            >
              {playing && played < turns.length ? "Pause" : played >= turns.length ? "Done" : played ? "Resume" : "Play intake"}
            </button>
            <button onClick={() => { setPlayed(0); setPlaying(false); }} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold">
              Restart
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-soft">Scripted replay of a recorded intake (demo).</p>
        <div className="relative mt-2 min-h-0 flex-1">
          <ol ref={conversationRef} onScroll={onConversationScroll} style={fadeEdges(conversationMore)} className="-mr-3 h-full space-y-3 overflow-y-auto py-3 pr-3" aria-live="polite">
            {turns.slice(0, played).map((t, i, shown) => (
              <ChatLine key={i} speaker={t.speaker} text={t.text} client={{ id: clientId, name: clientName }} {...runEdges(shown.map((x) => x.speaker), i)} />
            ))}
            {played === 0 && <li className="text-ink-soft">Press play to start the intake.</li>}
          </ol>
          <ScrollCues more={conversationMore} jump={jumpConversation} newest="Latest" />
        </div>
      </section>

      <aside className="flex min-h-0 flex-col gap-5 lg:h-[calc(100dvh-13rem)] lg:min-h-[640px]">
        <div className="glass glass-frost rounded-3xl p-6 backdrop-blur-xl">
          <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">Likely owed so far</p>
          <p className="font-display text-5xl font-extrabold text-accent-ink tabular-nums transition-all">{money(totals.backPay)}</p>
          <p className="text-ink-soft">plus {money(totals.annual)} a year</p>
        </div>

        {nextQuestion && played < turns.length && (
          <div className="glass glass-solid rounded-3xl p-5 backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-wide text-accent-ink uppercase">Ask next</p>
            <p className="mt-1 text-lg font-semibold">{describeField(nextQuestion.field).ask}</p>
            {nextQuestion.atStake > 0 && <p className="mt-1 text-sm text-ink-soft">Could settle up to {money(nextQuestion.atStake)}</p>}
          </div>
        )}

        <div className="glass glass-solid flex min-h-0 flex-1 flex-col rounded-3xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Facts heard ({spoken.length})</p>
          <div className="relative mt-1 min-h-0 flex-1">
            <ul ref={factsRef} onScroll={onFactsScroll} style={fadeEdges(factsMore)} className="-mr-2 h-full max-h-96 space-y-2.5 overflow-y-auto py-2 pr-2 lg:max-h-none">
              {spoken.map((f) => (
                <li key={f.field} className="text-sm">
                  <span className="font-semibold">{describeField(f.field).label}:</span> {formatFactValue(f.value)}
                  <span className="block text-xs text-ink-soft italic">&ldquo;{f.quote}&rdquo;</span>
                </li>
              ))}
              {spoken.length === 0 && <li className="text-sm text-ink-soft">Facts appear here as the client talks, each with the words it came from.</li>}
            </ul>
            <ScrollCues more={factsMore} jump={jumpFacts} newest="More" />
          </div>
        </div>
      </aside>
    </div>
  );
}
