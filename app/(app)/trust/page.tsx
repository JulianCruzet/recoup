import { desc } from "drizzle-orm";
import { connection } from "next/server";
import { Suspense } from "react";
import { SourceLink } from "@/components/ui/SourceLink";
import { getDb, schema } from "@/lib/db";
import { RULES_VERSION } from "@/lib/rules/framework";
import * as P from "@/lib/rules/params";
import type { Param } from "@/lib/types";
import evalResults from "@/eval/results.json";

const PILLARS = [
  { title: "The rules decide", body: "Every eligibility status and every dollar comes from hand-written rules that follow CRA, Service Canada and Ontario's published formulas. Each number carries its benefit year and source." },
  { title: "The AI only listens and explains", body: "Gemini pulls facts out of the conversation (each tied to the words it came from), reads documents, and writes plain-language explanations and draft follow-ups. It never decides eligibility or produces an amount." },
  { title: "A person signs", body: "Staff confirm facts with the client. The client checks and signs every form. Nothing is sent to any government office by the software." },
];

const GUARDRAILS = [
  "No quote, no fact: a fact the AI can't tie to the client's own words (or a document) is thrown away.",
  "Unconfirmed facts count as unknown, so a result can only be \"possible\", never \"likely\", until staff confirm them.",
  "Explanations are checked: if the AI mentions any dollar figure the rules didn't produce, the rule's own wording is shown instead.",
  "No SIN is ever asked for or stored; names, birth dates and addresses are typed by staff, not taken from audio.",
  "Draft follow-ups are never sent without staff approval.",
  "Demo data is synthetic. Fast-forwarded time, texts and \"sent\" follow-ups are simulated and labelled as such.",
];

// Every parameter file, flattened to rows: program, parameter, value, benefit year, source.
const SOURCES: [string, Record<string, Param<unknown>>][] = [
  ["Disability Tax Credit", P.DTC as unknown as Record<string, Param<unknown>>],
  ["Child Disability Benefit", P.CHILD_DISABILITY_BENEFIT as unknown as Record<string, Param<unknown>>],
  ["Canada Disability Benefit", P.CANADA_DISABILITY_BENEFIT as unknown as Record<string, Param<unknown>>],
  ["Guaranteed Income Supplement / OAS", P.GIS_OAS as unknown as Record<string, Param<unknown>>],
  ["Canada Child Benefit", P.CCB as unknown as Record<string, Param<unknown>>],
  ["Groceries and Essentials Benefit", P.CGEB as unknown as Record<string, Param<unknown>>],
  ["Ontario GAINS", P.GAINS as unknown as Record<string, Param<unknown>>],
  ["Ontario Trillium Benefit", P.TRILLIUM as unknown as Record<string, Param<unknown>>],
  ["Canada Workers Benefit", P.CWB as unknown as Record<string, Param<unknown>>],
  ["Canadian Dental Care Plan", P.CDCP as unknown as Record<string, Param<unknown>>],
];

const show = (v: unknown): string =>
  typeof v === "number" ? (Math.abs(v) < 1 ? `${+(v * 100).toFixed(2)}%` : v.toLocaleString("en-CA")) : typeof v === "string" ? v : Array.isArray(v) ? `${v.length} values` : `${Object.keys(v as object).length} values`;

export default function TrustPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">How Recoup decides</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">Rules version {RULES_VERSION}. Estimates follow published formulas and are subject to government assessment.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {PILLARS.map((p) => (
          <section key={p.title} className="glass glass-frost rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="font-display text-xl font-bold">{p.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed">{p.body}</p>
          </section>
        ))}
      </div>

      <section className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
        <h2 className="font-display text-xl font-bold">Guardrails</h2>
        <ul className="mt-3 space-y-2 text-[15px]">
          {GUARDRAILS.map((g) => (
            <li key={g} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />{g}</li>
          ))}
        </ul>
      </section>

      <ListeningScore />

      <section className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
        <h2 className="font-display text-xl font-bold">Every number and where it comes from</h2>
        <div className="relative mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs tracking-wide text-ink-soft uppercase">
              <tr><th className="py-2 font-medium">Program</th><th className="py-2 font-medium">Parameter</th><th className="py-2 font-medium">Value</th><th className="py-2 font-medium">Benefit year</th><th className="py-2 font-medium">Source</th></tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {SOURCES.flatMap(([program, params]) =>
                Object.entries(params).map(([name, p]) => (
                  <tr key={program + name}>
                    <td className="py-2 pr-3">{program}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{name}</td>
                    <td className="py-2 pr-3 tabular-nums">{show(p.value)}</td>
                    <td className="py-2 pr-3 text-ink-soft">{p.benefitYear}</td>
                    <td className="py-2"><SourceLink label={new URL(p.sourceUrl).hostname.replace(/^www\./, "")} url={p.sourceUrl} /></td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Suspense fallback={null}>
        <AuditLog />
      </Suspense>
    </div>
  );
}

/** Fact extraction scored against hand-labelled intakes (eval/run.ts). */
function ListeningScore() {
  const t = evalResults.totals;
  return (
    <section className="glass glass-frost grid gap-6 rounded-3xl p-6 backdrop-blur-xl sm:grid-cols-[auto_1fr] sm:items-center">
      <div>
        <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">Facts heard correctly</p>
        <p className="font-display text-5xl font-extrabold text-accent tabular-nums">
          {t.correct}/{t.expected}
        </p>
      </div>
      <div className="text-[15px]">
        <h2 className="font-display text-xl font-bold">How well the AI listens</h2>
        <p className="mt-1">
          Tested on {t.transcripts} synthetic intakes written and labelled by hand, each with the client correcting
          themselves partway through. {t.wrong} wrong {t.wrong === 1 ? "value" : "values"}, {t.missed} missed. Staff still
          confirm every fact before it counts.
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Run {new Date(evalResults.runAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })} with{" "}
          <code className="font-mono">eval/run.ts</code>.
        </p>
      </div>
    </section>
  );
}

async function AuditLog() {
  await connection();
  const db = await getDb();
  const rows = await db.select().from(schema.audit).orderBy(desc(schema.audit.id)).limit(12);
  return (
    <section className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
      <h2 className="font-display text-xl font-bold">Audit log</h2>
      <p className="text-sm text-ink-soft">Every save, stage change and approval is recorded.</p>
      <ul className="mt-3 divide-y divide-ink/10 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap gap-x-4 py-2">
            <span className="w-44 shrink-0 tabular-nums text-ink-soft">{r.at.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span>
            <span className="font-semibold">{r.actor}</span>
            <span>{r.action}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
