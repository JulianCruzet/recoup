const formatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

/** "$31,107" for once-off amounts, "$3,480/yr" for yearly ones. Whole dollars, en-CA, no cents. */
export function formatMoney(amount: number, cadence: "once" | "year" = "once"): string {
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const text = formatter.format(safe).replace("CA$", "$");
  return cadence === "year" ? `${text}/yr` : text;
}
