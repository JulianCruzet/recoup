import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Icon } from "@/components/ui/Icon";
import { formatMoney } from "@/lib/format";
import { PROGRAMS } from "@/lib/programs";
import { evaluate } from "@/lib/rules";
import { runMonth, type SimClient } from "@/lib/simulate/month";
import clients from "@/seed/clients.json";
import personas from "@/seed/personas.json";
import type { Fact } from "@/lib/types";

const month = runMonth(clients as unknown as SimClient[]);

// The receipt is the real result for the demo family, not copy: it moves if the rules do.
const family = evaluate((personas as { id: string; facts: Fact[] }[]).find((p) => p.id === "s-family")!.facts);
const LINES = family.results.filter((r) => r.status === "likely" && (r.backPayEstimate ?? 0) > 0);

const DAC_2024 = "https://www.canada.ca/en/revenue-agency/corporate/about-canada-revenue-agency-cra/disability-advisory-committee/2024-full-report.html";

const FACTS = [
  { stat: "1 in 4", text: "people likely eligible for the Disability Tax Credit complete an application.", source: "CRA Disability Advisory Committee, 2024", url: DAC_2024 },
  { stat: "17%", text: "of people who start the DTC online get the doctor's part done. 96.6% of completed applications are approved.", source: "DAC, 2024", url: DAC_2024 },
  {
    stat: "15 weeks",
    text: "is how long a DTC decision can take, against an 8-week standard. Then nobody owns the follow-up.",
    source: "Taxpayers' Ombudsperson, 2025",
    url: "https://www.canada.ca/en/taxpayers-ombudsperson/news/2025/12/taxpayers-ombudsperson-calls-for-improvements-at-the-canada-revenue-agency-to-address-delays-impacting-persons-with-disabilities.html",
  },
];

// Same line icons as the trust page: a microphone, the scales, a form, money arriving.
const STEPS = [
  {
    title: "Listen",
    text: "With the client's consent, Recoup follows the intake conversation and pulls out facts, each with the words it came from.",
    icon: ["M12 19v3", "M19 10v2a7 7 0 0 1-14 0v-2", "M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"],
  },
  {
    title: "Decide",
    text: "A rules engine, not the AI, checks federal and Ontario programs and shows the rule and source behind every dollar.",
    icon: ["M12 3v18", "M7 21h10", "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2", "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"],
  },
  {
    title: "Prepare",
    text: "Forms come pre-filled and a summary for the doctor is ready. SIN, bank details and signatures stay with the client.",
    icon: ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4", "M10 9H8", "M16 13H8", "M16 17H8"],
  },
  {
    title: "Follow",
    text: "Each application is tracked until the money lands, with follow-ups drafted for staff when a decision runs late.",
    icon: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z", "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8", "M12 18V6"],
  },
];

export default function Landing() {
  return (
    <main className="text-ink">
      <div className="flex min-h-[80dvh] flex-col px-4 pt-4 sm:px-6">
        <AppNav />
        <section className="mx-auto my-auto w-full max-w-6xl pt-10 pb-16">
          <h1 className="font-display max-w-4xl text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-7xl">
            Get people the money they&rsquo;re already owed.
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-ink-soft">
            Finds what a client is likely owed, with the rule behind every dollar. Prepares the forms. Follows each one
            until it&rsquo;s paid.
          </p>
          <Link href="/clients" className="mt-7 inline-block rounded-lg bg-night px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5">
            See how it works
          </Link>
        </section>
      </div>

      <div className="rounded-t-[2.5rem] bg-sheet px-4 pt-14 pb-10 shadow-[0_-30px_60px_-30px_rgb(29_31_33/0.35)] sm:px-6 sm:pt-20">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20">
          <section aria-labelledby="receipt-title" className="lg:-mt-40">
            <div className="rotate-[-0.8deg] border border-ink/15 bg-white p-6 shadow-[0_18px_40px_-22px_rgb(29_31_33/0.5)] sm:p-7">
              <p id="receipt-title" className="font-display text-xl font-bold">
                One family, one intake
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">Never applied. Back to 2016.</p>
              <dl className="mt-5 space-y-2.5 border-t border-dashed border-ink/30 pt-4 text-[15px]">
                {LINES.map((r) => (
                  <div key={r.program} className="flex items-baseline gap-2">
                    <dt className="min-w-0">{PROGRAMS[r.program].name}</dt>
                    <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-ink/40" />
                    <dd className="font-medium">{formatMoney(r.backPayEstimate ?? 0)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-ink pt-3">
                <span className="font-semibold">Owed back</span>
                <span className="font-display text-4xl font-extrabold text-accent-ink">{formatMoney(family.totals.backPay)}</span>
              </div>
              <p className="mt-1 text-right text-sm text-ink-soft">then {formatMoney(family.totals.annual, "year")} going forward</p>
            </div>
            <p className="mt-4 max-w-sm text-sm text-ink-soft">
              Free for clients, never takes a cut. Demo persona; estimates follow published CRA rules.
            </p>
          </section>

          <section aria-labelledby="problem-title">
            <h2 id="problem-title" className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              The money exists. The paperwork is where people fall off.
            </h2>
            <ul className="mt-6 max-w-2xl divide-y divide-ink/15 border-y border-ink/15">
              {FACTS.map((f) => (
                <li key={f.stat} className="grid gap-1 py-4 sm:grid-cols-[8.5rem_1fr] sm:gap-5">
                  <p className="font-display text-3xl font-extrabold text-accent-ink">{f.stat}</p>
                  <p className="text-[15px]">
                    {f.text}{" "}
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-sm text-ink-soft underline underline-offset-2">
                      {f.source}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mx-auto mt-20 w-full max-w-3xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">How it works</h2>
          <ol className="mt-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative grid grid-cols-[3rem_1fr] gap-5 pb-9 last:pb-0">
                {/* A dashed thread from one step to the next, like the rule on the receipt. */}
                {i < STEPS.length - 1 && <span aria-hidden className="absolute top-14 bottom-2 left-6 border-l-2 border-dashed border-ink/25" />}
                <span className="grid size-12 place-items-center rounded-full border border-ink/15 bg-white shadow-[0_8px_20px_-12px_rgb(29_31_33/0.45)]">
                  <Icon paths={step.icon} className="size-6 text-accent-ink" />
                </span>
                <div className="pt-2.5">
                  <h3 className="font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-1 text-ink-soft">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mt-20 w-full max-w-3xl">
          <p className="font-display text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
            One month at one centre: <span className="text-accent-ink">{formatMoney(month.likely.backPay)}</span> found.
          </p>
          <p className="mt-3 text-ink-soft">
            {month.clients} synthetic clients through the same rules and paperwork as a real intake. {month.withLikely} of them
            are likely owed money, plus {formatMoney(month.likely.annual, "year")} going forward and {month.formsPrepared} forms
            ready to sign.{" "}
            <Link href="/dashboard/month" className="font-semibold text-ink underline underline-offset-2">
              See the month
            </Link>
          </p>
        </section>

        <section className="mx-auto mt-20 flex w-full max-w-3xl flex-col gap-6 border-t border-ink/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Built for the people already doing this work.</h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              Community centres and tax clinics, not consumers. Free for clients, never a cut of their money, and staff
              approve every step. Recoup never submits anything to the government.
            </p>
          </div>
          <Link href="/clients" className="shrink-0 self-start rounded-lg bg-night px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 sm:self-auto">
            Try the demo
          </Link>
        </section>

        <footer className="mx-auto mt-16 w-full max-w-6xl text-xs text-ink-soft">
          Photo by{" "}
          <a className="underline" href="https://unsplash.com/photos/green-hills-and-a-beautiful-blue-sky-Kn1eMkcZ1BU">
            Jimmy Liu
          </a>{" "}
          on Unsplash
        </footer>
      </div>
    </main>
  );
}
