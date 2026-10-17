"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ClientAvatar } from "@/components/ui/ClientAvatar";

export type Speaker = "staff" | "client";

type More = { above: boolean; below: boolean };
type Jump = (to: "top" | "bottom") => void;

/**
 * Keeps a scrolling list pinned to its newest item as it grows, unless the reader has scrolled up
 * to look at something earlier. Scrolls only the list, never the page. Also reports whether there's
 * more above or below, so the list can show it.
 */
export function useFollowNewest<T extends HTMLElement>(count: number): [RefObject<T | null>, () => void, More, Jump] {
  const ref = useRef<T>(null);
  const following = useRef(true);
  // While our own smooth scroll is animating, its scroll events aren't the reader scrolling away.
  const autoScrollUntil = useRef(0);
  const [more, setMore] = useState<More>({ above: false, below: false });

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const next = { above: el.scrollTop > 8, below: fromBottom > 8 && !following.current };
    setMore((m) => (m.above === next.above && m.below === next.below ? m : next));
  };

  const toBottom = () => {
    const el = ref.current;
    if (!el) return;
    following.current = true;
    autoScrollUntil.current = performance.now() + 800;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (count === 0) following.current = true;
    if (following.current) toBottom();
    measure();
  }, [count]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (performance.now() > autoScrollUntil.current) following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    measure();
  };
  const jump: Jump = (to) => (to === "bottom" ? toBottom() : ref.current?.scrollTo({ top: 0, behavior: "smooth" }));
  return [ref, onScroll, more, jump];
}

/** Fades the edge that has more content past it. */
export const fadeEdges = ({ above, below }: More) => {
  const mask = `linear-gradient(to bottom, ${above ? "transparent" : "black"}, black 2.5rem, black calc(100% - 2.5rem), ${below ? "transparent" : "black"})`;
  return { maskImage: mask, WebkitMaskImage: mask };
};

/** "↑ Earlier" / "↓ Latest" buttons over a scrolling list, shown only when there's more that way. */
export function ScrollCues({ more, jump, newest }: { more: More; jump: Jump; newest: string }) {
  const cue = "pointer-events-auto rounded-full border border-ink/10 bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur hover:bg-white";
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-1">
      <span>{more.above && <button type="button" onClick={() => jump("top")} className={cue}>&uarr; Earlier</button>}</span>
      <span>{more.below && <button type="button" onClick={() => jump("bottom")} className={cue}>&darr; {newest}</button>}</span>
    </div>
  );
}

const AVATAR = 28;

/**
 * One line of the conversation, iMessage style: staff on the left with the Recoup mark, the client on
 * the right with their portrait. Name and picture show once per run of lines from the same person.
 * With `onSwap`, the picture becomes a button that switches who said the line.
 */
export function ChatLine({
  speaker,
  text,
  client,
  firstOfRun,
  lastOfRun,
  interim = false,
  onSwap,
}: {
  speaker: Speaker;
  text: string;
  client: { id: string; name: string };
  firstOfRun: boolean;
  lastOfRun: boolean;
  interim?: boolean;
  onSwap?: () => void;
}) {
  const isClient = speaker === "client";
  const picture = isClient ? (
    <ClientAvatar id={client.id} name={client.name} size={AVATAR} />
  ) : (
    <Image src="/recoup-mark.svg" alt="" width={AVATAR} height={AVATAR} unoptimized className="shrink-0 rounded-full" />
  );
  const who = isClient ? client.name : "Staff";

  return (
    // Each line pops in from its own side as it's said.
    <motion.li
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: isClient ? "bottom right" : "bottom left" }}
      className={`flex items-end gap-2 ${isClient ? "flex-row-reverse" : ""} ${firstOfRun ? "" : "-mt-2"}`}
    >
      <span className="shrink-0" style={{ width: AVATAR }}>
        {lastOfRun &&
          (onSwap ? (
            <button
              type="button"
              onClick={onSwap}
              title={`Said by ${who}. Click to switch.`}
              aria-label={`Said by ${who}. Switch speaker`}
              className="block rounded-full ring-accent-ink transition hover:ring-2 focus-visible:ring-2"
            >
              {picture}
            </button>
          ) : (
            picture
          ))}
      </span>
      <div className={`flex max-w-[80%] flex-col ${isClient ? "items-end" : "items-start"}`}>
        {firstOfRun && <span className="mb-1 px-1 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">{who}</span>}
        <p
          className={`rounded-3xl px-4 py-2.5 ${isClient ? "bg-accent/25" : "bg-white/80"} ${
            lastOfRun ? (isClient ? "rounded-br-md" : "rounded-bl-md") : ""
          } ${interim ? "text-ink-soft italic" : ""}`}
        >
          {text}
          {interim && "…"}
        </p>
      </div>
    </motion.li>
  );
}

/** Whether line i starts / ends a run of lines from the same speaker. */
export const runEdges = (speakers: Speaker[], i: number) => ({
  firstOfRun: i === 0 || speakers[i - 1] !== speakers[i],
  lastOfRun: i === speakers.length - 1 || speakers[i + 1] !== speakers[i],
});
