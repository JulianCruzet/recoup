import { Stagger, StaggerItem } from "@/components/motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LiveSession } from "@/components/LiveSession";
import { getClient, getFacts } from "@/lib/db/queries";

export default function IntakePage(props: PageProps<"/clients/[id]/intake">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
      <Intake params={props.params} />
    </Suspense>
  );
}

async function Intake({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const facts = await getFacts(id);

  return (
    <Stagger className="space-y-5">
      <StaggerItem className="flex items-center justify-between">
        <Link href={`/clients/${id}`} className="text-sm text-ink-soft hover:text-ink">
          ← {client.name}
        </Link>
        <Link href={`/clients/${id}`} className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white">
          See results
        </Link>
      </StaggerItem>
      <LiveSession clientId={id} clientName={client.name} initialFacts={facts} />
    </Stagger>
  );
}
