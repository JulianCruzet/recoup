import type { EligibilityStatus } from "@/lib/types";

const STYLES: Record<EligibilityStatus, { label: string; classes: string; dot: string | null }> = {
  likely: { label: "Likely", classes: "bg-likely/12 text-likely", dot: "bg-current" },
  possible: { label: "Possible", classes: "bg-possible/12 text-possible", dot: "border border-current" },
  not_eligible: { label: "Not eligible", classes: "bg-not-eligible/12 text-not-eligible", dot: null },
};

export function StatusBadge({ status }: { status: EligibilityStatus }) {
  const style = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.classes}`}>
      {style.dot && <span aria-hidden="true" className={`size-1.5 rounded-full ${style.dot}`} />}
      {style.label}
    </span>
  );
}
