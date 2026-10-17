export type T2201Data = {
  person: { firstName: string; lastName: string; dateOfBirth: string; address: string; city: string; province: string; postalCode: string };
  /** Present when someone else (e.g. a parent) claims the credit for the person with the disability. */
  claimant?: { firstName: string; lastName: string; relationship: string; livesWithPerson: boolean };
  /** Ask CRA to apply the credit to previous years' returns. */
  adjustPreviousYears: boolean;
  /** Year the family reports the impairment began (shown as a note for the practitioner). */
  impairmentSinceYear?: number;
};

function Field({
  label,
  value,
  fillIn = false,
  className = "",
}: {
  label: string;
  value?: string;
  fillIn?: boolean;
  className?: string;
}) {
  return (
    <div className={`border border-black px-2 pt-1 pb-1.5 ${fillIn ? "bg-yellow-50" : ""} ${className}`}>
      <span className="block text-[10px] uppercase tracking-wide text-black/60">
        {label}
        {fillIn && " (client fills in)"}
      </span>
      <span className="block min-h-5 font-mono text-[14px]">{fillIn ? "" : value}</span>
    </div>
  );
}

function Checkbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="mt-2 flex items-start gap-2">
      <span className="inline-block size-3.5 border border-black align-middle text-center text-[11px] leading-none">
        {checked ? "✓" : null}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function T2201PartA({ data }: { data: T2201Data }) {
  const { person, claimant } = data;

  return (
    <article className="relative mx-auto max-w-[8.5in] overflow-hidden bg-white p-10 text-[13px] leading-snug text-black shadow-xl print:shadow-none">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] select-none whitespace-nowrap text-6xl font-black text-black/[0.06]">
        MOCK – NOT A GOVERNMENT FORM
      </div>

      <div className="mb-4 rounded border border-black px-3 py-1 text-center text-xs font-bold uppercase">
        Mock form prepared by Recoup for practice and review. Not for submission to CRA.
      </div>

      <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-2">
        <div>
          <h1 className="text-xl font-bold">Disability Tax Credit Certificate</h1>
          <p className="text-xs">T2201 E – Part A</p>
        </div>
        <p className="text-xs font-semibold">Protected B when completed</p>
      </header>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">
          Section 1 – Information about the person with the disability
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="First name" value={person.firstName} />
          <Field label="Last name" value={person.lastName} />
          <Field label="Social insurance number" fillIn />
          <Field label="Date of birth (YYYY-MM-DD)" value={person.dateOfBirth} />
          <Field label="Mailing address" value={person.address} className="col-span-2" />
          <Field label="City" value={person.city} />
          <Field label="Province" value={person.province} />
          <Field label="Postal code" value={person.postalCode} />
        </div>
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">
          Section 2 – Information about the person claiming the disability amount
        </h2>
        {claimant ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field label="First name" value={claimant.firstName} />
              <Field label="Last name" value={claimant.lastName} />
              <Field label="Social insurance number" fillIn />
              <Field label="Relationship to the person with the disability" value={claimant.relationship} />
            </div>
            <Checkbox checked={claimant.livesWithPerson} label="The person with the disability lives with me" />
          </>
        ) : (
          <p className="mt-3">Not applicable: the person with the disability is claiming the amount.</p>
        )}
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Section 3 – Adjustment request</h2>
        <Checkbox
          checked={data.adjustPreviousYears}
          label="I want the CRA to adjust my tax returns for all applicable years once this certificate is approved."
        />
        {data.impairmentSinceYear !== undefined && (
          <p className="mt-2 text-xs">Family reports the impairment began in {data.impairmentSinceYear}.</p>
        )}
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Section 4 – Certification</h2>
        <p className="mt-3">I certify that the information given on this form is correct and complete.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Signature" fillIn />
          <Field label="Date" fillIn />
        </div>
      </section>

      <div className="mt-5 border-2 border-dashed border-black p-3 text-center">
        Part B is completed and signed by a medical practitioner.
      </div>
    </article>
  );
}
