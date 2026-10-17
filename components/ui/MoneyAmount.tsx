import { formatMoney } from "@/lib/format";

const SIZES = {
  sm: "text-sm font-semibold",
  md: "text-lg font-semibold",
  lg: "font-display text-4xl font-extrabold tracking-tight",
} as const;

export function MoneyAmount({
  amount,
  cadence = "once",
  size = "md",
}: {
  amount: number;
  cadence?: "once" | "year";
  size?: "sm" | "md" | "lg";
}) {
  return <span className={`tabular-nums ${SIZES[size]}`}>{formatMoney(amount, cadence)}</span>;
}
