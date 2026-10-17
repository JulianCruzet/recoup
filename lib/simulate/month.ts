import type { Fact, ProgramId } from "@/lib/types";
import { packagesFor } from "@/lib/packages/forms";
import { evaluate } from "@/lib/rules";

export type SimClient = { id: string; name: string; facts: Fact[] };

export type MonthSummary = {
  clients: number;
  /** Clients with at least one likely program that pays money. */
  withLikely: number;
  /** Clients likely covered by the Canadian Dental Care Plan (coverage, not cash). */
  dentalCoverage: number;
  likely: { backPay: number; annual: number };
  /** Worth checking: programs that came back possible because a fact is missing. */
  possible: { backPay: number; annual: number };
  formsPrepared: number;
  doctorBriefs: number;
  /** Clients with money that expires at the end of the year if nobody acts. */
  withDeadline: number;
  referrals: number;
  byProgram: { program: ProgramId; clients: number; backPay: number; annual: number }[];
};

/**
 * SIMULATED: one month of intakes at a single centre. Each client goes through the same rules engine and
 * package builder as a real intake; nothing is written to the database.
 */
export function runMonth(clients: SimClient[], asOf?: Parameters<typeof evaluate>[1]): MonthSummary {
  const summary: MonthSummary = {
    clients: clients.length,
    withLikely: 0,
    dentalCoverage: 0,
    likely: { backPay: 0, annual: 0 },
    possible: { backPay: 0, annual: 0 },
    formsPrepared: 0,
    doctorBriefs: 0,
    withDeadline: 0,
    referrals: 0,
    byProgram: [],
  };
  const programs = new Map<ProgramId, { clients: number; backPay: number; annual: number }>();

  for (const client of clients) {
    const { results, referrals } = evaluate(client.facts, asOf);
    const likely = results.filter((r) => r.status === "likely");
    if (likely.some((r) => (r.backPayEstimate ?? 0) + (r.annualEstimate ?? 0) > 0)) summary.withLikely += 1;
    if (likely.some((r) => r.program === "cdcp")) summary.dentalCoverage += 1;
    if (results.some((r) => r.status !== "not_eligible" && r.deadline)) summary.withDeadline += 1;
    summary.referrals += referrals.length;

    for (const r of results) {
      if (r.status === "not_eligible") continue;
      const bucket = r.status === "likely" ? summary.likely : summary.possible;
      bucket.backPay += r.backPayEstimate ?? 0;
      bucket.annual += r.annualEstimate ?? 0;
      if (r.status !== "likely" || r.program === "cdcp") continue;
      const p = programs.get(r.program) ?? { clients: 0, backPay: 0, annual: 0 };
      p.clients += 1;
      p.backPay += r.backPayEstimate ?? 0;
      p.annual += r.annualEstimate ?? 0;
      programs.set(r.program, p);
    }

    const packages = packagesFor(client.facts, results);
    summary.formsPrepared += packages.filter((p) => p.kind !== "steps").length;
    summary.doctorBriefs += packages.filter((p) => p.kind === "t2201").length;
  }

  summary.byProgram = [...programs.entries()]
    .map(([program, p]) => ({ program, ...p }))
    .sort((a, b) => b.backPay + b.annual - (a.backPay + a.annual));
  for (const bucket of [summary.likely, summary.possible]) {
    bucket.backPay = Math.round(bucket.backPay);
    bucket.annual = Math.round(bucket.annual);
  }
  return summary;
}
