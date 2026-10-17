import type { EligibilityResult } from "@/lib/types";
import { PROGRAMS } from "@/lib/programs";
import { formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

const NEXT_STEPS = [
  "We prepare the forms with you. You check them and sign them yourself.",
  "Some forms need a doctor or nurse practitioner; we give you a short summary to bring to the appointment.",
  "You (or a worker you authorize) send the forms. We keep track of each one.",
  "We'll check in with you until the money arrives. Call us if you get a letter from the government.",
];

export function ClientSummary({
  clientName,
  centre,
  results,
  totals,
  preparedOn,
}: {
  clientName: string;
  centre: string;
  results: EligibilityResult[];
  totals: { backPay: number; annual: number };
  preparedOn: string; // e.g. "October 17, 2026"
}) {
  const benefits = results.filter((r) => r.status !== "not_eligible");

  return (
    <article className="mx-auto max-w-[8.5in] bg-white p-10 text-[15px] leading-relaxed text-black print:p-0">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">What you may get</h1>
          <p className="mt-1">
            {`Prepared for ${clientName} at ${centre} on ${preparedOn}`}
          </p>
        </div>
        <p className="font-bold">Recoup</p>
      </header>

      <section className="mt-6 rounded-xl border-2 border-black p-5">
        <p>
          Money you may be able to get back now:{" "}
          <span className="text-3xl font-bold">{formatMoney(totals.backPay)}</span>
        </p>
        <p className="mt-2">Plus about {formatMoney(totals.annual, "year")} going forward.</p>
        <p className="mt-2">These are estimates. The government decides, and amounts can change.</p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">Your benefits</h2>
        <div className="mt-3 space-y-4">
          {benefits.map((result, i) => {
            const program = PROGRAMS[result.program];
            return (
              <div key={result.program}>
                {i > 0 && <hr className="mb-4 border-black/20" />}
                <StatusBadge status={result.status} />
                <h3 className="mt-2 text-lg font-semibold">{program.name}</h3>
                <p>{program.description}</p>
                {result.backPayEstimate ? <p>Back pay: {formatMoney(result.backPayEstimate)}</p> : null}
                {result.annualEstimate ? <p>Yearly: {formatMoney(result.annualEstimate, "year")}</p> : null}
                <p className="mt-1">How it works: {program.howToApply}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">What happens next</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6">
          {NEXT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <footer className="mt-8 text-xs text-black/60">
        Recoup gives information, not legal or tax advice. It never asks for or keeps your SIN, and it never takes a
        share of your money.
      </footer>
    </article>
  );
}
