import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { FollowUpDraft } from "@/components/FollowUpDraft";
import { PaymentCheckIn } from "@/components/PaymentCheckIn";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { listApplications, type ApplicationRow } from "@/lib/db/applications";
import { demoOffsetDays, demoToday } from "@/lib/db/demo-clock";
import { PROGRAMS } from "@/lib/programs";
import { STAGE_LABEL, nextStages, type Stage } from "@/lib/tracker/stages";
import { isOverdue, isStalled } from "@/lib/tracker/timeline";
import { advanceApplication, fastForward, resetDemoClock } from "./actions";

const COLUMNS: { title: string; stages: Stage[] }[] = [
  { title: "To prepare", stages: ["identified", "preparing", "ready_to_sign"] },
  { title: "With the client", stages: ["signed"] },
  { title: "With the government", stages: ["submitted", "in_review", "more_info"] },
  { title: "Done", stages: ["approved", "paid", "denied", "closed"] },
];

export default function TrackerPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Applications</h1>
      <p className="mt-1 text-ink-soft">Every application, from the first conversation until the money arrives.</p>
      <Suspense fallback={<p className="mt-8 text-ink-soft">Loading…</p>}>
        <Board />
      </Suspense>
    </>
  );
}

async function Board() {
  await connection();
  const apps = await listApplications();
  const today = await demoToday();
  const offset = await demoOffsetDays();
  if (apps.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          title="No applications yet"
          body="Open a client's results and start their applications to track them here."
          action={<Link href="/clients" className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white">Go to clients</Link>}
        />
      </div>
    );
  }
  return (
    <>
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <form action={fastForward}>
        <input type="hidden" name="days" value={56} />
        <button className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white">Fast-forward 8 weeks</button>
      </form>
      {offset > 0 && (
        <form action={resetDemoClock}>
          <button className="rounded-full border border-ink/20 bg-white/60 px-4 py-2 text-sm font-semibold">Reset clock</button>
        </form>
      )}
      <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent-ink uppercase">
        Simulated{offset > 0 ? `: ${offset} days ahead` : " time for the demo"}
      </span>
    </div>
    <div className="mt-5 grid gap-4 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = apps.filter((a) => col.stages.includes(a.stage));
        return (
          <section key={col.title} className="glass glass-solid rounded-3xl p-4 backdrop-blur-xl">
            <h2 className="flex items-baseline justify-between px-1 font-semibold">
              {col.title} <span className="text-sm text-ink-soft">{items.length}</span>
            </h2>
            <ul className="mt-3 space-y-3">
              {items.map((a) => (
                <Card key={a.id} app={a} today={today} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
    </>
  );
}

function Card({ app, today }: { app: ApplicationRow; today: Date }) {
  const overdue = isOverdue(app, today);
  const stalled = isStalled(app, today);
  return (
    <li className={`rounded-2xl bg-white/80 p-4 ${overdue ? "ring-2 ring-accent" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/clients/${app.clientId}`} className="text-sm font-semibold hover:underline">
            {app.clientName}
          </Link>
          <p className="text-[15px] leading-snug">{PROGRAMS[app.program].name}</p>
        </div>
        {app.received ?? app.expected ? <MoneyAmount amount={app.received ?? app.expected} size="sm" /> : <span className="text-sm text-ink-soft">Coverage</span>}
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {STAGE_LABEL[app.stage]}
        {overdue && <span className="ml-2 font-semibold text-accent-ink">Overdue</span>}
        {stalled && <span className="ml-2 font-semibold text-accent-ink">Stalled</span>}
      </p>
      {overdue && <FollowUpDraft applicationId={app.id} />}
      {app.stage === "approved" && <PaymentCheckIn applicationId={app.id} expected={app.expected} clientName={app.clientName} />}
      {nextStages(app.stage).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {nextStages(app.stage).map((to) => (
            <form key={to} action={advanceApplication}>
              <input type="hidden" name="id" value={app.id} />
              <input type="hidden" name="to" value={to} />
              <input type="hidden" name="expected" value={app.expected} />
              <button className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-ink hover:text-white">
                {STAGE_LABEL[to]}
              </button>
            </form>
          ))}
        </div>
      )}
    </li>
  );
}
