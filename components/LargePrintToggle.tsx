"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "recoup:large-print";
// Remembered for this visit too, so the toggle still works when storage is blocked (private mode).
let current: boolean | null = null;
const listeners = new Set<() => void>();

function readSaved(): boolean {
  if (current !== null) return current;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function save(on: boolean) {
  current = on;
  listeners.forEach((l) => l());
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    // Storage can be blocked (private mode); the toggle still works for this visit.
  }
}

export function LargePrintToggle() {
  // The saved choice, read after hydration (the server always renders normal print).
  const on = useSyncExternalStore(subscribe, readSaved, () => false);

  // Keep the page's class in step with the choice, including the saved one on first load.
  // Only the printout pages carry the toggle, so leaving them goes back to normal size.
  useEffect(() => {
    document.documentElement.classList.toggle("large-print", on);
    return () => document.documentElement.classList.remove("large-print");
  }, [on]);

  function toggle() {
    save(!on);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className="rounded-full border border-ink/20 bg-white/60 px-4 py-2 text-sm font-semibold print:hidden"
    >
      {on ? "Normal print" : "Large print"}
    </button>
  );
}
