import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PrintButton } from "@/components/PrintButton";
import { getClient, getFacts } from "@/lib/db/queries";
import { doctorBrief } from "@/lib/packages/doctor-brief";

export default function BriefPage(props: PageProps<"/clients/[id]/brief">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
      <Brief params={props.params} />
    </Suspense>
  );
}

async function Brief({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const brief = doctorBrief(await getFacts(id), client.name);
  if (!brief) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/clients/${id}`} className="text-sm text-ink-soft hover:text-ink">
          ← {client.name}
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-3xl rounded-2xl bg-paper p-10 text-[15px] leading-relaxed text-ink shadow-xl print:max-w-none print:rounded-none print:bg-white print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-ink/15 pb-5">
          <div>
            <p className="text-xs font-semibold tracking-widest text-ink-soft uppercase">For the practitioner completing Part B of form T2201</p>
            <h1 className="font-display mt-1 text-3xl font-bold">Daily-living summary: {brief.patient}</h1>
            {brief.forChild && <p className="text-ink-soft">Prepared with their parent, {client.name}</p>}
          </div>
          <span className="font-display text-lg font-extrabold">Recoup</span>
        </header>

        <p className="mt-5">
          This family is applying for the Disability Tax Credit. Below is what they described, organized by the categories in
          Part B, next to the test CRA applies. It is meant to save time at the appointment; the assessment is yours.
        </p>

        <div className="mt-6 space-y-6">
          {brief.sections.map((s) => (
            <section key={s.category} className="break-inside-avoid">
              <h2 className="font-display text-xl font-bold">{s.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">
                <span className="font-semibold">CRA test:</span> {s.test}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {s.observations.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <ul className="mt-8 space-y-1 border-t border-ink/15 pt-4 text-sm text-ink-soft">
          {brief.otherNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
