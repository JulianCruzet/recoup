import { desc } from "drizzle-orm";
import { connection } from "next/server";
import { Fragment, Suspense } from "react";
import { ParamTable, type ParamRow } from "@/components/ParamTable";
import { Icon } from "@/components/ui/Icon";
import { getDb, schema } from "@/lib/db";
import { PROGRAMS } from "@/lib/programs";
import { RULES_VERSION } from "@/lib/rules/framework";
import * as P from "@/lib/rules/params";
import { STAGE_LABEL, type Stage } from "@/lib/tracker/stages";
import type { Param, ProgramId } from "@/lib/types";
import evalResults from "@/eval/results.json";

// At a glance: who does what, then the promises that keep it honest.
const STEPS = [
  { title: "AI listens", body: "Picks out the facts as the client talks.", icon: ["M12 19v3", "M19 10v2a7 7 0 0 1-14 0v-2", "M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"] },
  { title: "Rules decide", body: "Every dollar follows the government's published formula.", icon: ["M12 3v18", "M7 21h10", "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2", "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"] },
  { title: "A person signs", body: "Staff check every fact. The client signs and sends.", icon: ["M12 20h9", "M16.4 3.6a2.1 2.1 0 0 1 3 3L7.4 18.6a2 2 0 0 1-.9.5l-2.9.9.9-2.9a2 2 0 0 1 .5-.9z"] },
];

const PROMISES = ["The AI can't invent a number", "Every fact quotes the client", "Never asks for a SIN", "Nothing is sent without a person"];

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

const PARAM_ROWS: ParamRow[] = SOURCES.flatMap(([program, params]) =>
  Object.entries(params).map(([name, p]) => ({ program, name, value: show(p.value), benefitYear: String(p.benefitYear), sourceUrl: p.sourceUrl })),
);

export default function TrustPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">How Recoup decides</h1>
        <p className="mt-1 text-ink-soft">Rules version {RULES_VERSION}. Estimates follow published formulas and are subject to government assessment.</p>
      </header>

      <section className="glass glass-frost rounded-3xl px-6 py-8 backdrop-blur-xl sm:px-10">
        <ol className="grid items-start gap-8 text-center md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-4">
          {STEPS.map((step, i) => (
            <Fragment key={step.title}>
              {i > 0 && <li aria-hidden className="hidden pt-5 text-3xl text-ink/30 md:block">&rarr;</li>}
              <li>
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/80">
                  <Icon paths={step.icon} className={`size-7 ${i === 0 ? "text-accent-ink" : "text-ink"}`} />
                </span>
                <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight">{step.title}</h2>
                <p className="mx-auto mt-1 max-w-56 text-[15px] text-ink-soft">{step.body}</p>
              </li>
            </Fragment>
          ))}
        </ol>
        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {PROMISES.map((p) => (
            <li key={p} className="flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-sm font-medium">
              <Icon paths={["M20 6 9 17l-5-5"]} className="size-4 text-accent-ink" />
              {p}
            </li>
          ))}
        </ul>
      </section>

      <ListeningScore />

      <section className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
        <h2 className="font-display text-xl font-bold">Every number and where it comes from</h2>
        <ParamTable rows={PARAM_ROWS} />
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
        <p className="font-display text-5xl font-extrabold text-accent-ink tabular-nums">
          {t.correct}/{t.expected}
        </p>
      </div>
      <div className="text-[15px]">
        <h2 className="font-display text-xl font-bold">How well the AI listens</h2>
        <p className="mt-1">
          Tested on {t.transcripts} synthetic intakes written and labelled by hand, each with the client correcting
          themselves partway through. {t.wrong} wrong {t.wrong === 1 ? "value" : "values"}, {t.missed} missed. Facts the AI
          is unsure of wait for staff to confirm them, and staff can remove any fact.
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Run {new Date(evalResults.runAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })} with{" "}
          <code className="font-mono">eval/run.ts</code>.
        </p>
      </div>
    </section>
  );
}

type AuditDetail = { clientId?: string; id?: string; programs?: ProgramId[]; kind?: string; fields?: string[]; from?: Stage; to?: Stage; personas?: number };

async function AuditLog() {
  await connection();
  const db = await getDb();
  const [rows, apps] = await Promise.all([
    db.select().from(schema.audit).orderBy(desc(schema.audit.id)).limit(2),
    db.select({ id: schema.applications.id, clientId: schema.applications.clientId, program: schema.applications.program }).from(schema.applications),
  ]);
  const programName = (id: string) => PROGRAMS[id as ProgramId]?.name ?? id;

  /** One plain sentence per audit entry. This page is public, so it never names a client. */
  const describe = (action: string, d: AuditDetail): string => {
    const app = apps.find((a) => a.id === d.id);
    switch (action) {
      case "seed":
        return `Demo data loaded: ${d.personas ?? 0} clients`;
      case "demo.reset":
        return "Reset the demo applications";
      case "consent.recorded":
        return `Recorded consent for a client (${d.kind === "recording" ? "recording" : "typed notes"})`;
      case "facts.saved":
        return `Saved ${d.fields?.length ?? 0} facts for a client`;
      case "applications.opened":
        return `Started ${d.programs?.length === 1 ? "an application" : `${d.programs?.length ?? 0} applications`} for a client: ${(d.programs ?? []).map(programName).join(", ")}`;
      case "application.moved":
        return `Moved ${app ? `${programName(app.program)} for a client` : "an application"}: ${d.from ? STAGE_LABEL[d.from] : "?"} → ${d.to ? STAGE_LABEL[d.to] : "?"}`;
      case "application.note":
        return `Added a note to ${app ? `${programName(app.program)} for a client` : "an application"}`;
      default:
        return action;
    }
  };

  return (
    <section className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
      <h2 className="font-display text-xl font-bold">Audit log</h2>
      <p className="text-sm text-ink-soft">Every save, consent, stage change and approval is recorded with who did it and when.</p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl bg-white/50 px-4 py-3">
            <p className="text-[15px] font-medium">{describe(r.action, r.detail as AuditDetail)}</p>
            <p className="mt-0.5 text-xs text-ink-soft tabular-nums">
              {`${r.actor === "system" ? "Recoup" : "Staff"} · ${r.at.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
