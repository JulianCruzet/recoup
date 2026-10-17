import { describe, expect, it } from "vitest";
import { canMove } from "./stages";
import { isOverdue, isStalled, simulateForward, type TrackedApplication } from "./timeline";

const today = new Date("2026-10-17T12:00:00");
const app = (over: Partial<TrackedApplication>): TrackedApplication => ({
  id: "a1",
  program: "dtc",
  stage: "submitted",
  submittedAt: "2026-10-17",
  updatedAt: "2026-10-17",
  expected: 1000,
  ...over,
});

describe("stages", () => {
  it("only allows real moves", () => {
    expect(canMove("ready_to_sign", "signed")).toBe(true);
    expect(canMove("identified", "paid")).toBe(false);
    expect(canMove("approved", "paid")).toBe(true);
  });
});

describe("flags", () => {
  it("is overdue past the program's decision time", () => {
    expect(isOverdue(app({ submittedAt: "2026-08-01" }), today)).toBe(true);
    expect(isOverdue(app({ submittedAt: "2026-10-01" }), today)).toBe(false);
    expect(isOverdue(app({ submittedAt: "2026-08-01", stage: "approved" }), today)).toBe(false);
  });

  it("is stalled after a week without moving", () => {
    expect(isStalled(app({ stage: "ready_to_sign", updatedAt: "2026-10-01" }), today)).toBe(true);
    expect(isStalled(app({ stage: "ready_to_sign", updatedAt: "2026-10-14" }), today)).toBe(false);
  });
});

describe("simulateForward (demo)", () => {
  it("decides at the expected time and pays a week later", () => {
    const events = simulateForward([app({ program: "canada_disability_benefit" })], today, 60);
    expect(events.map((e) => [e.day, e.to])).toEqual([
      [28, "approved"],
      [35, "paid"],
    ]);
  });

  it("lets a slow application stall so the overdue flag shows", () => {
    const events = simulateForward([app({ id: "slow" })], today, 60, ["slow"]);
    expect(events.map((e) => e.to)).toEqual(["in_review"]);
  });
});
