"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatMoney } from "@/lib/format";

type Step = { title: string; text: string; icon: string[] };
/** Real results from the rules engine, so the scenes' numbers move if the rules do. */
export type Sample = {
  dtc: { name: string; backPay: number };
  paid: { clientName: string; program: string; amount: number };
};

// How much scrolling each step takes while the section is pinned, as a fraction of the screen height.
const SCROLL_PER_STEP = 0.75;

/**
 * How it works, told through the people in it: a hand-drawn scene for each step (the same Notionists
 * style as the client portraits).
 *
 * On wide screens the section pins: once it fills the screen it holds still, and scrolling plays the
 * four steps instead of moving the page; after the last one the page carries on. It's the usual
 * "sticky" technique (the section is taller than the screen and its content stays put), not a scroll
 * lock, so wheels, trackpads, keyboards and screen readers all keep working. Phones get the steps
 * stacked, each with its scene underneath.
 */
export function HowItWorks({ steps, sample }: { steps: Step[]; sample: Sample }) {
  const scenes = [<Listen key="listen" />, <Decide key="decide" sample={sample} />, <Prepare key="prepare" />, <Follow key="follow" sample={sample} />];
  return (
    <>
      <Pinned steps={steps} scenes={scenes} />
      <Stacked steps={steps} scenes={scenes} />
    </>
  );
}

function Pinned({ steps, scenes }: { steps: Step[]; scenes: React.ReactNode[] }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      // 0 when the section reaches the top of the screen, 1 when it's about to let go.
      const travel = el.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / travel));
      setActive(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [steps.length]);

  /** Clicking a step scrolls to the middle of its stretch. */
  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY + ((i + 0.5) / steps.length) * travel;
    window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const last = active === steps.length - 1;
  return (
    <section
      ref={ref}
      aria-labelledby="how-title"
      // Its own warm sheet, edge to edge, sliding over the sage one like the sage slides over the photo.
      className="relative -mx-4 mt-16 hidden rounded-[2.5rem] bg-cream sm:-mx-6 lg:block"
      style={{ height: `${100 + (steps.length - 1) * SCROLL_PER_STEP * 100}vh` }}
    >
      {/* Room at the top for the floating nav. */}
      <div className="sticky top-0 flex h-screen items-center pt-16">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,26rem)_1fr] items-center gap-20">
          {/* All four scenes stacked in one place; only the active one shows, so nothing jumps. */}
          <div className="relative aspect-[1/0.95]">
            {scenes.map((scene, i) => (
              <div
                key={i}
                aria-hidden={i !== active}
                className={`absolute inset-0 transition duration-500 ease-out motion-reduce:transition-none ${
                  i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
                }`}
              >
                {scene}
              </div>
            ))}
          </div>

          <div>
            <h2 id="how-title" className="font-display text-4xl font-extrabold tracking-tight">
              How it works
            </h2>
            <ol className="mt-8">
              {steps.map((step, i) => (
                <li key={step.title} aria-current={i === active ? "step" : undefined} className="relative">
                  {i < steps.length - 1 && <span aria-hidden className="absolute top-14 -bottom-1 left-6 border-l-2 border-dashed border-ink/25" />}
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    className={`grid w-full grid-cols-[3rem_1fr] gap-5 pb-7 text-left transition-opacity duration-300 ${i === active ? "" : "opacity-40 hover:opacity-70"}`}
                  >
                    <StepIcon step={step} active={i === active} />
                    <span className="pt-2.5">
                      <span className="font-display block text-xl font-bold">{step.title}</span>
                      <span className="mt-1 block text-ink-soft">{step.text}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            {/* Where you are, and a nudge to keep going until the last step. */}
            <div className="mt-2 flex items-center gap-4 pl-1">
              <span className="flex gap-1.5" aria-hidden>
                {steps.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-accent" : "w-1.5 bg-ink/20"}`} />
                ))}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-opacity duration-300 ${last ? "opacity-0" : "opacity-100"}`}>
                Scroll to continue
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4 animate-bounce motion-reduce:animate-none">
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stacked({ steps, scenes }: { steps: Step[]; scenes: React.ReactNode[] }) {
  return (
    <section aria-label="How it works" className="-mx-4 mt-16 rounded-[2rem] bg-cream px-4 py-12 sm:-mx-6 sm:px-6 lg:hidden">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">How it works</h2>
        <ol className="mt-8 space-y-10">
          {steps.map((step, i) => (
            <li key={step.title}>
              <div className="grid grid-cols-[3rem_1fr] gap-5">
                <StepIcon step={step} active={false} />
                <div className="pt-2.5">
                  <h3 className="font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-1 text-ink-soft">{step.text}</p>
                </div>
              </div>
              <div className="mx-auto mt-2 aspect-[1/0.95] w-full max-w-[26rem]">{scenes[i]}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StepIcon({ step, active }: { step: Step; active: boolean }) {
  return (
    <span
      className={`grid size-12 place-items-center rounded-full border bg-white shadow-[0_8px_20px_-12px_rgb(29_31_33/0.45)] transition-colors ${
        active ? "border-accent ring-4 ring-accent/25" : "border-ink/15"
      }`}
    >
      <Icon paths={step.icon} className="size-6 text-accent-ink" />
    </span>
  );
}

/* ---------- Scenes ----------
 * Each scene is a fixed-ratio stage, laid out in percentages so it scales down to a phone. People are
 * busts, so they sit behind a desk line that hides where the drawing stops; each stands in front of a
 * soft circle in their portrait colour. Drawings: DiceBear "Notionists" by Zoish, CC0 (public/people).
 */

const TINT = { staff: "#fbe7c1", sana: "#f6dfc9", doctor: "#d8e3ee", mrsK: "#dfe7d8" };

function Stage({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} className="relative h-full w-full select-none">
      {children}
      {/* The desk: the busts stop here. */}
      <span aria-hidden className="absolute inset-x-[3%] bottom-[18%] h-[3px] rounded-full bg-ink" />
    </div>
  );
}

/** One person: a tinted circle with the drawing standing in front of it, feet hidden by the desk. */
function Person({ src, tint, left, width = 46, flip = false }: { src: string; tint: string; left: number; width?: number; flip?: boolean }) {
  return (
    <div aria-hidden className="absolute bottom-[18%]" style={{ left: `${left}%`, width: `${width}%` }}>
      <span className="absolute inset-x-[10%] bottom-[8%] aspect-square rounded-full" style={{ background: tint }} />
      <Image src={src} alt="" width={240} height={240} unoptimized className={`relative h-auto w-full ${flip ? "-scale-x-100" : ""}`} />
    </div>
  );
}

/** A speech or text bubble in the same hand-drawn line as the people. */
function Bubble({ children, className, tail, dark = false }: { children: React.ReactNode; className: string; tail: "left" | "right"; dark?: boolean }) {
  return (
    <p
      className={`absolute rounded-2xl border-2 border-ink px-3 py-2 text-[13px] leading-snug sm:text-sm ${dark ? "bg-night text-white" : "bg-white"} ${
        tail === "left" ? "rounded-bl-sm" : "rounded-br-sm"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/** A slip of paper, like the receipt at the top of the page. */
function Slip({ children, className }: { children: React.ReactNode; className: string }) {
  return <div className={`absolute border border-ink/20 bg-white p-3 text-[12px] shadow-[0_14px_30px_-18px_rgb(29_31_33/0.55)] sm:text-[13px] ${className}`}>{children}</div>;
}

/** Under the desk: one line saying what Recoup did in this moment. */
function Caption({ children }: { children: React.ReactNode }) {
  return <p className="absolute inset-x-0 bottom-[3%] text-center text-[13px] text-ink-soft sm:text-sm">{children}</p>;
}

function Listen() {
  return (
    <Stage label="A staff member listens while Sana describes how her son Adam is doing.">
      <span className="absolute top-[2%] left-[3%] inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-2.5 py-1 text-xs font-semibold">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" /> Listening, with consent
      </span>
      <Person src="/people/staff-listen.svg" tint={TINT.staff} left={1} flip />
      <Person src="/people/sana-talk.svg" tint={TINT.sana} left={53} />
      <Bubble tail="right" className="top-[13%] right-[4%] w-[52%]">
        &ldquo;He has autism, and he needs a lot of help with routines.&rdquo;
      </Bubble>
      <Caption>Noted, with her words: limits in thinking and behaviour ✓</Caption>
    </Stage>
  );
}

function Decide({ sample }: { sample: Sample }) {
  return (
    <Stage label="The staff member points to the result: the rules say Sana's family is likely owed the Disability Tax Credit.">
      <Person src="/people/staff-point.svg" tint={TINT.staff} left={2} width={50} />
      <Slip className="top-[6%] right-[3%] w-[50%] rotate-[3deg]">
        <p className="text-[10px] font-semibold tracking-wide text-ink-soft uppercase">Likely</p>
        <p className="font-display font-bold">{sample.dtc.name}</p>
        <p className="mt-2 flex items-baseline gap-1.5 border-t border-dashed border-ink/30 pt-2 whitespace-nowrap">
          Back pay <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-ink/40" />
          <span className="font-display text-lg font-extrabold text-accent-ink">{formatMoney(sample.dtc.backPay)}</span>
        </p>
        <p className="mt-2 text-[11px] font-semibold whitespace-nowrap">Rules decide, not the AI</p>
      </Slip>
      <Caption>Every dollar comes with its rule and source</Caption>
    </Stage>
  );
}

function Prepare() {
  return (
    <Stage label="Sana brings a ready-made summary of Adam's daily life to the doctor, who approves.">
      <Person src="/people/sana-hand.svg" tint={TINT.sana} left={0} flip />
      <Person src="/people/doctor-ok.svg" tint={TINT.doctor} left={54} />
      <Slip className="bottom-[13%] left-[31%] z-10 w-[38%] -rotate-[4deg]">
        <p className="font-semibold">Daily-living summary</p>
        <p className="text-[10px] text-ink-soft">For the doctor, Part B</p>
        <span aria-hidden className="mt-1.5 block h-1 w-[90%] rounded bg-ink/15" />
        <span aria-hidden className="mt-1 block h-1 w-[75%] rounded bg-ink/15" />
        <span aria-hidden className="mt-1 block h-1 w-[82%] rounded bg-ink/15" />
      </Slip>
      <Caption>Forms pre-filled; her SIN and signature stay with her</Caption>
    </Stage>
  );
}

function Follow({ sample }: { sample: Sample }) {
  return (
    <Stage label={`Mrs. K. gets a text asking if her payment arrived, and replies yes: ${formatMoney(sample.paid.amount)} paid.`}>
      <Person src="/people/mrsk-phone.svg" tint={TINT.mrsK} left={1} width={50} />
      <Bubble tail="left" className="top-[6%] right-[3%] w-[48%]">
        Hi Mrs. K., it&rsquo;s the centre. Did your payment arrive?
      </Bubble>
      <Bubble tail="right" className="top-[30%] right-[3%] w-[40%] !bg-accent">
        YES, it came today!
      </Bubble>
      <span className="absolute top-[50%] right-[3%] inline-flex items-center gap-1.5 rounded-full bg-approved-soft px-3 py-1 text-xs font-semibold">
        <span aria-hidden className="size-1.5 rounded-full bg-approved" /> Paid · {formatMoney(sample.paid.amount)}
      </span>
      <Caption>Followed until the money lands</Caption>
    </Stage>
  );
}
