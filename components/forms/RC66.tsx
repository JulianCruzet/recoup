export type RC66Data = {
  applicant: { firstName: string; lastName: string; dateOfBirth: string; address: string; city: string; province: string; postalCode: string; maritalStatus: string };
  spouse?: { firstName: string; lastName: string; dateOfBirth: string };
  children: { firstName: string; lastName: string; dateOfBirth: string }[];
  residency: string; // e.g. "Canadian citizen"
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

export function RC66({ data }: { data: RC66Data }) {
  const { applicant, spouse, children } = data;

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
          <h1 className="text-xl font-bold">Canada Child Benefits Application</h1>
          <p className="text-xs">RC66 E</p>
        </div>
        <p className="text-xs font-semibold">Protected B when completed</p>
      </header>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Step 1 – Information about you</h2>
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
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">
          Step 2 – Information about your spouse or common-law partner
        </h2>
        {spouse ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="First name" value={spouse.firstName} />
            <Field label="Last name" value={spouse.lastName} />
            <Field label="Social insurance number" fillIn />
            <Field label="Date of birth" value={spouse.dateOfBirth} />
          </div>
        ) : (
          <p className="mt-3">Not applicable</p>
        )}
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Step 3 – Information about your children</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="font-semibold">
                <th className="border border-black px-2 py-1">First name</th>
                <th className="border border-black px-2 py-1">Last name</th>
                <th className="border border-black px-2 py-1">Date of birth</th>
                <th className="border border-black bg-yellow-50 px-2 py-1">Place of birth (client fills in)</th>
                <th className="border border-black bg-yellow-50 px-2 py-1">
                  Date you became the primary caregiver (client fills in)
                </th>
              </tr>
            </thead>
            <tbody className="font-mono text-[14px]">
              {children.map((child, i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-1">{child.firstName}</td>
                  <td className="border border-black px-2 py-1">{child.lastName}</td>
                  <td className="border border-black px-2 py-1">{child.dateOfBirth}</td>
                  <td className="border border-black bg-yellow-50 px-2 py-1" />
                  <td className="border border-black bg-yellow-50 px-2 py-1" />
                </tr>
              ))}
              <tr>
                <td className="border border-black px-2 py-3" />
                <td className="border border-black px-2 py-3" />
                <td className="border border-black px-2 py-3" />
                <td className="border border-black bg-yellow-50 px-2 py-3" />
                <td className="border border-black bg-yellow-50 px-2 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Step 4 – Your status in Canada</h2>
        <div className="mt-3">
          <Field label="Status" value={data.residency} />
        </div>
      </section>

      <section>
        <h2 className="mt-5 border-b-2 border-black pb-1 text-sm font-bold">Step 5 – Certification</h2>
        <p className="mt-3">I certify that the information given on this form is correct and complete.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Signature" fillIn />
          <Field label="Date" fillIn />
        </div>
      </section>
    </article>
  );
}
