"use client";

const SCRIPT = [
  "An assistant helps me take notes while we talk, so I can focus on you. It's software, and it can make mistakes, so I'll check everything with you.",
  "It only listens to this conversation. It never asks for or keeps your SIN, and it doesn't share anything outside this centre.",
  "It gives us information about benefits you may qualify for. It isn't legal or tax advice, and nothing is decided by it.",
  "You stay in control: you sign every form yourself, and nothing is sent anywhere without you.",
  "If you'd rather I just type notes instead, that's completely fine.",
];

export function ConsentPanel({
  clientName,
  onRecord,
  onNotes,
}: {
  clientName: string;
  onRecord: () => void;
  onNotes: () => void;
}) {
  return (
    <section className="glass glass-solid max-w-2xl rounded-3xl p-8">
      <h2 className="font-display text-3xl font-bold tracking-tight">Before we start</h2>
      <p className="mt-2 text-ink-soft">{`Read this to ${clientName} and check they're comfortable.`}</p>
      <div className="mt-6 space-y-3 text-[17px] leading-relaxed">
        {SCRIPT.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRecord}
          className="rounded-full bg-ink px-6 py-3 font-semibold text-paper"
        >
          They agree, start listening
        </button>
        <button
          type="button"
          onClick={onNotes}
          className="rounded-full border border-ink/20 bg-white/60 px-6 py-3 font-semibold"
        >
          Type notes instead
        </button>
      </div>
      <p className="mt-4 text-sm text-ink-soft">Consent is recorded with the time and your name.</p>
    </section>
  );
}
