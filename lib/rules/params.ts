// Typed access to the parameter files. Every value carries its benefit year and source.
import type { Param } from "@/lib/types";
import ccbJson from "./params/ccb.json";
import cdbJson from "./params/canada-disability-benefit.json";
import cdcpJson from "./params/cdcp.json";
import cgebJson from "./params/cgeb.json";
import childCdbJson from "./params/child-disability-benefit.json";
import cwbJson from "./params/cwb.json";
import dtcJson from "./params/dtc.json";
import gainsJson from "./params/ontario-gains.json";
import gisOasJson from "./params/gis-oas.json";
import oasHistoryJson from "./params/oas-history.json";
import trilliumJson from "./params/ontario-trillium.json";

type ByKey<T = number> = Param<Record<string, T>>;

export const DTC = dtcJson as {
  creditRate: ByKey;
  baseAmount: ByKey;
  childSupplement: ByKey;
  careThreshold: ByKey;
  lookbackYears: Param;
};

export const CHILD_DISABILITY_BENEFIT = childCdbJson as {
  annualAmount: ByKey;
  reductionThreshold: ByKey;
  reductionRate: Param<{ oneChild: number; twoOrMore: number }>;
  automaticYears: Param;
};

export const CCB = ccbJson as {
  maxUnder6: Param;
  max6to17: Param;
  threshold1: Param;
  threshold2: Param;
  ratesBetween: Param<number[]>;
  baseAbove: Param<number[]>;
  ratesAbove: Param<number[]>;
};

export const GIS_OAS = gisOasJson as {
  oasMonthly65to74: Param;
  oasMonthly75plus: Param;
  gisSingleMaxMonthly: Param;
  gisSingleTopUpMonthly: Param;
  gisSingleIncomeCutoff: Param;
  topUpExemption: Param;
  earningsExemption: Param<{ full: number; halfOfNext: number }>;
  backPayMonths: Param;
  pastQuarterMax: ByKey;
  gisCoupleMaxMonthly: Param;
  gisCoupleTopUpMonthly: Param;
  gisCoupleIncomeCutoff: Param;
  coupleTopUpExemption: Param;
  pastQuarterMaxCouple: ByKey;
};

export const OAS_HISTORY = oasHistoryJson as {
  oasPaidAge65to74: ByKey;
  fullResidenceYears: Param;
  minimumResidenceYears: Param;
};

export const CGEB = cgebJson as {
  perAdult: Param;
  perChild: Param;
  singleSupplementMax: Param;
  singleSupplementRate: Param;
  singleSupplementStart: Param;
  reductionRate: Param;
  reductionThreshold: Param;
};

export const GAINS = gainsJson as {
  maxMonthlySingle: Param;
  maxMonthlyCouple: Param;
  reductionPer24: Param;
  incomeLimitSingle: Param;
};

export const TRILLIUM = trilliumJson as {
  occupancyRentShare: Param;
  energyMax: Param;
  seniorPropertyBase: Param;
  seniorPropertyExtraMax: Param;
  propertyBase: Param;
  propertyExtraMax: Param;
  oeptcReductionRate: Param;
  thresholdSingleNoKids: Param;
  thresholdOther: Param;
  salesTaxPerPerson: Param;
  salesTaxReductionRate: Param;
};

export const CANADA_DISABILITY_BENEFIT = cdbJson as {
  maxAnnual: ByKey;
  workingIncomeExemption: Param<{ single: number; couple: number }>;
  incomeThreshold: Param<{ single: number; couple: number }>;
  reductionRate: Param<{ single: number; bothBeneficiaries: number }>;
  backPayMaxMonths: Param;
  firstPaidMonth: Param<string>;
  supplementalOneTime: Param;
};

export const CWB = cwbJson as Record<string, Param>;

export const CDCP = cdcpJson as {
  incomeLimit: Param;
  coPayBrackets: Param<{ below: number; rate: number }[]>;
};
