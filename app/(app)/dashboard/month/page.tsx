import Link from "next/link";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { formatMoney } from "@/lib/format";
import { PROGRAMS } from "@/lib/programs";
import { runMonth, type SimClient } from "@/lib/simulate/month";
import clients from "@/seed/clients.json";

export default function MonthPage() {
  const m = runMonth(clients as unknown as SimClient[]);
  const tiles = [
    { label: "Likely owed", value: formatMoney(m.likely.backPay), note: `back pay, plus ${formatMoney(m.likely.annual, "year")}` },
    { label: "Clients with money waiting", value: `${m.withLikely} of ${m.clients}`, note: `${m.dentalCoverage} likely covered for dental care · ${m.withDeadline} with money that expires Dec 31` },
    { label: "Paperwork ready", value: String(m.formsPrepared), note: `forms pre-filled, ${m.doctorBriefs} with a doctor summary` },
  ];

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-ink-soft hover:text-ink">
        ← Dashboard
      </Link>
      <header>
        <p className="inline-block rounded-full bg-night px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">Simulated</p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight">One month at one centre</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          {m.clients} synthetic clients, a mix of seniors, families, adults with a disability and low-income workers, run
          through the same rules and paperwork as a real intake. No real people.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {tiles.map((t, i) => (
          <div key={t.label} className={`glass rounded-3xl p-6 backdrop-blur-xl ${i === 0 ? "glass-frost" : "glass-solid"}`}>
            <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">{t.label}</p>
            <p className={`font-display mt-1 text-5xl font-extrabold tabular-nums ${i === 0 ? "text-accent" : ""}`}>{t.value}</p>
            <p className="mt-1 text-sm text-ink-soft">{t.note}</p>
          </div>
        ))}
      </div>

      <section className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
        <h2 className="font-display text-xl font-bold">Likely, by benefit</h2>
        <table className="mt-3 w-full text-left text-[15px]">
          <thead className="text-xs tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="py-2 font-medium">Benefit</th>
              <th className="py-2 text-right font-medium">Clients</th>
              <th className="py-2 text-right font-medium">Back pay</th>
              <th className="py-2 text-right font-medium">Per year</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {m.byProgram.map((p) => (
              <tr key={p.program}>
                <td className="py-2.5">{PROGRAMS[p.program].name}</td>
                <td className="py-2.5 text-right tabular-nums">{p.clients}</td>
                <td className="py-2.5 text-right">{p.backPay ? <MoneyAmount amount={p.backPay} size="sm" /> : <span className="text-ink-soft">—</span>}</td>
                <td className="py-2.5 text-right">{p.annual ? <MoneyAmount amount={p.annual} size="sm" /> : <span className="text-ink-soft">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-ink-soft">
          Another {formatMoney(m.possible.backPay + m.possible.annual)} came back &ldquo;possible&rdquo; and needs one more answer.{" "}
          {m.referrals} referrals flagged for programs we don&rsquo;t calculate yet.
        </p>
      </section>
    </div>
  );
}
