import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getClient, getFacts } from "@/lib/db/queries";
import { evaluate } from "@/lib/rules";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { ExplainResult } from "@/components/ExplainResult";
import { StartApplicationsButton } from "@/components/StartApplicationsButton";
import { SourceLink } from "@/components/ui/SourceLink";
import { describeField } from "@/lib/fields";
import { formatMoney } from "@/lib/format";
import { PROGRAMS, REFERRALS } from "@/lib/programs";
import { hasReplay } from "@/lib/replays";
import type { EligibilityResult } from "@/lib/types";
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
  const likely = results.filter((r) => r.status === "likely");
  const possible = results.filter((r) => r.status === "possible");
  const notEligible = results.filter((r) => r.status === "not_eligible");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/clients" className="shrink-0 text-sm whitespace-nowrap text-ink-soft hover:text-ink">
          ← Clients
        </Link>
        <div className="flex flex-wrap justify-end gap-2">
          {hasReplay(client.personaId) && (
            <Link href={`/clients/${id}/session`} className="rounded-full border border-ink/20 bg-white/60 px-5 py-2.5 text-sm font-semibold">
              Replay intake
            </Link>
          )}
          <Link href={`/clients/${id}/intake`} className="rounded-full border border-ink/20 bg-white/60 px-5 py-2.5 text-sm font-semibold">
            New intake
          </Link>
          <Link href={`/clients/${id}/packages`} className="rounded-full border border-ink/20 bg-white/60 px-5 py-2.5 text-sm font-semibold">
            Paperwork
          </Link>
          <form action={startApplications}>
            <input type="hidden" name="clientId" value={id} />
            <StartApplicationsButton />
          </form>
        </div>
      </div>

      <header className="glass glass-frost grid gap-6 rounded-[28px] p-7 backdrop-blur-xl sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex items-center gap-5">
          <ClientAvatar id={client.id} name={client.name} size={76} />
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">{client.name}</h1>
            <p className="mt-1 text-ink-soft">{client.summary}</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">Likely owed</p>
          <p className="font-display text-6xl font-extrabold text-accent-ink">{formatMoney(totals.backPay)}</p>
          <p className="text-ink-soft">plus {formatMoney(totals.annual, "year")}</p>
        </div>
      </header>

      {deadline && (
        <p className="glass glass-solid rounded-2xl px-5 py-3 text-sm backdrop-blur-xl">
          <strong className="text-accent-ink">Deadline {deadline.date}:</strong> {deadline.note}
        </p>
      )}

      {likely.length > 0 && (
        <Tier title="Likely" detail={sumLine(likely)} solid accent>
          {likely.map((r) => <ResultRow key={r.program} r={r} clientId={id} />)}
        </Tier>
      )}

      {possible.length > 0 && (
        <Tier title="Possible" detail={[sumLine(possible), "if confirmed"].filter(Boolean).join(" ")}>
          {possible.map((r) => <ResultRow key={r.program} r={r} clientId={id} />)}
        </Tier>
      )}

      {notEligible.length > 0 && (
        <Tier title="Not eligible">
          {notEligible.map((r) => (
            <li key={r.program} className="px-6 py-3 text-[15px]">
              <span className="font-semibold">{PROGRAMS[r.program].name}</span>
              <span className="text-ink-soft"> · {r.reasons[0]}</span>
            </li>
          ))}
        </Tier>
      )}

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

/** "$31,107 back + $5,772/yr" for a group of results, or "" when it's coverage only. */
function sumLine(results: EligibilityResult[]): string {
  const back = results.reduce((t, r) => t + (r.backPayEstimate ?? 0), 0);
  const annual = results.reduce((t, r) => t + (r.annualEstimate ?? 0), 0);
  return [back ? `${formatMoney(back)} back` : "", annual ? formatMoney(annual, "year") : ""].filter(Boolean).join(" + ");
}

/** One glass panel per status: the heading and its total sit inside, programs are rows below. */
function Tier({ title, detail, solid = false, accent = false, children }: { title: string; detail?: string; solid?: boolean; accent?: boolean; children: React.ReactNode }) {
  return (
    <section className={`glass overflow-hidden rounded-3xl backdrop-blur-xl ${solid ? "glass-solid" : "glass-frost"}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/10 px-6 pt-5 pb-4">
        <h2 className={`font-display text-2xl font-extrabold tracking-tight ${accent ? "text-accent-ink" : ""}`}>{title}</h2>
        {detail && <p className="text-ink-soft tabular-nums">{detail}</p>}
      </header>
      <ul className="divide-y divide-ink/10">{children}</ul>
    </section>
  );
}

/** One program row. Likely amounts are amber; a possible one shows the question that would settle it. */
function ResultRow({ r, clientId }: { r: EligibilityResult; clientId: string }) {
  const isLikely = r.status === "likely";
  return (
    <li className="grid gap-x-8 gap-y-2 p-6 sm:grid-cols-[1fr_auto]">
      <h3 className="font-display text-2xl font-bold tracking-tight">{PROGRAMS[r.program].name}</h3>
      {/* Spans both rows on wide screens so the reasons sit right under the title, not under the amount. */}
      <div className="tabular-nums sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:text-right">
        {r.backPayEstimate ? <p className={`font-display font-extrabold tracking-tight ${isLikely ? "text-3xl text-accent-ink" : "text-2xl"}`}>{formatMoney(r.backPayEstimate)}</p> : null}
        {r.annualEstimate ? (
          <p className={r.backPayEstimate ? "text-ink-soft" : `font-display font-extrabold tracking-tight ${isLikely ? "text-3xl text-accent-ink" : "text-2xl"}`}>{formatMoney(r.annualEstimate, "year")}</p>
        ) : null}
        {!r.backPayEstimate && !r.annualEstimate && r.program === "cdcp" ? (
          <p className={`font-display text-2xl font-extrabold tracking-tight ${isLikely ? "text-accent-ink" : ""}`}>Coverage</p>
        ) : null}
      </div>
      <div className="min-w-0 sm:col-start-1 sm:row-start-2">
        <ul className="space-y-1 text-[15px]">
          {r.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        {r.missing.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-[15px]">
            <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Ask the client</p>
            {r.missing.slice(0, 2).map((field) => (
              <p key={field} className="mt-1 font-medium">{describeField(field).ask}</p>
            ))}
          </div>
        )}
        <ExplainResult clientId={clientId} program={r.program} />
        {r.program === "dtc" && (
          <Link href={`/clients/${clientId}/brief`} className="mt-2 inline-block text-sm font-semibold text-accent-ink underline underline-offset-2">
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
      </div>
    </li>
  );
}
