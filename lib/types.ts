// Shared types for intake, eligibility and applications.

/** Programs with a full rules implementation (levels 1 and 2). */
export type ProgramId =
  | "dtc"
  | "child_disability_benefit"
  | "canada_disability_benefit"
  | "ccb"
  | "oas"
  | "gis"
  | "cgeb"
  | "cdcp"
  | "cwb"
  | "ontario_gains"
  | "ontario_trillium"
  | "ontario_child_benefit";

/** Programs we only flag with a referral (no amounts yet). */
export type ReferralProgramId =
  | "odsp"
  | "ontario_works"
  | "cpp_disability"
  | "rdsp"
  | "canada_learning_bond"
  | "oas_allowance"
  | "oesp"
  | "healthy_smiles_ontario"
  | "ontario_seniors_dental";

/** Daily-living categories from form T2201. */
export type DtcCategory =
  | "vision"
  | "speaking"
  | "hearing"
  | "walking"
  | "eliminating"
  | "feeding"
  | "dressing"
  | "mental_functions"
  | "life_sustaining_therapy"
  | "cumulative";

export type MaritalStatus = "single" | "married" | "common_law" | "separated" | "divorced" | "widowed";

/** Every fact the intake can capture. Child facts are indexed: child.0.age, child.1.age, ... */
export type IdentityField =
  | "person.name"
  | "person.dateOfBirth"
  | "person.address"
  | "spouse.name"
  | "spouse.dateOfBirth"
  | `child.${number}.name`
  | `child.${number}.dateOfBirth`;

export type PersonField =
  | "person.age"
  | "person.province"
  | "person.maritalStatus"
  | "person.yearsInCanadaSince18"
  | "person.residencyStatus";

export type MoneyField =
  | "money.netIncome"
  | "money.familyNetIncome"
  | "money.workingIncome"
  | "money.rentPaid"
  | "money.propertyTaxPaid"
  | "money.hasPrivateDental"
  /** Typical yearly income while working, used to check tax payable in back years. */
  | "money.pastAnnualIncome";

export type TaxField = "tax.lastYearFiled" | "tax.yearsMissed";

export type WorkField = "work.stoppedYear";

export type BenefitsField =
  | "benefits.receivesOas"
  | "benefits.receivesGis"
  | "benefits.receivesCcb"
  | "benefits.dtcApproved"
  | "benefits.receivesCdb";

export type LimitationField = `limitation.${DtcCategory}` | "limitation.sinceYear";

export type ChildField =
  | "household.childCount"
  | `child.${number}.age`
  | `child.${number}.isPrimaryCaregiver`
  | `child.${number}.dtcApproved`
  | `child.${number}.limitation.${DtcCategory}`
  | `child.${number}.limitation.sinceYear`;

export type FactField =
  | IdentityField
  | PersonField
  | MoneyField
  | TaxField
  | WorkField
  | BenefitsField
  | LimitationField
  | ChildField;

export type FactValue = string | number | boolean;

export type FactSource = "transcript" | "document" | "staff";

export type Fact = {
  field: FactField;
  value: FactValue;
  source: FactSource;
  /** The exact words (or document text) the fact came from. Required unless staff entered it. */
  quote?: string;
  /** 0..1 from the extractor; staff entries are 1. */
  confidence: number;
  /** Only confirmed facts are used by the rules engine. */
  confirmed: boolean;
};

export type EligibilityStatus = "likely" | "possible" | "not_eligible";

export type Citation = { label: string; url: string };

export type EligibilityResult = {
  program: ProgramId;
  status: EligibilityStatus;
  /** Ongoing yearly amount, in dollars. */
  annualEstimate?: number;
  /** Retroactive amount, in dollars. */
  backPayEstimate?: number;
  reasons: string[];
  assumptions: string[];
  missing: FactField[];
  citations: Citation[];
  benefitYear: string;
  rulesVersion: string;
  /** A date after which some of the money can no longer be claimed. */
  deadline?: { date: string; note: string };
};

export type ReferralFlag = {
  program: ReferralProgramId;
  reason: string;
  referTo: Citation;
};

/** One rule parameter, always with where it came from. */
export type Param<T = number> = {
  value: T;
  benefitYear: string;
  sourceUrl: string;
  note?: string;
};
