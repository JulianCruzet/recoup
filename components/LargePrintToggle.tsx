"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "recoup:large-print";

function readSaved(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function save(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    // Storage can be blocked (private mode); the toggle still works for this visit.
  }
}

export function LargePrintToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const saved = readSaved();
    setOn(saved);
    document.documentElement.classList.toggle("large-print", saved);
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    document.documentElement.classList.toggle("large-print", next);
    save(next);
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
