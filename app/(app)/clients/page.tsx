import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { getFacts, listClients } from "@/lib/db/queries";

export default function ClientsPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Clients</h1>
      <Suspense fallback={<p className="mt-8 text-ink-soft">Loading clients…</p>}>
        <ClientList />
      </Suspense>
    </>
  );
}

async function ClientList() {
  await connection();
  const clients = await listClients();
  const factCounts = await Promise.all(clients.map(async (c) => (await getFacts(c.id)).length));

  return (
    <ul className="glass glass-solid mt-8 divide-y divide-ink/10 overflow-hidden rounded-3xl">
      {clients.map((client, i) => (
        <li key={client.id}>
          <Link href={`/clients/${client.id}`} className="flex items-center gap-6 px-6 py-5 transition-colors hover:bg-white/60">
            <ClientAvatar id={client.id} name={client.name} size={48} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{client.name}</span>
              <span className="block truncate text-sm text-ink-soft">{client.summary}</span>
            </span>
            <span className="hidden text-sm text-ink-soft sm:block">{factCounts[i]} facts</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
