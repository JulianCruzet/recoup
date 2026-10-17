import { Stagger, StaggerItem } from "@/components/motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ISP3025 } from "@/components/forms/ISP3025";
import { RC66 } from "@/components/forms/RC66";
import { T2201PartA } from "@/components/forms/T2201PartA";
import { LargePrintToggle } from "@/components/LargePrintToggle";
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
    <Stagger className="space-y-6">
      <StaggerItem className="flex items-center justify-between print:hidden">
        <Link href={`/clients/${id}`} className="text-sm text-ink-soft hover:text-ink">
          ← {client.name}
        </Link>
        <div className="flex gap-2">
          <LargePrintToggle />
          <PrintButton />
        </div>
      </StaggerItem>

      <StaggerItem as="header" className="glass glass-frost rounded-[28px] p-7 backdrop-blur-xl print:hidden">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Paperwork for {client.name}</h1>
        <p className="mt-1 text-ink-soft">
          Filled in from what the client confirmed. The client adds their SIN, bank details and signature, and sends it
          themselves. Recoup never submits anything.
        </p>
        <Link href={`/clients/${id}/summary`} className="mt-3 inline-block text-sm font-semibold text-accent-ink underline underline-offset-2">
          Take-home summary for the client →
        </Link>
      </StaggerItem>

      {forms.map((pkg) => (
        // Wide screens: the steps sit beside the form and stay in view while it scrolls. Narrow: stacked, same width as the form.
        <StaggerItem as="section" key={pkg.program} className="grid gap-4 break-before-page xl:grid-cols-[minmax(0,1fr)_8.5in] xl:items-start xl:gap-6">
          {/* Sticky lives on a plain wrapper: .glass sets position: relative, which would override it. */}
          <div className="mx-auto w-full max-w-[8.5in] xl:sticky xl:top-24 xl:max-w-none print:hidden">
            <div className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl">
              <h2 className="font-display text-2xl font-bold">{PROGRAMS[pkg.program].name}</h2>
              <ol className="mt-4 space-y-3 text-[15px]">
                {pkg.steps.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-night text-xs font-bold text-white tabular-nums">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              {pkg.kind === "t2201" && (
                <Link href={`/clients/${id}/brief`} className="mt-4 inline-block text-sm font-semibold text-accent-ink underline underline-offset-2">
                  Daily-living summary for the practitioner (Part B) →
                </Link>
              )}
            </div>
          </div>
          <Form pkg={pkg} />
        </StaggerItem>
      ))}

      {steps.length > 0 && (
        <StaggerItem as="section" className="glass glass-solid rounded-3xl p-6 backdrop-blur-xl print:hidden">
          <h2 className="font-display text-xl font-bold">No form needed</h2>
          <ul className="mt-2 space-y-2 text-[15px]">
            {steps.map((pkg) => (
              <li key={pkg.program}>
                <span className="font-semibold">{PROGRAMS[pkg.program].name}:</span> {pkg.steps.join(" ")}
              </li>
            ))}
          </ul>
        </StaggerItem>
      )}
    </Stagger>
  );
}
