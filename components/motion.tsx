"use client";

import { animate, MotionConfig, motion, useMotionValue, useReducedMotion, useTransform, type Variants } from "motion/react";
import { useEffect } from "react";
import { formatMoney } from "@/lib/format";

/**
 * Entrance animations for the app's pages: things rise a little and settle as they arrive, lists
 * follow in a quick stagger. With "reduce motion" on, Motion drops the movement and only fades.
 * Glass panes only fade, rise and scale (no blur): a filter on a pane would switch off its
 * backdrop blur while it animates.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** One block that fades up into place. */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}

const list: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE, delayChildren: 0.15, staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/** A list (often a glass pane) that rises into place, then brings its rows in one after another. */
export function RevealList({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.ul className={className} variants={list} initial="hidden" animate="shown" transition={{ delay }}>
        {children}
      </motion.ul>
    </MotionConfig>
  );
}

/** A row inside RevealList. */
export function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.li className={className} variants={item}>
      {children}
    </motion.li>
  );
}

const group: Variants = {
  hidden: {},
  shown: (delay: number = 0.1) => ({ transition: { delayChildren: delay, staggerChildren: 0.08 } }),
};
const rise: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE } },
};

type Tag = "div" | "section" | "ul" | "ol" | "header" | "article" | "p" | "li" | "aside";

/**
 * A group whose StaggerItems rise in one after another. Nested inside a StaggerItem with `nested`, it
 * waits for its parent and then staggers its own children (columns first, then the cards in them).
 */
export function Stagger({ children, className, as = "div", delay = 0.1, nested = false }: { children: React.ReactNode; className?: string; as?: Tag; delay?: number; nested?: boolean }) {
  const Component = motion[as];
  const node = (
    <Component className={className} variants={group} custom={delay} {...(nested ? {} : { initial: "hidden", animate: "shown" })}>
      {children}
    </Component>
  );
  return nested ? node : <MotionConfig reducedMotion="user">{node}</MotionConfig>;
}

/** One thing inside a Stagger: rises a little and settles. */
export function StaggerItem({ children, className, as = "div", style }: { children: React.ReactNode; className?: string; as?: Tag; style?: React.CSSProperties }) {
  const Component = motion[as];
  return (
    <Component className={className} style={style} variants={rise}>
      {children}
    </Component>
  );
}

/**
 * An Applications card. It keeps its identity (layoutId) across columns, so when an application moves
 * stage it slides over to its new column instead of jumping there.
 */
export function MotionCard({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.li layoutId={id} layout variants={rise} transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.7 } }} className={className}>
      {children}
    </motion.li>
  );
}

/** A dollar figure that counts up from $0 when it arrives (or just shows, with "reduce motion" on). */
export function CountUp({ value, delay = 0.2 }: { value: number; delay?: number }) {
  const reduce = useReducedMotion();
  const amount = useMotionValue(reduce ? value : 0);
  const text = useTransform(amount, (v) => formatMoney(Math.round(v)));
  useEffect(() => {
    if (reduce) {
      amount.set(value);
      return;
    }
    const controls = animate(amount, value, { duration: 1.2, ease: EASE, delay });
    return () => controls.stop();
  }, [amount, value, delay, reduce]);
  return <motion.span>{text}</motion.span>;
}

/** A bar that grows in from the left to its width. */
export function GrowBar({ width, className, delay = 0.3 }: { width: string; className?: string; delay?: number }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.span
        className={`origin-left ${className ?? ""}`}
        style={{ width }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay }}
      />
    </MotionConfig>
  );
}

/** A list item that slides in whenever it's added (new facts as they're heard); the others make room smoothly. */
export function PopItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.li className={className} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
      {children}
    </motion.li>
  );
}
