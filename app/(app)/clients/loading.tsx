const ROWS = [0, 1, 2];

export default function Loading() {
  return (
    <div aria-busy="true" className="glass glass-solid mt-8 rounded-3xl p-2">
      <span className="sr-only">Loading clients</span>
      {ROWS.map((row) => (
        <div key={row} className="flex items-center gap-6 px-6 py-5">
          <div className="size-11 rounded-full bg-ink/10 animate-pulse" />
          <div>
            <div className="h-3 w-40 rounded bg-ink/10 animate-pulse" />
            <div className="mt-2 h-3 w-72 rounded bg-ink/10 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
