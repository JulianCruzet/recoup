"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white">
      {label}
    </button>
  );
}
