import type { ProgramId } from "@/lib/types";
import { DECISION_DAYS, DEFAULT_DECISION_DAYS, type Stage } from "./stages";

export type TrackedApplication = {
  id: string;
  program: ProgramId;
  stage: Stage;
  /** ISO date the application was submitted, once it has been. */
  submittedAt?: string;
  /** ISO date of the last stage change. */
  updatedAt: string;
  expected: number;
  received?: number;
};

const DAY = 24 * 60 * 60 * 1000;
const daysBetween = (from: string, to: Date) => Math.floor((to.getTime() - new Date(from).getTime()) / DAY);

export function decisionDays(program: ProgramId): number {
  return DECISION_DAYS[program]?.days ?? DEFAULT_DECISION_DAYS;
}

/** Waiting on the government longer than the program's expected decision time. */
export function isOverdue(app: TrackedApplication, today: Date): boolean {
  if (!app.submittedAt || !["submitted", "in_review"].includes(app.stage)) return false;
  return daysBetween(app.submittedAt, today) > decisionDays(app.program);
}

/** Sitting with staff or the client for more than a week without moving. */
export function isStalled(app: TrackedApplication, today: Date): boolean {
  if (!["identified", "preparing", "ready_to_sign", "more_info"].includes(app.stage)) return false;
  return daysBetween(app.updatedAt, today) > 7;
}

export type SimulatedEvent = { applicationId: string; day: number; to: Stage; note: string };

/**
 * SIMULATED: what would plausibly happen to submitted applications over `days` days, for the demo's
 * "fast-forward" control. Applications are decided at their expected time and paid a week later; the
 * first one in `slowIds` stalls past its deadline so the overdue flag and follow-up draft can be shown.
 */
export function simulateForward(apps: TrackedApplication[], today: Date, days: number, slowIds: string[] = []): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  for (const app of apps) {
    if (!app.submittedAt || !["submitted", "in_review"].includes(app.stage)) continue;
    const age = daysBetween(app.submittedAt, today);
    const decideAt = decisionDays(app.program) - age;
    if (slowIds.includes(app.id)) {
      if (age < 3) events.push({ applicationId: app.id, day: Math.max(1, 3 - age), to: "in_review", note: "Received by the government" });
      continue;
    }
    if (decideAt <= days) {
      events.push({ applicationId: app.id, day: Math.max(1, decideAt), to: "approved", note: "Approval letter (simulated)" });
      if (decideAt + 7 <= days) events.push({ applicationId: app.id, day: decideAt + 7, to: "paid", note: "Payment confirmed by client (simulated)" });
    } else if (age < 3) {
      events.push({ applicationId: app.id, day: Math.max(1, 3 - age), to: "in_review", note: "Received by the government" });
    }
  }
  return events.sort((a, b) => a.day - b.day);
}
