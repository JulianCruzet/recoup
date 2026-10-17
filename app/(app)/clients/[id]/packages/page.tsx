import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ISP3025 } from "@/components/forms/ISP3025";
import { RC66 } from "@/components/forms/RC66";
import { T2201PartA } from "@/components/forms/T2201PartA";
import { PrintButton } from "@/components/PrintButton";
import { getClient, getFacts } from "@/lib/db/queries";
import { packagesFor, type Package } from "@/lib/packages/forms";
import { PROGRAMS } from "@/lib/programs";
import { evaluate } from "@/lib/rules";

export default function PackagesPage(props: PageProps<"/clients/[id]/packages">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
      <Packages params={props.params} />
    </Suspense>
  );
}

function Form({ pkg }: { pkg: Package }) {
  if (pkg.kind === "t2201") return <T2201PartA data={pkg.data} />;
  if (pkg.kind === "rc66") return <RC66 data={pkg.data} />;
  if (pkg.kind === "isp3025") return <ISP3025 data={pkg.data} />;
  return null;
}

async function Packages({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const facts = await getFacts(id);
  const packages = packagesFor(facts, evaluate(facts).results);
  const forms = packages.filter((p) => p.kind !== "steps");
  const steps = packages.filter((p) => p.kind === "steps");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/clients/${id}`} className="text-sm text-ink-soft hover:text-ink">
          ← {client.name}
        </Link>
        <PrintButton />
      </div>

      <header className="glass glass-frost rounded-[28px] p-7 backdrop-blur-xl print:hidden">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Paperwork for {client.name}</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Filled in from what the client confirmed. The client adds their SIN, bank details and signature, and sends it
          themselves. Recoup never submits anything.
        </p>
      </header>

      {forms.map((pkg) => (
        <section key={pkg.program} className="space-y-4 break-before-page">
          <div className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl print:hidden">
            <h2 className="font-display text-2xl font-bold">{PROGRAMS[pkg.program].name}</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px]">
              {pkg.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {pkg.kind === "t2201" && (
              <Link href={`/clients/${id}/brief`} className="mt-3 inline-block text-sm font-semibold text-accent underline underline-offset-2">
                Daily-living summary for the practitioner (Part B) →
              </Link>
            )}
          </div>
          <Form pkg={pkg} />
        </section>
      ))}

      {steps.length > 0 && (
        <section className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl print:hidden">
          <h2 className="font-display text-xl font-bold">No form needed</h2>
          <ul className="mt-2 space-y-2 text-[15px]">
            {steps.map((pkg) => (
              <li key={pkg.program}>
                <span className="font-semibold">{PROGRAMS[pkg.program].name}:</span> {pkg.steps.join(" ")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
