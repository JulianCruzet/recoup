import { describe, expect, it } from "vitest";
import { summarize, type DashboardApplication } from "./dashboard";

const apps: DashboardApplication[] = [
  { clientId: "a", program: "dtc", stage: "paid", expected: 20000, received: 20894 },
  { clientId: "a", program: "child_disability_benefit", stage: "approved", expected: 10213 },
  { clientId: "b", program: "gis", stage: "submitted", expected: 25000 },
  { clientId: "c", program: "ccb", stage: "preparing", expected: 6000 },
  { clientId: "c", program: "cdcp", stage: "denied", expected: 0 },
];

describe("summarize", () => {
  it("adds up identified, submitted and received money", () => {
    const s = summarize(apps);
    expect(s.clients).toBe(3);
    expect(s.identified).toBe(61213);
    expect(s.submitted).toBe(55213);
    expect(s.received).toBe(20894);
  });

  it("counts by stage and sorts programs by value", () => {
    const s = summarize(apps);
    expect(s.byStage).toEqual({ paid: 1, approved: 1, submitted: 1, preparing: 1, denied: 1 });
    expect(s.byProgram[0].program).toBe("gis");
  });

  it("handles no applications", () => {
    expect(summarize([])).toMatchObject({ clients: 0, identified: 0, submitted: 0, received: 0 });
  });
});
