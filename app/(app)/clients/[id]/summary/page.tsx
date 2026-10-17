import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClientSummary } from "@/components/ClientSummary";
import { PrintButton } from "@/components/PrintButton";
import { getClient, getFacts } from "@/lib/db/queries";
import { DEMO_DATE } from "@/lib/rules/framework";
import { evaluate } from "@/lib/rules";

export default function SummaryPage(props: PageProps<"/clients/[id]/summary">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
      <Summary params={props.params} />
    </Suspense>
  );
}

async function Summary({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const { results, totals } = evaluate(await getFacts(id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/clients/${id}/packages`} className="text-sm text-ink-soft hover:text-ink">
          ← Paperwork
        </Link>
        <PrintButton />
      </div>
      <div className="rounded-2xl shadow-xl print:shadow-none">
        <ClientSummary
          clientName={client.name}
          centre={process.env.CENTRE_NAME ?? "the Recoup demo centre"}
          results={results}
          totals={totals}
          preparedOn={DEMO_DATE.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
        />
      </div>
    </div>
  );
}
