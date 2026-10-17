import type { ProgramId } from "@/lib/types";
import type { Stage } from "@/lib/tracker/stages";

export type DashboardApplication = {
  clientId: string;
  program: ProgramId;
  stage: Stage;
  /** Back pay + one year, as estimated when the application was identified. */
  expected: number;
  received?: number | null;
};

export type DashboardSummary = {
  clients: number;
  identified: number;
  submitted: number;
  received: number;
  byStage: Partial<Record<Stage, number>>;
  byProgram: { program: ProgramId; count: number; expected: number; received: number }[];
};

const SUBMITTED: Stage[] = ["submitted", "in_review", "more_info", "approved", "paid"];

/** Funder-style totals: what was found, what went in, and what actually arrived. */
export function summarize(apps: DashboardApplication[]): DashboardSummary {
  const byStage: Partial<Record<Stage, number>> = {};
  const programs = new Map<ProgramId, { count: number; expected: number; received: number }>();
  let identified = 0;
  let submitted = 0;
  let received = 0;

  for (const a of apps) {
    byStage[a.stage] = (byStage[a.stage] ?? 0) + 1;
    if (a.stage !== "denied" && a.stage !== "closed") identified += a.expected;
    if (SUBMITTED.includes(a.stage)) submitted += a.expected;
    received += a.received ?? 0;
    const p = programs.get(a.program) ?? { count: 0, expected: 0, received: 0 };
    p.count += 1;
    p.expected += a.expected;
    p.received += a.received ?? 0;
    programs.set(a.program, p);
  }

  return {
    clients: new Set(apps.map((a) => a.clientId)).size,
    identified: Math.round(identified),
    submitted: Math.round(submitted),
    received: Math.round(received),
    byStage,
    byProgram: [...programs.entries()]
      .map(([program, p]) => ({ program, ...p }))
      .sort((a, b) => b.expected - a.expected),
  };
}
