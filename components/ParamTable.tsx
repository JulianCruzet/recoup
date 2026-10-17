"use client";

import { useState } from "react";
import { SourceLink } from "@/components/ui/SourceLink";

export type ParamRow = { program: string; name: string; value: string; benefitYear: string; sourceUrl: string };

const PAGE_SIZE = 10;

/** Parameter table shown a page at a time, so the card keeps the same height. */
export function ParamTable({ rows }: { rows: ParamRow[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const filler = PAGE_SIZE - visible.length;

  return (
    <>
      <div className="relative mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs tracking-wide text-ink-soft uppercase">
            <tr><th className="py-2 font-medium">Program</th><th className="py-2 font-medium">Parameter</th><th className="py-2 font-medium">Value</th><th className="py-2 font-medium">Benefit year</th><th className="py-2 font-medium">Source</th></tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {visible.map((r) => (
              <tr key={r.program + r.name}>
                <td className="py-2 pr-3">{r.program}</td>
                <td className="py-2 pr-3 font-mono text-xs">{r.name}</td>
                <td className="py-2 pr-3 tabular-nums">{r.value}</td>
                <td className="py-2 pr-3 text-ink-soft">{r.benefitYear}</td>
                <td className="py-2"><SourceLink label={new URL(r.sourceUrl).hostname.replace(/^www\./, "")} url={r.sourceUrl} /></td>
              </tr>
            ))}
            {/* Keep the last page as tall as the others. */}
            {Array.from({ length: filler }, (_, i) => (
              <tr key={`filler-${i}`} aria-hidden className="border-transparent"><td colSpan={5} className="py-2">&nbsp;</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft tabular-nums" aria-live="polite">
          {start + 1}–{start + visible.length} of {rows.length}
        </p>
        <div className="flex gap-2">
          <PageButton label="Previous" disabled={page === 0} onClick={() => setPage(page - 1)} d="M7.5 2.5 4 6l3.5 3.5" />
          <PageButton label="Next" disabled={page === pages - 1} onClick={() => setPage(page + 1)} d="M4.5 2.5 8 6 4.5 9.5" />
        </div>
      </div>
    </>
  );
}

function PageButton({ label, disabled, onClick, d }: { label: string; disabled: boolean; onClick: () => void; d: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label} page`}
      className="grid size-9 place-items-center rounded-full border border-ink/20 bg-white disabled:opacity-35"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
