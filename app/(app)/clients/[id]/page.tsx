import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getClient, getFacts } from "@/lib/db/queries";
import { evaluate } from "@/lib/rules";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { ExplainResult } from "@/components/ExplainResult";
import { SourceLink } from "@/components/ui/SourceLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney } from "@/lib/format";
import { PROGRAMS, REFERRALS } from "@/lib/programs";
import { startApplications } from "../../tracker/actions";

export default function ClientPage(props: PageProps<"/clients/[id]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
      <ClientResults params={props.params} />
    </Suspense>
  );
}

async function ClientResults({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const { results, referrals, totals } = evaluate(await getFacts(id));
  const deadline = results.find((r) => r.deadline)?.deadline;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/clients" className="text-sm text-ink-soft hover:text-ink">
          ← Clients
        </Link>
        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/clients/${id}/session`} className="rounded-full border border-ink/20 bg-white/60 px-5 py-2.5 text-sm font-semibold">
            Replay intake
          </Link>
          <Link href={`/clients/${id}/intake`} className="rounded-full border border-ink/20 bg-white/60 px-5 py-2.5 text-sm font-semibold">
            New intake
          </Link>
          <Link href={`/clients/${id}/packages`} className="rounded-full border border-ink/20 bg-white/60 px-5 py-2.5 text-sm font-semibold">
            Paperwork
          </Link>
          <form action={startApplications}>
            <input type="hidden" name="clientId" value={id} />
            <button className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white">Start applications</button>
          </form>
        </div>
      </div>

      <header className="glass glass-frost grid gap-6 rounded-[28px] p-7 backdrop-blur-xl sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">{client.name}</h1>
          <p className="mt-1 max-w-xl text-ink-soft">{client.summary}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">Likely owed</p>
          <p className="font-display text-6xl font-extrabold text-accent">{formatMoney(totals.backPay)}</p>
          <p className="text-ink-soft">plus {formatMoney(totals.annual, "year")}</p>
        </div>
      </header>

      {deadline && (
        <p className="glass glass-solid rounded-2xl px-5 py-3 text-sm backdrop-blur-xl">
          <strong className="text-accent">Deadline {deadline.date}:</strong> {deadline.note}
        </p>
      )}

      <ul className="space-y-3">
        {results.map((r) => (
          <li key={r.program} className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <StatusBadge status={r.status} />
                <h2 className="font-display mt-2 text-2xl font-bold">{PROGRAMS[r.program].name}</h2>
              </div>
              {r.status !== "not_eligible" && (r.backPayEstimate || r.annualEstimate) ? (
                <div className="text-right tabular-nums">
                  {r.backPayEstimate ? <p><MoneyAmount amount={r.backPayEstimate} size="md" /></p> : null}
                  {r.annualEstimate ? <p className="text-ink-soft"><MoneyAmount amount={r.annualEstimate} cadence="year" size="sm" /></p> : null}
                </div>
              ) : null}
            </div>
            <ul className="mt-3 space-y-1 text-[15px]">
              {r.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            {r.status !== "not_eligible" && <ExplainResult clientId={id} program={r.program} />}
            {r.program === "dtc" && r.status !== "not_eligible" && (
              <Link href={`/clients/${id}/brief`} className="mt-2 inline-block text-sm font-semibold text-accent underline underline-offset-2">
                Daily-living summary for the doctor →
              </Link>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
              <span>
                {r.benefitYear} · rules {r.rulesVersion}
              </span>
              {r.citations.slice(0, 2).map((c, i) => (
                <SourceLink key={c.url} label={i === 0 ? c.label : new URL(c.url).hostname.replace(/^www\./, "")} url={c.url} />
              ))}
            </div>
          </li>
        ))}
      </ul>

      {referrals.length > 0 && (
        <section className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-bold">Also worth a referral</h2>
          <ul className="mt-2 space-y-1 text-[15px] text-ink-soft">
            {referrals.map((f) => (
              <li key={f.program}>
                <a href={REFERRALS[f.program].officialUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
                  {REFERRALS[f.program].name}
                </a>
                : {f.reason}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
