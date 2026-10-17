import { describe, expect, it } from "vitest";
import type { EligibilityResult } from "@/lib/types";
import { onlyRuleNumbers } from "./guard";

const result: EligibilityResult = {
  program: "dtc",
  status: "likely",
  backPayEstimate: 20894,
  annualEstimate: 2292,
  reasons: ["Adam's limitations go back to 2014, so returns from 2016 to 2025 can be adjusted.", "About $1,138.90 a month."],
  assumptions: [],
  missing: [],
  citations: [],
  benefitYear: "2026",
  rulesVersion: "test",
};

describe("onlyRuleNumbers", () => {
  it("accepts amounts and years the rules wrote, in any number format", () => {
    expect(onlyRuleNumbers("You may get about $20,894 back, plus $2,292 a year.", result)).toBe(true);
    expect(onlyRuleNumbers("Vous pourriez recevoir environ 20 894 $ pour les années 2016 à 2025.", result)).toBe(true);
    expect(onlyRuleNumbers("About $1,138 a month.", result)).toBe(true);
  });

  it("rejects a number the rules never produced", () => {
    expect(onlyRuleNumbers("You will get $25,000.", result)).toBe(false);
    expect(onlyRuleNumbers("Vous recevrez 21 000 $.", result)).toBe(false);
    expect(onlyRuleNumbers("This goes back to 2012.", result)).toBe(false);
  });

  it("lets small counts through", () => {
    expect(onlyRuleNumbers("There are 2 forms to sign.", result)).toBe(true);
  });
});
