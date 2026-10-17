import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { FollowUpDraft } from "@/components/FollowUpDraft";
import { PaymentCheckIn } from "@/components/PaymentCheckIn";
import { MotionCard, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { listApplications, type ApplicationRow } from "@/lib/db/applications";
import { demoOffsetDays, demoToday } from "@/lib/db/demo-clock";
import { PROGRAMS } from "@/lib/programs";
import { STAGE_LABEL, nextStages, type Stage } from "@/lib/tracker/stages";
import { isOverdue, isStalled } from "@/lib/tracker/timeline";
import { FastForwardButton } from "@/components/FastForwardButton";
import { DEMO_LEG_DAYS, DEMO_LEGS } from "@/lib/tracker/demo";
import { advanceApplication, fastForward, resetDemo } from "./actions";

const COLUMNS: { title: string; stages: Stage[] }[] = [
  { title: "To prepare", stages: ["identified", "preparing", "ready_to_sign"] },
  { title: "With the client", stages: ["signed"] },
  { title: "With the government", stages: ["submitted", "in_review", "more_info"] },
  { title: "Done", stages: ["approved", "paid", "denied", "closed"] },
];

export default function TrackerPage() {
  return (
    <>
      <Reveal>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Applications</h1>
        <p className="mt-1 text-ink-soft">Every application, from the first conversation until the money arrives.</p>
      </Reveal>
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
      {offset < DEMO_LEG_DAYS * DEMO_LEGS && <FastForwardButton action={fastForward} fromWeek={Math.round(offset / 7)} />}
      <form action={resetDemo}>
        <button className="rounded-full border border-ink/20 bg-white/60 px-4 py-2 text-sm font-semibold hover:bg-white">Reset demo</button>
      </form>
      <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent-ink uppercase">
        Simulated{offset > 0 ? `: ${offset} days ahead` : " time for the demo"}
      </span>
    </div>
    {/* Columns rise in left to right, then their cards; a card that changes stage slides to its new column. */}
    <Stagger className="mt-5 grid gap-4 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = apps.filter((a) => col.stages.includes(a.stage));
        return (
          <StaggerItem as="section" key={col.title} className="glass glass-solid rounded-3xl p-4 backdrop-blur-xl">
            <h2 className="flex items-baseline justify-between px-1 font-semibold">
              {col.title} <span className="text-sm text-ink-soft">{items.length}</span>
            </h2>
            <Stagger as="ul" nested className="mt-3 space-y-3">
              {items.map((a) => (
                <Card key={a.id} app={a} today={today} />
              ))}
            </Stagger>
          </StaggerItem>
        );
      })}
    </Stagger>
    </>
  );
}

// Good and bad outcomes get a soft green or red tint; everything in progress stays white.
const OUTCOME: Partial<Record<Stage, { card: string; dot: string; pill: string }>> = {
  approved: { card: "bg-approved-soft", dot: "bg-approved", pill: "bg-white/70" },
  paid: { card: "bg-approved-soft", dot: "bg-approved", pill: "bg-white/70" },
  denied: { card: "bg-denied-soft", dot: "bg-denied", pill: "bg-white/70" },
};
const MOVE_STYLE: Partial<Record<Stage, string>> = {
  approved: "hover:border-approved hover:bg-approved-soft",
  paid: "hover:border-approved hover:bg-approved-soft",
  denied: "hover:border-denied hover:bg-denied-soft",
};

function Card({ app, today }: { app: ApplicationRow; today: Date }) {
  const overdue = isOverdue(app, today);
  const stalled = isStalled(app, today);
  const outcome = OUTCOME[app.stage];
  return (
    <MotionCard id={app.id} className={`rounded-2xl p-4 ${outcome?.card ?? "bg-white/80"} ${overdue ? "ring-2 ring-accent" : ""}`}>
      {/* Who and how much on one line; the program name gets the full width below so it doesn't wrap into a sliver. */}
      <div className="flex items-center justify-between gap-2">
        <Link href={`/clients/${app.clientId}`} className="flex min-w-0 items-center gap-2 text-sm font-semibold hover:underline">
          <ClientAvatar id={app.clientId} name={app.clientName} size={28} />
          <span className="truncate">{app.clientName}</span>
        </Link>
        {app.received ?? app.expected ? <MoneyAmount amount={app.received ?? app.expected} size="sm" /> : <span className="text-sm text-ink-soft">Coverage</span>}
      </div>
      <p className="mt-2 text-[15px] leading-snug font-semibold">{PROGRAMS[app.program].name}</p>
      <p className="mt-1 text-xs text-ink-soft">
        {outcome ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold text-ink ${outcome.pill}`}>
            <span className={`size-1.5 rounded-full ${outcome.dot}`} aria-hidden />
            {STAGE_LABEL[app.stage]}
          </span>
        ) : (
          STAGE_LABEL[app.stage]
        )}
        {overdue && <span className="ml-2 font-semibold text-accent-ink">Overdue</span>}
        {stalled && <span className="ml-2 font-semibold text-accent-ink">Stalled</span>}
      </p>
      {overdue && <FollowUpDraft applicationId={app.id} />}
      {app.stage === "approved" && app.expected > 0 && <PaymentCheckIn applicationId={app.id} expected={app.expected} clientName={app.clientName} />}
      {nextStages(app.stage).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {nextStages(app.stage).map((to) => (
            <form key={to} action={advanceApplication}>
              <input type="hidden" name="id" value={app.id} />
              <input type="hidden" name="to" value={to} />
              <input type="hidden" name="expected" value={app.expected} />
              <button className={`rounded-full border border-ink/15 bg-white px-2.5 py-1 text-xs font-semibold ${MOVE_STYLE[to] ?? "hover:bg-ink hover:text-white"}`}>
                {STAGE_LABEL[to]}
              </button>
            </form>
          ))}
        </div>
      )}
    </MotionCard>
  );
}
