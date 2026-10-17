import type { ProgramId } from "@/lib/types";
import { claimableYears, dtcCredit } from "./dtc";
import { CANADA_DISABILITY_BENEFIT, CCB, CGEB, CHILD_DISABILITY_BENEFIT, GIS_OAS } from "./params";

/**
 * The most a program could be worth to one person in the first year, including back pay.
 * Used to rank questions while a result is still unknown; never shown as an estimate.
 */
export function maxPotential(program: ProgramId, requestYear: number): number {
  switch (program) {
    case "gis":
      return GIS_OAS.gisSingleMaxMonthly.value * (12 + GIS_OAS.backPayMonths.value);
    case "oas":
      return GIS_OAS.oasMonthly65to74.value * (12 + GIS_OAS.backPayMonths.value);
    case "dtc":
      return claimableYears(requestYear, 0).reduce((t, y) => t + dtcCredit(y, true), 0) + dtcCredit(requestYear, true);
    case "child_disability_benefit":
      return (CHILD_DISABILITY_BENEFIT.annualAmount.value["2026-27"] ?? 0) * (CHILD_DISABILITY_BENEFIT.automaticYears.value + 1);
    case "canada_disability_benefit":
      return (CANADA_DISABILITY_BENEFIT.maxAnnual.value["2026-27"] ?? 0) * 2 + CANADA_DISABILITY_BENEFIT.supplementalOneTime.value;
    case "ccb":
      return CCB.maxUnder6.value;
    case "cgeb":
      return CGEB.perAdult.value + CGEB.singleSupplementMax.value;
    default:
      return 0;
  }
}
