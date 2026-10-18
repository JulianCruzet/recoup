"use client";

import { useState } from "react";
import { LiquidGlass } from "@/components/glass/LiquidGlass";
import { Icon } from "@/components/ui/Icon";

// The public demo's staff account. Everything behind it is synthetic demo data.
const DEMO = [
  { label: "Email", name: "email", value: "demo@hotmail.com" },
  { label: "Password", name: "password", value: "123456" },
] as const;

const COPY = ["M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z", "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"];
const CHECK = ["M20 6 9 17l-5-5"];

/** The demo sign-in, beside the form: copy each value, or fill both fields in one click. */
export function DemoLogin() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(name: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(name);
      setTimeout(() => setCopied((c) => (c === name ? null : c)), 1500);
    } catch {}
  }

  // The form's inputs are uncontrolled (it reads them on submit), so setting their values is enough.
  function fill() {
    for (const { name, value } of DEMO) {
      const input = document.querySelector<HTMLInputElement>(`form input[name="${name}"]`);
      if (input) input.value = value;
    }
    document.querySelector<HTMLButtonElement>('form button[type="submit"]')?.focus();
  }

  return (
    <LiquidGlass as="aside" tint="frost" radius={26} bezel={22} strength={40} className="w-full p-6 sm:p-7 lg:w-80 lg:shrink-0">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-bold tracking-wide text-ink uppercase">
        Demo
      </span>
      <h2 className="font-display mt-3 text-xl font-extrabold tracking-tight">Try it as staff</h2>
      <p className="mt-1 text-sm text-ink-soft">Use this demo account. Every client inside is synthetic.</p>
      <dl className="mt-5 grid gap-3">
        {DEMO.map(({ label, name, value }) => (
          <div key={name}>
            <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{label}</dt>
            <dd className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-white/75 py-2 pr-2 pl-4">
              <span className="font-mono text-[15px]">{value}</span>
              <button
                type="button"
                onClick={() => copy(name, value)}
                aria-label={`Copy demo ${label.toLowerCase()}`}
                className="grid size-8 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <Icon paths={copied === name ? CHECK : COPY} className={`size-4 ${copied === name ? "text-accent-ink" : ""}`} />
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={fill}
        className="mt-5 w-full rounded-full border border-ink/20 bg-white/70 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white"
      >
        Fill in for me
      </button>
    </LiquidGlass>
  );
}
