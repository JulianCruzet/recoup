import type { ProgramId } from "@/lib/types";
import { STAGES, type Stage } from "./stages";

/**
 * SIMULATED: the demo's two "Fast-forward 8 weeks" clicks. Every application starts in To prepare;
 * each click plays the next leg of a scripted path for its kind of program. Leg one spreads the board
 * out (signed, sent, quick approvals); leg two lands the outcomes: payments, one denial, and a
 * Disability Tax Credit still waiting past CRA's 8 weeks, so the overdue flag and follow-up draft show.
 * Each step is [day of the leg, stage, note]. Steps follow the tracker's allowed moves in order.
 */
type Leg = [day: number, to: Stage, note: string][];

const PATHS: { programs: ProgramId[] | "default"; legs: [Leg, Leg] }[] = [
  {
    // Paid automatically once the return is filed.
    programs: ["cgeb", "ontario_gains", "ccb", "cwb", "oas"],
    legs: [
      [[2, "preparing", "Return prepared with the client"], [4, "ready_to_sign", "Ready to sign"], [6, "signed", "Return signed"], [8, "submitted", "Return filed with CRA"], [40, "approved", "Notice of assessment received"]],
      [[5, "paid", "First payment confirmed by the client"]],
    ],
  },
  {
    programs: ["dtc"],
    legs: [
      [[3, "preparing", "T2201 Part A filled in"], [6, "ready_to_sign", "Doctor's summary printed"], [10, "signed", "Signed; the doctor completed Part B"], [20, "submitted", "Part A and Part B mailed to CRA"], [27, "in_review", "Received by CRA"]],
      [], // No decision yet: past CRA's 8-week standard by the second click.
    ],
  },
  {
    // Can only go in once the Disability Tax Credit is approved.
    programs: ["child_disability_benefit", "canada_disability_benefit"],
    legs: [[[4, "preparing", "Prepared alongside the DTC"], [10, "ready_to_sign", "Ready to sign"], [50, "signed", "Signed; goes in once the DTC is approved"]], []],
  },
  {
    // Applied for online, together at the centre.
    programs: ["cdcp"],
    legs: [
      [[2, "preparing", "Online application started"], [3, "ready_to_sign", "Checked with the client"], [4, "signed", "Client confirmed the answers"], [5, "submitted", "Submitted online with the client"], [12, "in_review", "Received by Service Canada"]],
      [[20, "approved", "Coverage confirmed"]],
    ],
  },
  {
    programs: ["ontario_trillium"],
    legs: [
      [[50, "preparing", "Waiting on rent receipts from the client"]],
      [[3, "ready_to_sign", "Receipts in"], [6, "signed", "Signed"], [8, "submitted", "Filed with the return"], [14, "in_review", "Received by CRA"], [40, "denied", "Not approved: the receipts didn't cover the full year"]],
    ],
  },
  {
    // Mailed by the client: slower to go in, then decided and paid.
    programs: "default",
    legs: [
      [[3, "preparing", "Form filled in"], [8, "ready_to_sign", "Ready for the client to sign"], [52, "signed", "Signed; the client is mailing it"]],
      [[2, "submitted", "Mailed to Service Canada"], [8, "in_review", "Received by Service Canada"], [44, "approved", "Approval letter received"], [51, "paid", "Payment confirmed by the client"]],
    ],
  },
];

const legsFor = (program: ProgramId) => (PATHS.find((p) => p.programs !== "default" && p.programs.includes(program)) ?? PATHS[PATHS.length - 1]).legs;

/**
 * The steps this application takes on the next click, picking up from wherever it is now (staff may
 * have moved it by hand): the rest of leg one while it's short of leg one's end, otherwise the rest of
 * leg two. Final outcomes don't move.
 */
export function nextLeg(program: ProgramId, stage: Stage): Leg {
  if (["denied", "paid", "closed"].includes(stage)) return [];
  const [one, two] = legsFor(program);
  const at = STAGES.indexOf(stage);
  const rest = (leg: Leg) => leg.filter(([, to]) => STAGES.indexOf(to) > at);
  const endOfOne = one.length ? STAGES.indexOf(one[one.length - 1][1]) : -1;
  return at < endOfOne ? rest(one) : rest(two);
}

/** Two clicks of 8 weeks each, then the demo is played out. */
export const DEMO_LEG_DAYS = 56;
export const DEMO_LEGS = 2;
