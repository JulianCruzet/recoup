import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { CountUp, GrowBar, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { summarize } from "@/lib/dashboard";
import { listApplications } from "@/lib/db/applications";
import { getFacts, listClients } from "@/lib/db/queries";
import { PROGRAMS } from "@/lib/programs";
import { evaluate } from "@/lib/rules";
import { STAGE_LABEL, type Stage } from "@/lib/tracker/stages";

export default function DashboardPage() {
  return (
    <>
      <Reveal>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-ink-soft">
          What the centre has found for clients, what&rsquo;s been sent, and what has actually arrived.{" "}
          <Link href="/dashboard/month" className="font-semibold text-ink underline underline-offset-2">
            See a simulated month
          </Link>
        </p>
      </Reveal>
      <Suspense fallback={<p className="mt-8 text-ink-soft">Loading…</p>}>
        <Numbers />
      </Suspense>
    </>
  );
}

async function Numbers() {
  await connection();
  const clients = await listClients();
  const evaluations = await Promise.all(clients.map(async (c) => evaluate(await getFacts(c.id))));
  const identified = evaluations.reduce((t, e) => t + e.totals.backPay + e.totals.annual, 0);
  const s = summarize(
    (await listApplications()).map((a) => ({ clientId: a.clientId, program: a.program, stage: a.stage, expected: a.expected, received: a.received })),
  );

  const tiles = [
    { label: "Identified for clients", value: identified, note: `${clients.length} clients screened` },
    { label: "Applications sent", value: s.submitted, note: `${Object.entries(s.byStage).filter(([k]) => ["submitted", "in_review", "more_info", "approved", "paid"].includes(k)).reduce((t, [, n]) => t + n, 0)} applications` },
    { label: "Money received", value: s.received, note: "Confirmed by clients" },
  ];

  return (
    <div className="mt-8 space-y-5">
      {/* The three totals rise in and count up from $0. */}
      <Stagger className="grid gap-4 md:grid-cols-3">
        {tiles.map((t, i) => (
          <StaggerItem key={t.label} className={`glass rounded-3xl p-6 backdrop-blur-xl ${i === 2 ? "glass-frost" : "glass-solid"}`}>
            <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">{t.label}</p>
            <p className={`font-display mt-1 text-5xl font-extrabold tabular-nums ${i === 2 ? "text-accent-ink" : ""}`}>
              <CountUp value={t.value} delay={0.25 + i * 0.08} />
            </p>
            <p className="mt-1 text-sm text-ink-soft">{t.note}</p>
          </StaggerItem>
        ))}
      </Stagger>

      <Stagger className="grid gap-4 lg:grid-cols-[1.4fr_1fr]" delay={0.35}>
        <StaggerItem as="section" className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-bold">By benefit</h2>
          {s.byProgram.length === 0 ? (
            <p className="mt-3 text-ink-soft">No applications started yet.</p>
          ) : (
            <table className="mt-3 w-full text-left text-[15px]">
              <thead className="text-xs tracking-wide text-ink-soft uppercase">
                <tr>
                  <th className="py-2 font-medium">Benefit</th>
                  <th className="py-2 text-right font-medium">Applications</th>
                  <th className="py-2 text-right font-medium">Expected</th>
                  <th className="py-2 text-right font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {s.byProgram.map((p) => (
                  <tr key={p.program}>
                    <td className="py-2.5">{PROGRAMS[p.program].name}</td>
                    <td className="py-2.5 text-right tabular-nums">{p.count}</td>
                    <td className="py-2.5 text-right"><MoneyAmount amount={p.expected} size="sm" /></td>
                    <td className="py-2.5 text-right"><MoneyAmount amount={p.received} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </StaggerItem>

        <StaggerItem as="section" className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-bold">Where applications are</h2>
          <ul className="mt-3 space-y-2">
            {(Object.entries(s.byStage) as [Stage, number][]).map(([stage, n]) => (
              <li key={stage} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-[15px]">{STAGE_LABEL[stage]}</span>
                <GrowBar className="h-2.5 rounded-full bg-accent/70" width={`${Math.max(6, (n / Math.max(1, ...Object.values(s.byStage))) * 100)}%`} delay={0.6} />
                <span className="text-sm tabular-nums text-ink-soft">{n}</span>
              </li>
            ))}
            {Object.keys(s.byStage).length === 0 && <li className="text-ink-soft">Nothing in progress yet.</li>}
          </ul>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
