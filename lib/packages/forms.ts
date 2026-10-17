import type { EligibilityResult, Fact, ProgramId } from "@/lib/types";
import { FactBook } from "@/lib/rules/framework";
import { fillT2201, splitAddress, splitName, type T2201Fill } from "./t2201";

// Same shapes as components/forms/RC66's RC66Data and ISP3025's ISP3025Data.
export type RC66Fill = {
  applicant: { firstName: string; lastName: string; dateOfBirth: string; address: string; city: string; province: string; postalCode: string; maritalStatus: string };
  spouse?: { firstName: string; lastName: string; dateOfBirth: string };
  children: { firstName: string; lastName: string; dateOfBirth: string }[];
  residency: string;
};

export type ISP3025Fill = {
  applicant: RC66Fill["applicant"];
  estimatedIncome: number;
  requestRetroactive: boolean;
};

const MARITAL: Record<string, string> = {
  single: "Single",
  married: "Married",
  common_law: "Common-law",
  separated: "Separated",
  divorced: "Divorced",
  widowed: "Widowed",
};

// "other" is left blank on purpose: staff confirm the exact status with the client.
const RESIDENCY: Record<string, string> = { citizen: "Canadian citizen", permanent_resident: "Permanent resident" };

function applicantOf(book: FactBook): RC66Fill["applicant"] {
  const status = book.string("person.maritalStatus");
  return {
    ...splitName(book.string("person.name")),
    dateOfBirth: book.string("person.dateOfBirth") ?? "",
    ...splitAddress(book.string("person.address")),
    maritalStatus: status ? (MARITAL[status] ?? status) : "",
  };
}

/** RC66 for a family not yet getting the Canada Child Benefit. */
export function fillRc66(facts: Fact[]): RC66Fill | null {
  const book = new FactBook(facts);
  const children = book.childIndexes().map((i) => ({
    ...splitName(book.string(`child.${i}.name`)),
    dateOfBirth: book.string(`child.${i}.dateOfBirth`) ?? "",
  }));
  if (children.length === 0) return null;

  const spouseName = book.string("spouse.name");
  const residency = book.string("person.residencyStatus");
  return {
    applicant: applicantOf(book),
    spouse: spouseName ? { ...splitName(spouseName), dateOfBirth: book.string("spouse.dateOfBirth") ?? "" } : undefined,
    children,
    residency: RESIDENCY[residency ?? ""] ?? "",
  };
}

/** ISP-3025 for a senior already on OAS who isn't getting GIS. Asks for the 11 months of back pay. */
export function fillIsp3025(facts: Fact[]): ISP3025Fill | null {
  const book = new FactBook(facts);
  if (book.bool("benefits.receivesOas") !== true) return null;
  return {
    applicant: applicantOf(book),
    estimatedIncome: book.number("money.netIncome") ?? 0,
    requestRetroactive: true,
  };
}

export type Package =
  | { program: ProgramId; kind: "t2201"; data: T2201Fill; steps: string[] }
  | { program: ProgramId; kind: "rc66"; data: RC66Fill; steps: string[] }
  | { program: ProgramId; kind: "isp3025"; data: ISP3025Fill; steps: string[] }
  | { program: ProgramId; kind: "steps"; steps: string[] };

const CLIENT_SIGNS = "Client adds their SIN, signs and dates it. We never fill those in.";

/**
 * What staff hand the client for each program that came back likely or possible: a pre-filled mock form
 * when there is one, otherwise the next steps. Nothing here is sent anywhere.
 */
export function packagesFor(facts: Fact[], results: EligibilityResult[]): Package[] {
  const book = new FactBook(facts);
  const open = results.filter((r) => r.status !== "not_eligible");
  const has = (p: ProgramId) => open.some((r) => r.program === p);
  const out: Package[] = [];
  const yearsMissed = book.number("tax.yearsMissed") ?? 0;

  for (const r of open) {
    switch (r.program) {
      case "dtc": {
        const data = fillT2201(facts);
        if (data) {
          out.push({
            program: "dtc",
            kind: "t2201",
            data,
            steps: [
              CLIENT_SIGNS,
              "Book a visit with the doctor or nurse practitioner and bring the daily-living summary for Part B.",
              "Mail both parts to CRA, or the practitioner can submit Part B online.",
              data.adjustPreviousYears ? "Part A asks CRA to adjust past returns, so back years are paid without refiling." : "",
            ].filter(Boolean),
          });
        }
        break;
      }
      case "ccb": {
        const data = book.bool("benefits.receivesCcb") === true ? null : fillRc66(facts);
        if (data) out.push({ program: "ccb", kind: "rc66", data, steps: [CLIENT_SIGNS, "Fill in each child's place of birth and the date you became their main caregiver.", "Mail to the tax centre on the form, or apply in CRA My Account."] });
        break;
      }
      case "gis": {
        const data = book.bool("benefits.receivesGis") === true ? null : fillIsp3025(facts);
        if (data) {
          out.push({
            program: "gis",
            kind: "isp3025",
            data,
            steps: [CLIENT_SIGNS, "Add bank details for direct deposit.", "Mail to Service Canada. GIS can be paid back up to 11 months, so send it this week."],
          });
        } else {
          out.push({ program: "gis", kind: "steps", steps: ["Apply for OAS and GIS together on form ISP-3550, or by phone with Service Canada."] });
        }
        break;
      }
      case "canada_disability_benefit":
        out.push({ program: r.program, kind: "steps", steps: [has("dtc") ? "Once the DTC is approved, apply online or by phone with Service Canada." : "Apply online or by phone with Service Canada."] });
        break;
      case "child_disability_benefit":
        out.push({ program: r.program, kind: "steps", steps: ["Nothing to sign. It starts with the Canada Child Benefit once the child's DTC is approved, including back years."] });
        break;
      case "cdcp":
        out.push({ program: r.program, kind: "steps", steps: [yearsMissed > 0 ? "File last year's tax return first, then apply online or by phone." : "Apply online or by phone with Service Canada."] });
        break;
      case "ontario_trillium":
        out.push({ program: r.program, kind: "steps", steps: ["Claimed on the tax return with form ON-BEN. Bring rent receipts or the amount of rent paid last year."] });
        break;
      case "oas":
        out.push({ program: r.program, kind: "steps", steps: ["Apply on form ISP-3550, or check whether Service Canada already enrolled them automatically."] });
        break;
      default:
        // cgeb, cwb, ontario_gains, ontario_child_benefit: paid from the tax return.
        out.push({ program: r.program, kind: "steps", steps: [yearsMissed > 0 ? `Paid after filing. File the ${yearsMissed} missed tax ${yearsMissed === 1 ? "return" : "returns"} (free tax clinic).` : "Paid automatically after filing this year's tax return."] });
    }
  }
  return out;
}
