import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LiquidGlass } from "@/components/glass/LiquidGlass";
import { formatMoney } from "@/lib/format";
import { runMonth, type SimClient } from "@/lib/simulate/month";
import clients from "@/seed/clients.json";

const month = runMonth(clients as unknown as SimClient[]);

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

const STEPS = [
  { title: "Listen", text: "With the client's consent, Recoup follows the intake conversation and pulls out facts, each with the words it came from." },
  { title: "Decide", text: "A rules engine, not the AI, checks federal and Ontario programs and shows the rule and source behind every dollar." },
  { title: "Prepare", text: "Forms come pre-filled and a summary for the doctor is ready. SIN, bank details and signatures stay with the client." },
  { title: "Follow", text: "Each application is tracked until the money lands, with follow-ups drafted for staff when a decision runs late." },
];

export default function Landing() {
  return (
    <main className="flex min-h-dvh flex-col px-4 pt-4 text-ink sm:px-6">
      <AppNav />

      <section className="mx-auto mt-[3vh] mb-8 w-full max-w-6xl">
        <h1 className="font-display max-w-4xl text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-7xl">
          Get people the money they&rsquo;re already owed.
        </h1>
        <p className="mt-3 max-w-xl text-lg font-medium text-ink-soft">
          Finds what a client is likely owed, with the rule behind every dollar. Prepares the forms. Follows each one
          until it&rsquo;s paid.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href="/clients"
            className="rounded-full bg-night px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            See how it works
          </Link>
        </div>
      </section>

      <LiquidGlass
        tint="frost"
        radius={30}
        bezel={26}
        strength={48}
        className="mx-auto mt-auto mb-10 grid w-full max-w-6xl gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-end sm:p-8"
      >
        <div>
          <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">One family, one intake</p>
          <p className="font-display mt-1 text-6xl font-extrabold text-accent-ink sm:text-7xl">$31,107</p>
        </div>
        <p className="max-w-xl text-base text-ink sm:justify-self-end sm:text-right">
          Disability Tax Credit back to 2016 plus the Child Disability Benefit, found for a family that had never applied.
          <span className="mt-1 block text-sm text-ink-soft">Free for clients, never takes a cut. Demo persona; estimates follow published CRA rules.</span>
        </p>
      </LiquidGlass>

      <section className="mx-auto w-full max-w-6xl py-16">
        <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">The problem</p>
        <h2 className="font-display mt-2 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          The money exists. The paperwork is where people fall off.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {FACTS.map((f) => (
            <figure key={f.stat} className="glass glass-frost rounded-3xl p-6 backdrop-blur-xl">
              <p className="font-display text-5xl font-extrabold text-accent-ink">{f.stat}</p>
              <figcaption className="mt-2 text-[15px]">
                {f.text}{" "}
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-soft underline underline-offset-2">
                  {f.source}
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl pb-16">
        <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">How it works</p>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
              <p className="font-display text-sm font-bold text-accent-ink">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-display mt-1 text-2xl font-bold">{step.title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-6xl pb-16">
        <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">Impact, simulated</p>
        <div className="glass glass-frost mt-4 grid gap-6 rounded-[28px] p-7 backdrop-blur-xl sm:grid-cols-[1.2fr_1fr] sm:items-end sm:p-10">
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            One month at one centre: <span className="text-accent-ink">{formatMoney(month.likely.backPay)}</span> found.
          </h2>
          <p className="text-[15px] text-ink sm:text-right">
            {month.clients} synthetic clients through the same rules and paperwork as a real intake. {month.withLikely} of them
            are likely owed money, plus {formatMoney(month.likely.annual, "year")} going forward and {month.formsPrepared} forms
            ready to sign.{" "}
            <Link href="/dashboard/month" className="font-semibold text-ink underline underline-offset-2">
              See the month
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto mb-16 w-full max-w-6xl">
        <LiquidGlass tint="frost" radius={30} bezel={26} strength={48} className="grid gap-6 p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Built for the people already doing this work.</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Community centres and tax clinics, not consumers. Free for clients, never a cut of their money, and staff
              approve every step. Recoup never submits anything to the government.
            </p>
          </div>
          <Link href="/clients" className="justify-self-start rounded-full bg-night px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 sm:justify-self-end">
            Try the demo
          </Link>
        </LiquidGlass>
      </section>

      <footer className="mx-auto mb-4 w-full max-w-6xl text-xs text-ink-soft">
        Photo by{" "}
        <a className="underline" href="https://unsplash.com/photos/green-hills-and-a-beautiful-blue-sky-Kn1eMkcZ1BU">
          Jimmy Liu
        </a>{" "}
        on Unsplash
      </footer>
    </main>
  );
}
