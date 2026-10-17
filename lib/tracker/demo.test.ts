import { describe, expect, it } from "vitest";
import type { ProgramId } from "@/lib/types";
import { nextLeg } from "./demo";
import { canMove, type Stage } from "./stages";

const PROGRAMS: ProgramId[] = ["dtc", "child_disability_benefit", "canada_disability_benefit", "gis", "oas", "ccb", "cgeb", "cwb", "ontario_gains", "ontario_trillium", "cdcp"];

/** Play one click: every step has to be a move the tracker allows, or moveApplication would skip it. */
function click(program: ProgramId, stage: Stage): Stage {
  let at = stage;
  for (const [, to] of nextLeg(program, at)) {
    expect(canMove(at, to), `${program}: ${at} → ${to}`).toBe(true);
    at = to;
  }
  return at;
}

describe("two-click demo", () => {
  it.each(PROGRAMS)("%s plays through from any To-prepare stage", (program) => {
    for (const start of ["identified", "preparing", "ready_to_sign"] as Stage[]) {
      const afterTwo = click(program, click(program, start));
      expect(click(program, afterTwo), "a third click changes nothing").toBe(afterTwo);
    }
  });

  it("spreads the demo clients across the board, then lands the outcomes", () => {
    expect(click("gis", "preparing")).toBe("signed");
    expect(click("gis", "signed")).toBe("paid");
    expect(click("dtc", "preparing")).toBe("in_review");
    expect(click("dtc", "in_review")).toBe("in_review"); // left waiting, so it shows as overdue
    expect(click("ontario_trillium", "preparing")).toBe("denied");
    expect(click("cgeb", "identified")).toBe("approved");
  });
});
