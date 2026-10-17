import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SessionReplay, type Turn } from "@/components/SessionReplay";
import { getClient, getFacts } from "@/lib/db/queries";
import { REPLAYS } from "@/lib/replays";

export default function SessionPage(props: PageProps<"/clients/[id]/session">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
      <Session params={props.params} />
    </Suspense>
  );
}

async function Session({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const facts = await getFacts(id);
  const turns: Turn[] = REPLAYS[client.personaId ?? ""] ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href={`/clients/${id}`} className="text-sm text-ink-soft hover:text-ink">
          ← {client.name}
        </Link>
        <Link href={`/clients/${id}`} className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white">
          See results
        </Link>
      </div>
      <SessionReplay turns={turns} facts={facts} clientId={client.id} clientName={client.name} />
    </div>
  );
}
