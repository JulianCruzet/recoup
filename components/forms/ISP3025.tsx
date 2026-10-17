export type ISP3025Data = {
  applicant: { firstName: string; lastName: string; dateOfBirth: string; address: string; city: string; province: string; postalCode: string; maritalStatus: string };
  /** Estimated income for the year, excluding OAS and GIS. */
  estimatedIncome: number;
  requestRetroactive: boolean;
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

export function ISP3025({ data }: { data: ISP3025Data }) {
  const { applicant } = data;

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
          <h1 className="text-xl font-bold">Application for the Guaranteed Income Supplement</h1>
          <p className="text-xs">ISP-3025</p>
        </div>
        <p className="text-xs font-semibold">Protected B when completed</p>
      </header>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Section A – Your information</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="First name" value={applicant.firstName} />
          <Field label="Last name" value={applicant.lastName} />
          <Field label="Social insurance number" fillIn />
          <Field label="Date of birth" value={applicant.dateOfBirth} />
          <Field label="Mailing address" value={applicant.address} className="col-span-2" />
          <Field label="City" value={applicant.city} />
          <Field label="Province" value={applicant.province} />
          <Field label="Postal code" value={applicant.postalCode} />
          <Field label="Marital status" value={applicant.maritalStatus} />
        </div>
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Section B – Your income</h2>
        <div className="mt-3">
          <Field
            label="Estimated income this year, not counting OAS or GIS"
            value={`$${data.estimatedIncome.toLocaleString("en-CA")}`}
          />
        </div>
        <p className="mt-2 text-xs">
          GIS is based on last year&apos;s tax return, so file any missing returns too.
        </p>
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Section C – Retroactive payments</h2>
        <Checkbox
          checked={data.requestRetroactive}
          label="I am asking for GIS payments for up to 11 months before the month this application is received."
        />
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Section D – Direct deposit</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="Institution number" fillIn />
          <Field label="Transit number" fillIn />
          <Field label="Account number" fillIn />
        </div>
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Section E – Signature</h2>
        <p className="mt-3">I declare that the information given on this application is true and complete.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Signature" fillIn />
          <Field label="Date" fillIn />
        </div>
      </section>
    </article>
  );
}
